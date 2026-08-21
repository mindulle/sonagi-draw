#!/usr/bin/env node
/**
 * canvas_bridge.mjs
 *
 * Safe, official-API bridge for agents/MCP tools to drive the sonagi-draw
 * Tldraw canvas. Instead of writing to SQLite directly (crashes on schema
 * mismatch) or using the buggy REST /api/rooms/:roomId/inject endpoint,
 * this script drives the *real* browser client via Playwright and calls
 * the exposed `window.editor` instance (see apps/web/src/App.tsx onMount).
 *
 * All mutations go through Tldraw's own validated store, so this cannot
 * corrupt the room the way raw SQL injection did.
 *
 * Usage:
 *   node canvas_bridge.mjs <path-to-args.json>
 *
 * args.json shape:
 *   {
 *     "action": "push_to_inbox",
 *     "baseUrl": "https://draw.sonagi.space",   // optional, defaults below
 *     "roomId": "3e4bc060",
 *     "pageName": "🧱 Core Primitives",          // optional, defaults to current page
 *     "title": "MCP Agent 제안",                 // optional, only updates title if given
 *     "items": [{ "text": "..." }, { "imageUrl": "..." }]
 *   }
 *
 * Prints a single JSON line to stdout: { ok: true, ... } | { ok: false, error }
 */

import { chromium } from 'playwright'
import { readFileSync } from 'fs'

const DEFAULT_BASE_URL = 'https://draw.sonagi.space'

async function main() {
	const argsPath = process.argv[2]
	if (!argsPath) {
		throw new Error('Usage: node canvas_bridge.mjs <path-to-args.json>')
	}
	const args = JSON.parse(readFileSync(argsPath, 'utf-8'))
	const { action, roomId, baseUrl = DEFAULT_BASE_URL } = args
	if (!roomId) throw new Error('roomId is required')

	const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
	const page = await browser.newPage()

	const pageErrors = []
	page.on('pageerror', (err) => pageErrors.push(err.message))

	try {
		await page.goto(`${baseUrl}/?room=${encodeURIComponent(roomId)}`, {
			waitUntil: 'networkidle',
			timeout: 30000,
		})
		await page.waitForFunction(() => window.editor !== undefined, { timeout: 20000 })

		let result
		switch (action) {
			case 'push_to_inbox':
				result = await pushToInbox(page, args)
				break
			case 'get_page_shapes':
				result = await getPageShapes(page, args)
				break
			case 'add_sticky_note':
				result = await addStickyNote(page, args)
				break
			case 'add_wireframe_box':
				result = await addWireframeBox(page, args)
				break
			case 'get_room_state':
				result = await getRoomState(page, args)
				break
			case 'create_room_content':
				result = await createRoomContent(page, args)
				break
			case 'generate_moodboard_layout':
				result = await generateMoodboardLayout(page, args)
				break
			default:
				throw new Error(`Unknown action: ${action}`)
		}

		// The tldraw sync client sends store changes to the server over the
		// WebSocket asynchronously; editor.createShapes()/updateShapes() return
		// before that message has necessarily been flushed. Without this wait,
		// closing the browser right after a mutation can drop the shape entirely
		// (verified: get_page_shapes right after add_wireframe_box/add_sticky_note
		// showed 0 shapes without this delay, vs. correctly showing them with it).
		await page.waitForTimeout(1000)

		if (pageErrors.length > 0) {
			// Any uncaught error thrown inside the page during our operation means
			// something is broken (e.g. a shape util crash) even if our own script
			// didn't throw - surface it rather than silently reporting success.
			console.log(JSON.stringify({ ok: false, error: 'Page errors occurred', pageErrors }))
			process.exitCode = 1
		} else {
			console.log(JSON.stringify({ ok: true, ...result }))
		}
	} catch (err) {
		console.log(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }))
		process.exitCode = 1
	} finally {
		await browser.close()
	}
}

