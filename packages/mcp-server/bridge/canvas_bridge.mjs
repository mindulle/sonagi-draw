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
