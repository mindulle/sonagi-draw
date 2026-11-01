import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { RawData } from 'ws'

export const DRAWINGS_DIR = process.env.DRAWINGS_DIR || '/home/ubuntu/llm-wiki/03_Resources/Drawings'

export interface BridgeClient {
	id: string
	socket: any
	clientType: string
	currentFile?: string
	currentRoomId?: string
	lastSeen: number
}

export interface BridgeCommandMessage {
	id: string
	type: 'execute'
	action: string
	params: any
}

export interface BridgeResponseMessage {
	id: string
	ok: boolean
	result?: any
	error?: string
}

// Map of active connected clients
const clients = new Map<string, BridgeClient>()
// Pending command promises awaiting response from clients
const pendingCommands = new Map<
	string,
	{
		resolve: (val: any) => void
		reject: (err: any) => void
		timer: NodeJS.Timeout
	}
>()

export function isLocalhost(ipOrReq: any): boolean {
	if (!ipOrReq) return false
	const ip = typeof ipOrReq === 'string' ? ipOrReq : ipOrReq.ip || ipOrReq.socket?.remoteAddress || ''
	return (
		ip === '127.0.0.1' ||
		ip === '::1' ||
		ip === '::ffff:127.0.0.1' ||
		ip.startsWith('127.') ||
		ip === 'localhost'
	)
}

export function toRichText(text: string) {
	return {
		type: 'doc',
		content: (text || '')
			.split('\n')
			.map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' }))
	}
}

export function registerBridgeClient(socket: any, query: Record<string, any> = {}): BridgeClient {
	const clientId = randomUUID()
	const client: BridgeClient = {
		id: clientId,
		socket,
		clientType: query.clientType || 'web',
		currentFile: query.file ? String(query.file).replace(/\.tldr$/, '') : undefined,
		currentRoomId: query.roomId ? String(query.roomId) : undefined,
		lastSeen: Date.now()
	}

	clients.set(clientId, client)

	socket.on('message', (raw: RawData) => {
		try {
			const str = typeof raw === 'string' ? raw : raw.toString('utf-8')
			const msg = JSON.parse(str)

			if (msg.type === 'ping') {
				client.lastSeen = Date.now()
				socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
				return
			}

			if (msg.type === 'status_update') {
				if (msg.currentFile) client.currentFile = String(msg.currentFile).replace(/\.tldr$/, '')
				if (msg.currentRoomId) client.currentRoomId = String(msg.currentRoomId)
				client.lastSeen = Date.now()
				return
			}

			if (msg.id && pendingCommands.has(msg.id)) {
				const pending = pendingCommands.get(msg.id)!
				clearTimeout(pending.timer)
				pendingCommands.delete(msg.id)

				if (msg.ok) {
					pending.resolve(msg.result || msg)
				} else {
					pending.reject(new Error(msg.error || 'Client execution failed'))
				}
			}
		} catch (e) {
			console.error('[Bridge Socket Message Error]', e)
		}
	})

	socket.on('close', () => {
		clients.delete(clientId)
	})

	return client
}

export function getConnectedClientsCount(): number {
	return clients.size
}

export function getConnectedClients(): Array<{ id: string; clientType: string; currentFile?: string; currentRoomId?: string }> {
	return Array.from(clients.values()).map((c) => ({
		id: c.id,
		clientType: c.clientType,
		currentFile: c.currentFile,
		currentRoomId: c.currentRoomId
	}))
}

/**
 * Dispatches command to a connected WebSocket client.
 * Returns response if successful, or null if no suitable client connected.
 */
export async function dispatchToClient(action: string, params: any, timeoutMs = 4000): Promise<any | null> {
	if (clients.size === 0) return null

	const targetFile = params.file ? String(params.file).replace(/\.tldr$/, '') : null
	const targetRoom = params.roomId ? String(params.roomId) : null

	let client: BridgeClient | undefined

	if (targetFile) {
		client = Array.from(clients.values()).find((c) => c.currentFile === targetFile)
	} else if (targetRoom) {
		client = Array.from(clients.values()).find((c) => c.currentRoomId === targetRoom)
	}

	// Fallback to any connected client if no exact match found
	if (!client) {
		client = Array.from(clients.values())[0]
	}

	if (!client || client.socket.readyState !== 1 /* OPEN */) {
		return null
	}

	const cmdId = randomUUID()
	const msg: BridgeCommandMessage = {
		id: cmdId,
		type: 'execute',
		action,
		params
	}

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			pendingCommands.delete(cmdId)
			reject(new Error(`Bridge client timed out after ${timeoutMs}ms`))
		}, timeoutMs)

		pendingCommands.set(cmdId, { resolve, reject, timer })

		try {
			client!.socket.send(JSON.stringify(msg))
		} catch (err) {
			clearTimeout(timer)
			pendingCommands.delete(cmdId)
			reject(err)
		}
	})
}

/**
 * Fallback: Executes drawing manipulation directly against local .tldr JSON file on disk.
 */