async function pushToInbox(page, { pageName, title, items = [], shapeId }) {
	return page.evaluate(
		({ pageName, title, items, shapeId }) => {
			const editor = window.editor
			const pages = editor.getPages()
			const targetPage = pageName ? pages.find((p) => p.name === pageName) : editor.getCurrentPage()
			if (!targetPage) throw new Error(`Page not found: ${pageName}`)
			editor.setCurrentPage(targetPage.id)

			const shapes = editor.getCurrentPageShapes()
			let inbox = shapeId
				? shapes.find((s) => s.id === shapeId)
				: shapes.find((s) => s.type === 'wired-mcp-inbox')

			if (inbox) {
				let existing = []
				try {
					existing = JSON.parse(inbox.props.payload || '[]')
				} catch (e) {
					existing = []
				}
				const merged = [...existing, ...items]
				editor.updateShapes([
					{
						id: inbox.id,
						type: 'wired-mcp-inbox',
						props: {
							...(title ? { title } : {}),
							payload: JSON.stringify(merged),
						},
					},
				])
				return { created: false, shapeId: inbox.id, pageId: targetPage.id, itemCount: merged.length }
			} else {
				// editor.createShapes() returns `this` (the editor), not the created
				// records, so we diff the shape id set before/after to find the new one.
				const beforeIds = new Set(shapes.map((s) => s.id))
				const bounds = editor.getViewportPageBounds()
				editor.createShapes([
					{
						type: 'wired-mcp-inbox',
						x: bounds.center.x - 210,
						y: bounds.center.y - 160,
						props: {
							w: 420,
							h: 320,
							title: title || 'MCP Agent Inbox',
							payload: JSON.stringify(items),
						},
					},
				])
				const after = editor.getCurrentPageShapes()
				const created = after.find((s) => s.type === 'wired-mcp-inbox' && !beforeIds.has(s.id))
				if (!created) throw new Error('Failed to locate newly created wired-mcp-inbox shape')
				return { created: true, shapeId: created.id, pageId: targetPage.id, itemCount: items.length }
			}
		},
		{ pageName, title, items, shapeId }
	)
}

/** Mirrors apps/web/src/libraryTemplates.ts::toRichText - keep in sync. */
function toRichText(text) {
	return {
		type: 'doc',
		content: (text || '')
			.split('\n')
			.map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })),
	}
}

async function addStickyNote(page, { pageId, pageName, text, x, y, color = 'yellow' }) {
	const richText = toRichText(text || '')
	return page.evaluate(
		({ pageId, pageName, x, y, color, richText }) => {
			const editor = window.editor
			const pages = editor.getPages()
			const identifier = pageId || pageName
			const targetPage = identifier
				? pages.find((p) => p.id === identifier || p.name === identifier)
				: editor.getCurrentPage()
			if (!targetPage) throw new Error(`Page not found: ${identifier}`)
			editor.setCurrentPage(targetPage.id)

			const before = new Set(editor.getCurrentPageShapes().map((s) => s.id))
			editor.createShapes([
				{
					type: 'note',
					x,
					y,
					props: { color, richText },
				},
			])
			const after = editor.getCurrentPageShapes()
			const created = after.find((s) => s.type === 'note' && !before.has(s.id))
			if (!created) throw new Error('Failed to locate newly created note shape')
			return { shapeId: created.id, pageId: targetPage.id }
		},
		{ pageId, pageName, x, y, color, richText }
	)
}

