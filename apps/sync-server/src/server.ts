import "dotenv/config"
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: "https://4b69a39699591b04328705f819ed1bb3@o4504455820869632.ingest.us.sentry.io/4511766347120640",
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import fastify from 'fastify'
import type { RawData } from 'ws'
import { loadAsset, storeAsset } from './assets'
import { makeOrLoadRoom } from './rooms'
import { unfurl } from './unfurl'

import fs from 'fs/promises'
import path from 'path'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { withFileLock } from './fileLock'



const PORT = 5858

// For this example we use a simple fastify server with the official websocket plugin
// To keep things simple we're skipping normal production concerns like rate limiting and input validation.
const app = fastify()
app.register(websocketPlugin)
app.register(cors, { origin: '*' })

const DATA_URL_RE = /^data:([a-zA-Z0-9/+.-]+);base64,([\s\S]+)$/

/**
 * 스냅샷 안의 base64 이미지(data:...)를 MinIO 로 올리고 src 를 /uploads/<key> 로 바꾼다.
 * .tldr 파일이 수 MB 로 부풀어 저장·해시 비용이 커지는 것을 막는다.
 */
async function externalizeInlineAssets(store: Record<string, any>): Promise<number> {
	let converted = 0
	for (const rec of Object.values(store)) {
		if (!rec || rec.typeName !== 'asset') continue
		const props = rec.props || {}
		const src = typeof props.src === 'string' ? props.src : ''
		const match = DATA_URL_RE.exec(src)
		if (!match) continue
		const mime = match[1]
		const buf = Buffer.from(match[2], 'base64')
		if (buf.length === 0) continue
		const ext = (mime.split('/')[1] || 'bin').split('+')[0].replace(/[^a-z0-9]/gi, '')
		const key = `${crypto.createHash('sha1').update(buf).digest('hex')}.${ext}`
		await storeAsset(key, Readable.from(buf))
		props.src = `/uploads/${key}`
		if (!props.mimeType) props.mimeType = mime
		rec.props = props
		converted++
	}
	return converted
}

/** 파일 내용 해시 기반 버전. mtime/size 보다 정확하다. */
function contentVersion(content: string): string {
	return `${crypto.createHash('sha1').update(content).digest('hex').slice(0, 16)}-${content.length.toString(36)}`
}



// ─────────────────────────────────────────────────────────────
// API 인증 게이트
// Cloudflare 터널도 로컬(127.0.0.1)로 보이기 때문에, "루프백 + CF 헤더 없음"만 신뢰한다.
// - 로컬 에이전트(MCP, Playwright): 쿠키 없이 통과
// - 외부 브라우저: /auth 로 비밀번호 로그인 후 세션 쿠키 필요
// ─────────────────────────────────────────────────────────────
const DRAW_APP_PASSWORD = process.env.DRAW_APP_PASSWORD || ''
const DRAW_SESSION_SECRET = process.env.DRAW_SESSION_SECRET || ''
const AUTH_COOKIE = 'draw_session'

function sha256(value: string): string {
	return crypto.createHash('sha256').update(value).digest('hex')
}

function sessionToken(): string {
	return crypto.createHmac('sha256', DRAW_SESSION_SECRET || 'insecure').update(sha256(DRAW_APP_PASSWORD)).digest('hex')
}

function parseCookies(header?: string): Record<string, string> {
	const out: Record<string, string> = {}
	if (!header) return out
	for (const part of header.split(';')) {
		const idx = part.indexOf('=')
		if (idx === -1) continue
		out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
	}
	return out
}

function isTrustedLocalRequest(req: any): boolean {
	const ip = req.ip || req.socket?.remoteAddress || ''
	const loopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('127.')
	const viaCloudflare = Boolean(req.headers['cf-ray'] || req.headers['cf-connecting-ip'])
	return loopback && !viaCloudflare
}

function hasValidSession(req: any): boolean {
	const token = parseCookies(req.headers.cookie)[AUTH_COOKIE]
	return Boolean(token) && token === sessionToken()
}