export function executeFileStoreFallback(action: string, args: any): any {
	const fileName = (args.file || args.roomId || '').replace(/\.tldr$/, '').trim()
	if (!fileName) {
		throw new Error('Missing file parameter for file-store fallback')
	}

	const filePath = join(DRAWINGS_DIR, `${fileName}.tldr`)
	if (!existsSync(filePath)) {
		throw new Error(`Drawing file not found: ${filePath}`)
	}

	const fileContent = readFileSync(filePath, 'utf-8')
	const doc = JSON.parse(fileContent)
	if (!doc.store) {
		throw new Error('Invalid .tldr format: missing store')
	}

	const store = doc.store
	const now = Date.now()

	// Find highest index among shapes
	const existingShapes = Object.values(store).filter((r: any) => r && r.typeName === 'shape') as any[]
	const shapeCount = existingShapes.length
	const nextIndex = `a${(shapeCount + 1).toString().padStart(3, '0')}`

	if (action === 'add_sticky_note') {
		const shapeId = `shape:${randomUUID()}`
		const richText = toRichText(args.text || '')
		store[shapeId] = {
			id: shapeId,
			typeName: 'shape',
			type: 'note',
			x: Number(args.x) || 100,
			y: Number(args.y) || 100,
			rotation: 0,
			index: nextIndex,
			parentId: args.pageId || 'page:page',
			isLocked: false,
			opacity: 1,
			meta: {},
			props: {
				color: args.color || 'yellow',
				size: 'm',
				richText
			}
		}
		writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8')
		return { ok: true, shapeId, pageId: args.pageId || 'page:page', fallback: 'file-store' }
	}

	if (action === 'add_wireframe_box') {
		const shapeId = `shape:${randomUUID()}`
		const w = Number(args.w) || 200
		const h = Number(args.h) || 100
		store[shapeId] = {
			id: shapeId,
			typeName: 'shape',
			type: 'geo',
			x: Number(args.x) || 100,
			y: Number(args.y) || 100,
			rotation: 0,
			index: nextIndex,
			parentId: args.pageId || 'page:page',
			isLocked: false,
			opacity: 1,
			meta: {},
			props: {
				geo: 'rectangle',
				w,
				h,
				color: 'grey',
				fill: 'none'
			}
		}

		let labelId: string | null = null
		if (args.text) {
			labelId = `shape:${randomUUID()}`
			store[labelId] = {
				id: labelId,
				typeName: 'shape',
				type: 'text',
				x: (Number(args.x) || 100) + w / 2 - 100,
				y: (Number(args.y) || 100) + h / 2 - 20,
				rotation: 0,
				index: `a${(shapeCount + 2).toString().padStart(3, '0')}`,
				parentId: args.pageId || 'page:page',
				isLocked: false,
				opacity: 1,
				meta: {},
				props: {
					color: 'black',
					size: 'm',
					w: 200,
					textAlign: 'middle',
					autoSize: true,
					richText: toRichText(args.text)
				}
			}
		}

		writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8')
		return { ok: true, shapeId, labelId, pageId: args.pageId || 'page:page', fallback: 'file-store' }
	}

	if (action === 'get_room_state' || action === 'get_page_shapes') {
		const shapes = Object.values(store).filter((r: any) => r && r.typeName === 'shape')
		const pages = Object.values(store)
			.filter((r: any) => r && r.typeName === 'page')
			.map((p: any) => ({ id: p.id, name: p.name }))

		return {
			ok: true,
			shapes,
			availablePages: pages.length > 0 ? pages : [{ id: 'page:page', name: 'Page 1' }],
			fallback: 'file-store'
		}
	}

	if (action === 'push_to_inbox') {
		const items = args.items || []
		let inbox = Object.values(store).find((r: any) => r && r.type === 'wired-mcp-inbox') as any
		if (inbox) {
			let existing: any[] = []
			try {
				existing = JSON.parse(inbox.props.payload || '[]')
			} catch (_) {}
			const merged = [...existing, ...items]
			inbox.props.payload = JSON.stringify(merged)
			if (args.title) inbox.props.title = args.title
			writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8')
			return { ok: true, created: false, shapeId: inbox.id, itemCount: merged.length, fallback: 'file-store' }
		} else {
			const shapeId = `shape:${randomUUID()}`
			store[shapeId] = {
				id: shapeId,
				typeName: 'shape',
				type: 'wired-mcp-inbox',
				x: 200,
				y: 200,
				rotation: 0,
				index: nextIndex,
				parentId: args.pageId || 'page:page',
				isLocked: false,
				opacity: 1,
				meta: {},
				props: {
					w: 420,
					h: 320,
					title: args.title || 'MCP Agent Inbox',
					payload: JSON.stringify(items)
				}
			}
			writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8')
			return { ok: true, created: true, shapeId, itemCount: items.length, fallback: 'file-store' }
		}
	}

	throw new Error(`Unsupported action for file-store fallback: ${action}`)
}

/**
 * Primary entry point for Local API Bridge command execution.
 * Tries live WebSocket client first. If none available, falls back to direct store execution.
 */
export async function executeBridgeCommand(args: any): Promise<any> {
	const action = args.action
	if (!action) {
		throw new Error('Missing "action" in bridge command')
	}

	// 1. Try dispatching to active WebSocket client
	try {
		const clientResult = await dispatchToClient(action, args, 3000)
		if (clientResult) {
			return { ok: true, ...clientResult, execution: 'live-client' }
		}
	} catch (err: any) {
		console.warn(`[Bridge] Client dispatch failed (${err?.message || err}), attempting direct store fallback`)
	}

	// 2. Direct store fallback
	return executeFileStoreFallback(action, args)
}