async function addWireframeBox(page, { pageId, pageName, x, y, w, h, text }) {
	const richText = text ? toRichText(text) : null
	return page.evaluate(
		({ pageId, pageName, x, y, w, h, text, richText }) => {
			const editor = window.editor
			const pages = editor.getPages()
			const identifier = pageId || pageName
			const targetPage = identifier
				? pages.find((p) => p.id === identifier || p.name === identifier)
				: editor.getCurrentPage()
			if (!targetPage) throw new Error(`Page not found: ${identifier}`)
			editor.setCurrentPage(targetPage.id)

			const before = new Set(editor.getCurrentPageShapes().map((s) => s.id))
			editor.createShapes([
				{
					type: 'geo',
					x,
					y,
					props: { geo: 'rectangle', w, h, color: 'grey', fill: 'none' },
				},
			])
			const afterRect = editor.getCurrentPageShapes()
			const rect = afterRect.find((s) => s.type === 'geo' && !before.has(s.id))
			if (!rect) throw new Error('Failed to locate newly created geo shape')

			let labelId = null
			if (text) {
				const beforeText = new Set(afterRect.map((s) => s.id))
				editor.createShapes([
					{
						type: 'text',
						x: x + w / 2 - 100,
						y: y + h / 2 - 20,
						props: {
							color: 'black',
							size: 'm',
							w: 200,
							textAlign: 'middle',
							autoSize: true,
							richText,
						},
					},
				])
				const afterText = editor.getCurrentPageShapes()
				const label = afterText.find((s) => s.type === 'text' && !beforeText.has(s.id))
				if (label) labelId = label.id
			}
			return { shapeId: rect.id, labelId, pageId: targetPage.id }
		},
		{ pageId, pageName, x, y, w, h, text, richText }
	)
}

/**
 * Replaces server.py's old get_room_state, which read the Python side's local
 * SQLite mirror directly. That mirror is not reliably kept in sync with the
 * real production room (verified: Syncthing isn't even configured for that
 * path), so it could report shapes that were never actually written to the
 * live room, or miss shapes that were. This reads the *actual* live editor
 * state instead, the same way get_page_shapes/get_page_shapes_live already do.
 */
async function getRoomState(page, { pageId, pageName }) {
	return page.evaluate(
		({ pageId, pageName }) => {
			const editor = window.editor
			const pages = editor.getPages()
			const availablePages = pages.map((p) => ({ id: p.id, name: p.name }))

			const serializeShape = (s) => ({
				x: s.x,
				y: s.y,
				rotation: s.rotation,
				isLocked: s.isLocked,
				opacity: s.opacity,
				meta: s.meta,
				id: s.id,
				type: s.type,
				props: s.props,
				parentId: s.parentId,
				index: s.index,
				typeName: s.typeName,
			})

			const identifier = pageId || pageName
			const originalPageId = editor.getCurrentPage().id
			let targetPages = pages
			if (identifier) {
				const found = pages.find((p) => p.id === identifier || p.name === identifier)
				if (!found) throw new Error(`Page not found: ${identifier}`)
				targetPages = [found]
			}

			const shapes = []
			for (const p of targetPages) {
				editor.setCurrentPage(p.id)
				for (const shape of editor.getCurrentPageShapes()) {
					shapes.push(serializeShape(shape))
				}
			}
			// Restore whatever page this headless session originally landed on,
			// out of caution (shouldn't affect other connected clients' own
			// per-session current-page state, but keep this session tidy anyway).
			editor.setCurrentPage(originalPageId)

			return {
				available_pages: availablePages,
				total_shapes: shapes.length,
				shapes,
			}
		},
		{ pageId, pageName }
	)
}

/**
 * Seeds the 3 default pages (Moodboard/Wireframe & UI Kit/User Journey) of a
 * freshly created room with their placeholder content. Replaces server.py's
 * old create_room + generate_wireframe_kit + generate_user_journey, which
 * built raw tldraw records (hand-rolled "index" values like "c001", "c002", ...
 * that don't follow tldraw's actual fractional-indexing format) and wrote them
 * straight into SQLite - the exact class of bug that crashed sync-server.
 * init_db()'s template-copy (pure file copy) is left alone in server.py; this
 * only replaces the *dynamic* per-room content that used to go through
 * add_shape_to_db.
 */