app.post('/api/auth', async (req, res) => {
	const body = (req.body as any) || {}
	if (!DRAW_APP_PASSWORD) {
		res.status(503).send({ error: 'auth_not_configured', message: 'DRAW_APP_PASSWORD 가 설정되지 않았습니다.' })
		return
	}
	const ok = typeof body.password === 'string' && sha256(body.password) === sha256(DRAW_APP_PASSWORD)
	if (!ok) {
		res.status(401).send({ error: 'invalid_password' })
		return
	}
	const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
	res.header('Set-Cookie', `${AUTH_COOKIE}=${sessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`)
	res.send({ ok: true })
})

app.get('/api/auth/status', async (req, res) => {
	res.send({ configured: Boolean(DRAW_APP_PASSWORD), authenticated: hasValidSession(req) || isTrustedLocalRequest(req) })
})

app.addHook('onRequest', async (req, res) => {
	const url = req.url || ''
	const protectedApi = url.startsWith('/api/') && !url.startsWith('/api/auth')
	// 업로드 쓰기도 함께 보호한다(공개 버킷에 임의 파일을 밀어넣는 것 방지).
	// 조회(GET/HEAD)는 이미지 렌더를 위해 열어 둔다.
	const protectedUpload = url.startsWith('/uploads/') && req.method !== 'GET' && req.method !== 'HEAD'
	if (!protectedApi && !protectedUpload) return
	if (isTrustedLocalRequest(req)) return
	if (!DRAW_APP_PASSWORD) {
		res.status(503).send({ error: 'auth_not_configured', message: 'API 인증이 설정되지 않았습니다.' })
		return
	}
	if (hasValidSession(req)) return
	res.status(401).send({ error: 'unauthorized' })
})