async function createRoomContent(page, { title, issueId }) {
	// richText must be built here in Node scope (page.evaluate() only receives
	// serialized data, not closures), same reason addStickyNote/addWireframeBox
	// above build it outside the evaluate() callback.
	const t = (text) => toRichText(text)

	const moodboardShapes = [
		{ type: 'text', x: 100, y: 50, props: { color: 'black', size: 'xl', w: 200, textAlign: 'middle', autoSize: true, richText: t(`🎨 ${title}`) } },
	]
	if (issueId) {
		moodboardShapes.push({
			type: 'text',
			x: 100,
			y: 120,
			props: { color: 'blue', size: 's', w: 200, textAlign: 'middle', autoSize: true, richText: t(`🔗 Associated with Issue: ${issueId}`) },
		})
	}

	const wireframeShapes = [
		{ type: 'geo', x: 100, y: 200, props: { geo: 'rectangle', w: 375, h: 812, color: 'grey', fill: 'none' } },
		{ type: 'text', x: 100, y: 150, props: { color: 'black', size: 'm', w: 200, textAlign: 'middle', autoSize: true, richText: t('📱 Mobile App') } },
		{ type: 'geo', x: 600, y: 200, props: { geo: 'rectangle', w: 1280, h: 800, color: 'grey', fill: 'none' } },
		{ type: 'text', x: 600, y: 150, props: { color: 'black', size: 'm', w: 200, textAlign: 'middle', autoSize: true, richText: t('💻 Web Desktop') } },
		{ type: 'text', x: 100, y: 1100, props: { color: 'black', size: 'l', w: 200, textAlign: 'middle', autoSize: true, richText: t('📦 UI Kit (Drag & Drop)') } },
		{ type: 'geo', x: 100, y: 1160, props: { geo: 'rectangle', w: 150, h: 48, color: 'blue', fill: 'semi' } },
		{ type: 'text', x: 125, y: 1172, props: { color: 'white', size: 's', w: 200, textAlign: 'middle', autoSize: true, richText: t('Primary Btn') } },
		{ type: 'geo', x: 300, y: 1160, props: { geo: 'rectangle', w: 200, h: 48, color: 'grey', fill: 'none' } },
		{ type: 'text', x: 320, y: 1172, props: { color: 'grey', size: 's', w: 200, textAlign: 'middle', autoSize: true, richText: t('Input text...') } },
	]

	const journeyShapes = [
		{ type: 'text', x: 100, y: 100, props: { color: 'black', size: 'xl', w: 200, textAlign: 'middle', autoSize: true, richText: t('🗺️ User Journey Flowchart') } },
		{ type: 'note', x: 100, y: 200, props: { color: 'blue', richText: t('1. 사용자가 랜딩 페이지 접속\n(스크롤 유도)') } },
		{ type: 'note', x: 400, y: 200, props: { color: 'yellow', richText: t('2. CTA 버튼 클릭\n(가입 모달 노출)') } },
		{ type: 'note', x: 700, y: 200, props: { color: 'green', richText: t('3. 결제 및 온보딩 완료\n(대시보드 이동)') } },
	]

	return page.evaluate(
		({ moodboardShapes, wireframeShapes, journeyShapes }) => {
			const editor = window.editor
			const results = {}

			// Verified live (CEO-933): the Python-side local SQLite mirror that
			// init_db() pre-seeds with 3 pages is NOT read by the actual production
			// sync-server (no Syncthing/volume link between them - see get_room_state's
			// comment above), so a brand-new room always starts with tldraw's single
			// default page, whose id is always the fixed 'page:page'. Reuse + rename
			// that page as the Moodboard tab instead of assuming it was pre-seeded,
			// and explicitly create the other two tabs via the real Editor API.
			const moodboardPage = editor.getPages().find((p) => p.id === 'page:page')
			if (moodboardPage) {
				if (moodboardPage.name !== '🎨 Moodboard') {
					editor.renamePage(moodboardPage.id, '🎨 Moodboard')
				}
				editor.setCurrentPage(moodboardPage.id)
				editor.createShapes(moodboardShapes)
				results.moodboardPageId = moodboardPage.id
			}

			const ensurePage = (id, name) => {
				let found = editor.getPages().find((p) => p.id === id || p.name === name)
				if (!found) {
					editor.createPage({ id, name })
					found = editor.getPages().find((p) => p.id === id || p.name === name)
				}
				return found
			}

			const wireframePage = ensurePage('page:wireframe', '📐 Wireframe & UI Kit')
			if (wireframePage) {
				editor.setCurrentPage(wireframePage.id)
				editor.createShapes(wireframeShapes)
				results.wireframePageId = wireframePage.id
			}

			const journeyPage = ensurePage('page:journey', '🗺️ User Journey')
			if (journeyPage) {
				editor.setCurrentPage(journeyPage.id)
				editor.createShapes(journeyShapes)
				results.journeyPageId = journeyPage.id
			}

			return results
		},
		{ moodboardShapes, wireframeShapes, journeyShapes }
	)
}

/**
 * Replaces server.py's old generate_moodboard_layout, which wrote design-rule
 * text, palette swatches, and image assets/shapes straight into SQLite via
 * add_shape_to_db. CDN upload of the source images still happens in Python
 * (unrelated to the crash-causing SQL path); this only takes already-uploaded
 * CDN URLs + pre-computed grid positions and creates the actual tldraw
 * asset/shape records through the real, validated Editor API.
 */
async function generateMoodboardLayout(page, { pageId, pageName, rules, paletteHex = [], images = [] }) {
	// richText must be built here in Node scope, same reason as createRoomContent above.
	const textShapes = [
		{ type: 'text', x: 800, y: 200, props: { color: 'black', size: 'l', w: 200, textAlign: 'middle', autoSize: true, richText: toRichText('📌 Design Rules') } },
		{ type: 'text', x: 800, y: 260, props: { color: 'black', size: 'm', w: 200, textAlign: 'middle', autoSize: true, richText: toRichText(rules) } },
		{ type: 'text', x: 800, y: 500, props: { color: 'black', size: 'l', w: 200, textAlign: 'middle', autoSize: true, richText: toRichText('🎨 Color Palette (Reference)') } },
	]
	paletteHex.forEach((hex, i) => {
		textShapes.push({
			type: 'text',
			x: 800 + i * 120,
			y: 540,
			props: { color: 'black', size: 's', w: 200, textAlign: 'middle', autoSize: true, richText: toRichText(hex) },
		})
	})

	return page.evaluate(
		({ pageId, pageName, textShapes, images }) => {
			const editor = window.editor
			const identifier = pageId || pageName
			const targetPage = identifier
				? editor.getPages().find((p) => p.id === identifier || p.name === identifier)
				: editor.getCurrentPage()
			if (!targetPage) throw new Error(`Page not found: ${identifier}`)
			editor.setCurrentPage(targetPage.id)

			editor.createShapes(textShapes)

			// Images: create the asset records first, then shapes that reference them.
			const assetRecords = images.map((img) => ({
				id: img.assetId,
				type: 'image',
				typeName: 'asset',
				props: { name: 'image.png', src: img.cdnUrl, w: img.w, h: img.h, isAnimated: false, mimeType: 'image/jpeg' },
				meta: {},
			}))
			if (assetRecords.length > 0) editor.createAssets(assetRecords)

			const imageShapes = images.map((img) => ({
				type: 'image',
				x: img.x,
				y: img.y,
				props: { w: img.w, h: img.h, assetId: img.assetId },
			}))
			if (imageShapes.length > 0) editor.createShapes(imageShapes)

			return { pageId: targetPage.id, textCount: textShapes.length, imageCount: imageShapes.length }
		},
		{ pageId, pageName, textShapes, images }
	)
}

async function getPageShapes(page, { pageName }) {
	return page.evaluate((pageName) => {
		const editor = window.editor
		const pages = editor.getPages()
		const targetPage = pageName ? pages.find((p) => p.name === pageName) : editor.getCurrentPage()
		if (!targetPage) throw new Error(`Page not found: ${pageName}`)
		editor.setCurrentPage(targetPage.id)
		const shapes = editor.getCurrentPageShapes()
		return {
			pageId: targetPage.id,
			shapes: shapes.map((s) => ({ id: s.id, type: s.type, x: s.x, y: s.y })),
		}
	}, pageName)
}

main()