app.register(async (app) => {
	// This is the main entrypoint for the multiplayer sync
app.addHook('onRequest', async (req) => console.log('REQ:', req.url))
	app.get('/connect/:roomId', { websocket: true }, async (socket, req) => {
		// The roomId comes from the URL pathname
		const roomId = (req.params as any).roomId as string
		// The sessionId is passed from the client as a query param,
		// you need to extract it and pass it to the room.
		const sessionId = (req.query as any)?.['sessionId'] as string

		// At least one message handler needs to
		// be attached before doing any kind of async work
		// https://github.com/fastify/fastify-websocket?tab=readme-ov-file#attaching-event-handlers
		// We collect messages that came in before the room was loaded, and re-emit them
		// after the room is loaded.
		const caughtMessages: RawData[] = []

		const collectMessagesListener = (message: RawData) => {
			caughtMessages.push(message)
		}

		socket.on('message', collectMessagesListener)

		// Here we make or get an existing instance of TLSocketRoom for the given roomId
		const room = makeOrLoadRoom(roomId)
		// and finally connect the socket to the room
		room.handleSocketConnect({ sessionId, socket })

		socket.off('message', collectMessagesListener)

		// Finally, we replay any caught messages so the room can process them
		for (const message of caughtMessages) {
			socket.emit('message', message)
		}
	})

	// To enable blob storage for assets, we add a simple endpoint supporting PUT and GET requests
	// But first we need to allow all content types with no parsing, so we can handle raw data
	app.addContentTypeParser('*', (_, __, done) => done(null))

	// Library endpoints
	app.get('/library', async (req, res) => {
		const { getLibraryItems } = await import('./library')
		res.send(await getLibraryItems())
	})
	
	app.post('/library', async (req, res) => {
		const { addLibraryItem } = await import('./library')
		
		try {
			const chunks: Buffer[] = []
			for await (const chunk of req.raw) {
				chunks.push(chunk)
			}
			const body = Buffer.concat(chunks).toString('utf-8')
			const item = JSON.parse(body)
			
			if (!item.id || !item.name || !item.content) {
				res.status(400).send({ error: 'Invalid payload' })
				return
			}
			
			await addLibraryItem(item)
			res.send({ ok: true })
		} catch (e) {
			res.status(400).send({ error: 'Bad Request' })
		}
	})

	
	// [Drawings API] llm-wiki / drawings support for standalone and proxy modes
	const DRAWINGS_DIR = process.env.DRAWINGS_DIR || '/home/ubuntu/llm-wiki/03_Resources/Drawings'

	app.get('/api/drawings', async (req, res) => {
		const query = (req.query as any) || {}
		const fileName = query.file
		if (fileName) {
			let filePath = path.join(DRAWINGS_DIR, `${fileName}.tldr`)
			try {
				await fs.access(filePath)
			} catch {
				const safeName = fileName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3-]/g, '_')
				const altPath = path.join(DRAWINGS_DIR, `${safeName}.tldr`)
				try {
					await fs.access(altPath)
					filePath = altPath
				} catch {
					res.status(404).send({ error: 'Drawing file not found' })
					return
				}
			}
			const content = await fs.readFile(filePath, 'utf-8')
			const version = contentVersion(content)
			res.header('ETag', `"${version}"`)
			res.header('Cache-Control', 'no-store')
			res.header('Content-Type', 'application/json').send(content)
			return
		}

		try {
			const rawFiles = await fs.readdir(DRAWINGS_DIR)
			const files = await Promise.all(
				rawFiles
					.filter((f) => f.endsWith('.tldr'))
					.map(async (f) => {
						const stat = await fs.stat(path.join(DRAWINGS_DIR, f))
						return {
							name: f.replace(/\.tldr$/, ''),
							size: stat.size,
							updatedAt: stat.mtime
						}
					})
			)
			files.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
			res.send({ files })
		} catch (err: any) {
			res.status(500).send({ error: String(err) })
		}
	})

	app.post('/api/drawings/new', async (req, res) => {
		const body = (req.body as any) || {}
		const rawName = (body.name || `Drawing_${Date.now()}`).trim()
		const safeName = rawName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
		const filePath = path.join(DRAWINGS_DIR, `${safeName}.tldr`)
		try {
			await fs.access(filePath)
			res.status(409).send({ error: '동일한 이름의 도면이 이미 존재합니다.' })
			return
		} catch {}

		const template = {
			schema: { schemaVersion: 2, sequences: { 'com.tldraw.store': 4, 'com.tldraw.asset': 1 } },
			records: [
				{ id: 'document:document', typeName: 'document', gridSize: 10, name: '', meta: {} },
				{ id: 'page:page', name: 'Page 1', index: 'a1', typeName: 'page', meta: {} }
			]
		}
		await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8')
		res.status(201).send({ success: true, name: safeName })
	})

	app.post('/api/drawings/duplicate', async (req, res) => {
		const body = (req.body as any) || {}
		const targetName = (body.name || body.file || '').trim()
		let srcPath = path.join(DRAWINGS_DIR, `${targetName}.tldr`)
		try {
			await fs.access(srcPath)
		} catch {
			const safe = targetName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
			srcPath = path.join(DRAWINGS_DIR, `${safe}.tldr`)
			try {
				await fs.access(srcPath)
			} catch {
				res.status(404).send({ error: '원본 도면을 찾을 수 없습니다.' })
				return
			}
		}

		const copyName = `${targetName}_Copy`
		let destPath = path.join(DRAWINGS_DIR, `${copyName}.tldr`)
		let counter = 1
		while (true) {
			try {
				await fs.access(destPath)
				destPath = path.join(DRAWINGS_DIR, `${copyName}_${counter++}.tldr`)
			} catch {
				break
			}
		}
		await fs.copyFile(srcPath, destPath)
		res.send({ success: true, name: path.basename(destPath, '.tldr') })
	})

	app.post('/api/drawings/rename', async (req, res) => {
		const body = (req.body as any) || {}
		const fromName = (body.from || '').trim()
		const toName = (body.to || '').trim()
		if (!fromName || !toName) {
			res.status(400).send({ error: 'from 및 to 파라미터가 필요합니다.' })
			return
		}
		let srcPath = path.join(DRAWINGS_DIR, `${fromName}.tldr`)
		try {
			await fs.access(srcPath)
		} catch {
			const safe = fromName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
			srcPath = path.join(DRAWINGS_DIR, `${safe}.tldr`)
			try {
				await fs.access(srcPath)
			} catch {
				res.status(404).send({ error: '변경할 대상 도면을 찾을 수 없습니다.' })
				return
			}
		}

		const safeTo = toName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
		const destPath = path.join(DRAWINGS_DIR, `${safeTo}.tldr`)
		try {
			await fs.access(destPath)
			if (srcPath !== destPath) {
				res.status(409).send({ error: '해당 이름의 도면이 이미 존재합니다.' })
				return
			}
		} catch {}

		await fs.rename(srcPath, destPath)
		res.send({ success: true, name: safeTo })
	})

	app.post('/api/drawings/delete', async (req, res) => {
		const body = (req.body as any) || {}
		const targetName = (body.name || body.file || '').trim()
		if (!targetName) {
			res.status(400).send({ error: 'Missing name parameter' })
			return
		}
		let filePath = path.join(DRAWINGS_DIR, `${targetName}.tldr`)
		try {
			await fs.unlink(filePath)
		} catch {
			const safe = targetName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
			filePath = path.join(DRAWINGS_DIR, `${safe}.tldr`)
			try {
				await fs.unlink(filePath)
			} catch {}
		}
		res.send({ success: true })
	})

	app.post('/api/drawings', async (req, res) => {
		const body = (req.body as any) || {}
		const query = (req.query as any) || {}
		const fileName = (body.file || query.file || '').trim()
		if (!fileName) {
			res.status(400).send({ error: 'Missing file parameter' })
			return
		}

		let filePath = path.join(DRAWINGS_DIR, `${fileName}.tldr`)
		try {
			await fs.access(filePath)
		} catch {
			const safeFileName = fileName.replace(/[^a-zA-Z0-9_\uAC00-\uD7A3 .()-]/g, '_')
			filePath = path.join(DRAWINGS_DIR, `${safeFileName}.tldr`)
		}

		// 낙관적 동시성 제어: 클라이언트가 읽은 버전(baseVersion)과 현재 파일 내용 해시가
		// 다르면 다른 주체가 먼저 저장한 것이므로 덮어쓰지 않고 409 를 반환한다.
		const baseVersion = typeof body.baseVersion === 'string' ? body.baseVersion.replace(/^"|"$/g, '') : null

		const result = await withFileLock(fileName, async () => {
			const incoming = body.snapshot || body.data || body
			const incomingStore = (incoming && (incoming.store || (incoming.document && incoming.document.store))) as
				| Record<string, any>
				| undefined
			if (incomingStore) {
				try {
					await externalizeInlineAssets(incomingStore)
				} catch (err) {
					console.warn('[Drawings] asset externalization failed:', err)
				}
			}

			let currentVersion: string | null = null
			try {
				const currentContent = await fs.readFile(filePath, 'utf-8')
				currentVersion = contentVersion(currentContent)
			} catch {
				currentVersion = null
			}

			if (baseVersion && currentVersion && baseVersion !== currentVersion) {
				return { conflict: true as const, currentVersion }
			}

			const serialized = JSON.stringify(incoming, null, 2)
			// 원자적 쓰기: 임시 파일에 쓰고 rename (중간 크래시로 파일이 깨지지 않게)
			const tmpPath = `${filePath}.tmp-${process.pid}`
			await fs.writeFile(tmpPath, serialized, 'utf-8')
			await fs.rename(tmpPath, filePath)
			return { conflict: false as const, newVersion: contentVersion(serialized) }
		})

		if (result.conflict) {
			res.status(409).send({
				error: 'conflict',
				message: '파일이 다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도하세요.',
				currentVersion: result.currentVersion
			})
			return
		}

		res.header('ETag', `"${result.newVersion}"`)
		res.send({
			success: true,
			name: path.basename(filePath, '.tldr'),
			version: result.newVersion
		})
	})

	// [Agentic Injection API] Safe REST Endpoint for Agent/MCP
	app.post('/api/rooms/:roomId/inject', async (req, res) => {
		const roomId = (req.params as any).roomId as string
		const room = makeOrLoadRoom(roomId)
		
		try {
			const chunks: Buffer[] = []
			for await (const chunk of req.raw) {
				chunks.push(chunk)
			}
			const body = Buffer.concat(chunks).toString('utf-8')
			const records = JSON.parse(body) // Should be an array of shapes/records
			
			// We inject records by performing a transaction on the storage
			room.storage.transaction((transaction) => {
				for (const record of records) {
					// Add timestamps/clock info if missing
					transaction.put(record)
				}
			})
			res.send({ ok: true, injected: records.length })
		} catch (e) {
			console.error("[Inject Error]", e)
			res.status(400).send({ error: 'Bad Request', details: String(e) })
		}
	})

	app.delete('/library/:id', async (req, res) => {
		const { removeLibraryItem } = await import('./library')
		const id = (req.params as any).id as string
		await removeLibraryItem(id)
		res.send({ ok: true })
	})

	app.put('/uploads/:id', {}, async (req, res) => {
		const id = (req.params as any).id as string
		await storeAsset(id, req.raw)
		res.send({ ok: true })
	})
	app.get('/uploads/:id', async (req, res) => {
		const id = (req.params as any).id as string
		try {
			const data = await loadAsset(id)
			if (id.endsWith('.mp4')) {
				res.header('Content-Type', 'video/mp4')
				res.header('Accept-Ranges', 'bytes')
			} else if (id.endsWith('.jpg') || id.endsWith('.jpeg')) {
				res.header('Content-Type', 'image/jpeg')
			} else if (id.endsWith('.png')) {
				res.header('Content-Type', 'image/png')
			} else if (id.endsWith('.svg')) {
				res.header('Content-Type', 'image/svg+xml')
			}
			res.header('Access-Control-Allow-Origin', '*')
			// Remove default-src 'none' which blocks <img> and <video> embedding in modern browsers
			res.header('Cross-Origin-Resource-Policy', 'cross-origin')
			res.send(data)
		} catch (err: any) {
			res.status(404).send({ ok: false, error: 'Asset not found', id })
		}
	})

	// To enable unfurling of bookmarks, we add a simple endpoint that takes a URL query param
	


	app.get('/unfurl', async (req, res) => {
		const url = (req.query as any).url as string
		res.send(await unfurl(url))
	})

	// Karakeep (Hoarder) Bookmarks Proxy Endpoint (DRAW-14)
	app.get('/api/karakeep/bookmarks', async (req, res) => {
		const query = req.query as { q?: string; limit?: string; cursor?: string }
		const q = query.q?.trim() || ''
		const limit = Math.min(Math.max(parseInt(query.limit || '30', 10) || 30, 1), 100)
		const cursor = query.cursor || ''

		const baseUrl = process.env.KARAKEEP_BASE_URL || 'https://ref.sonagi.space'
		const apiKey = process.env.KARAKEEP_API_KEY || 'ak2_3dcbb951d06ccbae3823_b3732db0023eff41e015c8ea31a26a7d'

		const url = new URL('/api/v1/bookmarks', baseUrl)
		if (q) url.searchParams.set('q', q)
		url.searchParams.set('limit', String(limit))
		if (cursor) url.searchParams.set('cursor', cursor)

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 6000)

		try {
			const upstreamRes = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					Accept: 'application/json'
				},
				signal: controller.signal
			})

			clearTimeout(timeoutId)

			if (!upstreamRes.ok) {
				const errorText = await upstreamRes.text()
				res.status(upstreamRes.status).send({
					ok: false,
					error: `Karakeep API error: ${upstreamRes.status} ${upstreamRes.statusText}`,
					details: errorText
				})
				return
			}

			const data = (await upstreamRes.json()) as any
			res.send({
				ok: true,
				bookmarks: data.bookmarks || [],
				nextCursor: data.nextCursor || null
			})
		} catch (err: any) {
			clearTimeout(timeoutId)
			const isAbort = err.name === 'AbortError'
			res.status(504).send({
				ok: false,
				error: isAbort ? 'Karakeep API request timed out (6s)' : 'Failed to connect to Karakeep API',
				details: String(err.message || err)
			})
		}
	})

	// [DRAW-9] Jambot-style On-Canvas AI Ideation Quick Gestures Endpoint
	app.post('/api/ai/ideate', async (req, res) => {
		const { generateAiIdeas, parseRequestBody } = await import('./ai')
		try {
			const body = await parseRequestBody(req)
			const { mode, text, context } = body || {}

			if (!text || typeof text !== 'string' || !text.trim()) {
				res.status(400).send({
					ok: false,
					error: 'Missing or empty "text" parameter in request body'
				})
				return
			}

			const result = await generateAiIdeas({
				mode: (mode as any) || 'branch',
				text: text.trim(),
				context
			})

			res.send(result)
		} catch (err: any) {
			console.error('[AI Ideate Error]', err)
			res.status(500).send({
				ok: false,
				error: 'Internal server error in ideate endpoint',
				details: String(err?.message || err)
			})
		}
	})

	// [DRAW-2] Make Real: Wireframe to Interactive HTML/Tailwind Prototype
	app.post('/api/ai/make-real', async (req, res) => {
		const { executeMakeReal } = await import('./makereal')
		const { parseRequestBody } = await import('./ai')
		try {
			const body = await parseRequestBody(req)
			const result = await executeMakeReal(body || {})
			res.send(result)
		} catch (err: any) {
			console.error('[Make Real Error]', err)
			res.status(500).send({
				ok: false,
				error: 'Failed to generate Make Real prototype',
				details: String(err?.message || err)
			})
		}
	})

	// [DRAW-20] On-Canvas 1-Click Still Image Generation Endpoint
	app.post('/api/ai/image-generate', async (req, res) => {
		const { parseRequestBody } = await import('./ai')
		try {
			const body = await parseRequestBody(req)
			const { prompt, model = 'gemini-3.1-flash-image' } = body || {}

			if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
				res.status(400).send({ ok: false, error: 'Missing prompt' })
				return
			}

			const adapterResp = await fetch('http://127.0.0.1:38108/v1/images/generations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: prompt.trim(), model })
			})

			if (!adapterResp.ok) {
				const errText = await adapterResp.text()
				res.status(502).send({ ok: false, error: 'Image adapter upstream error', details: errText })
				return
			}

			const data = (await adapterResp.json()) as any
			const url = data.data?.[0]?.url || data.data?.[0]?.b64_json
			res.send({ ok: true, url })
		} catch (err: any) {
			console.error('[AI Image Generate Error]', err)
			res.status(500).send({ ok: false, error: err?.message || String(err) })
		}
	})

	// [DRAW-20] On-Canvas 1-Click Veo 3.1 Video Generation Endpoint
	app.post('/api/ai/video-generate', async (req, res) => {
		const { parseRequestBody } = await import('./ai')
		const { spawn } = await import('child_process')
		const fs = (await import('fs/promises')).default
		const path = (await import('path')).default

		try {
			const body = await parseRequestBody(req)
			const { prompt, initialFrame, aspect = '16:9', profile = 'mindulle-design' } = body || {}

			if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
				res.status(400).send({ ok: false, error: 'Missing prompt' })
				return
			}

			const assetsDir = path.resolve('./.assets')
			await fs.mkdir(assetsDir, { recursive: true })
			const assetId = `veo_${Date.now()}.mp4`
			const outputPath = path.join(assetsDir, assetId)

			// Resolve initial frame if provided (e.g. /uploads/scene_01_frost.jpg or absolute path)
			let inputImagePath: string | null = null
			if (initialFrame && typeof initialFrame === 'string') {
				if (initialFrame.startsWith('/uploads/')) {
					const cleanName = initialFrame.replace('/uploads/', '').split('?')[0]
					inputImagePath = path.join(assetsDir, cleanName)
				} else if (initialFrame.startsWith('/')) {
					inputImagePath = initialFrame
				}
			}

			// If initial frame exists, route through custom Sonagi Veo i2v Bridge
			const sonagiBridgeScript = '/home/ubuntu/sonagi-portfolio/scripts/sonagi_veo_bridge.py'
			const pythonBin = '/home/ubuntu/ai-env/bin/python3'
			const gflowBin = '/home/ubuntu/ai-env/bin/gflow'

			let child: any
			if (inputImagePath && (await fs.stat(inputImagePath).catch(() => null))) {
				console.log('[AI Video] Routing via Custom Sonagi Veo i2v Bridge with initialFrame:', inputImagePath)
				child = spawn(pythonBin, [
					sonagiBridgeScript,
					'-i', inputImagePath,
					'-p', prompt.trim(),
					'-o', outputPath
				])
			} else {
				console.log('[AI Video] Routing via standard gflow video t2v')
				child = spawn(gflowBin, [
					'video', 't2v',
					prompt.trim(),
					'--aspect', aspect,
					'--profile', profile,
					'-o', outputPath
				], {
					env: { ...process.env, GFLOW_CLI_FLOW_HOST: 'auto' }
				})
			}

			let stderrOutput = ''
			child.stderr.on('data', (d) => {
				stderrOutput += d.toString()
			})

			await new Promise((resolve, reject) => {
				child.on('close', (code) => {
					if (code === 0) resolve(code)
					else reject(new Error(`gflow exited with code ${code}: ${stderrOutput.slice(-300)}`))
				})
				child.on('error', reject)
			})

			res.send({
				ok: true,
				videoUrl: `/uploads/${assetId}`,
				assetId
			})
		} catch (err: any) {
			console.error('[AI Video Generate Error]', err)
			res.status(500).send({ ok: false, error: err?.message || String(err) })
		}
	})

	// [DRAW-5] Local API Bridge for AI Agent & MCP Control
	app.get('/api/bridge/ws', { websocket: true }, async (socket, req) => {
		const { registerBridgeClient, isLocalhost } = await import('./bridge')
		if (!isLocalhost(req)) {
			socket.close(1008, 'Forbidden: Localhost only')
			return
		}
		const query = (req.query as any) || {}
		registerBridgeClient(socket, query)
	})

	app.post('/api/bridge/execute', async (req, res) => {
		const { executeBridgeCommand, isLocalhost } = await import('./bridge')
		const { parseRequestBody } = await import('./ai')
		if (!isLocalhost(req)) {
			res.status(403).send({ ok: false, error: 'Forbidden: Localhost access only' })
			return
		}
		try {
			const body = await parseRequestBody(req)
			const result = await executeBridgeCommand(body)
			res.send(result)
		} catch (err: any) {
			console.error('[Bridge Execution Error]', err)
			res.status(500).send({ ok: false, error: err?.message || String(err) })
		}
	})

	app.get('/api/bridge/status', async (req, res) => {
		const { getConnectedClientsCount, getConnectedClients, isLocalhost } = await import('./bridge')
		if (!isLocalhost(req)) {
			res.status(403).send({ ok: false, error: 'Forbidden: Localhost access only' })
			return
		}
		res.send({
			ok: true,
			service: 'sonagi-draw-local-bridge',
			activeClients: getConnectedClientsCount(),
			clients: getConnectedClients()
		})
	})

	// [DRAW-7] Client Diagnostics & Remote Error Tracking Endpoints
	app.post('/api/bridge/logs', async (req, res) => {
		const { recordDiagnosticLog, recordDiagnosticLogsBatch } = await import('./diagnostics')
		const { parseRequestBody } = await import('./ai')
		try {
			const body = await parseRequestBody(req)
			if (Array.isArray(body)) {
				const count = recordDiagnosticLogsBatch(body)
				res.send({ ok: true, received: count })
			} else if (body && typeof body === 'object') {
				const log = recordDiagnosticLog(body)
				res.send({ ok: true, id: log.id })
			} else {
				res.status(400).send({ ok: false, error: 'Invalid payload' })
			}
		} catch (err: any) {
			res.status(500).send({ ok: false, error: err?.message || String(err) })
		}
	})

	app.get('/api/bridge/logs', async (req, res) => {
		const { getDiagnosticLogs } = await import('./diagnostics')
		const query = (req.query as any) || {}
		const limit = query.limit ? parseInt(query.limit, 10) : 50
		const level = query.level ? String(query.level) : undefined
		const type = query.type ? String(query.type) : undefined
		const fileOrRoom = query.fileOrRoom ? String(query.fileOrRoom) : undefined
		const since = query.since ? parseInt(query.since, 10) : undefined

		const logs = getDiagnosticLogs({ limit, level, type, fileOrRoom, since })
		res.send({ ok: true, count: logs.length, logs })
	})

	app.get('/api/bridge/health', async (req, res) => {
		const { getDiagnosticsHealth } = await import('./diagnostics')
		const { getConnectedClientsCount } = await import('./bridge')
		const activeClients = getConnectedClientsCount()
		const health = getDiagnosticsHealth(activeClients)
		res.send(health)
	})
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}

	console.log(`Server started on port ${PORT}`)
})
