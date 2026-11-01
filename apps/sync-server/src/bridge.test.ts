import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	isLocalhost,
	toRichText,
	executeFileStoreFallback,
	getConnectedClientsCount,
	DRAWINGS_DIR
} from './bridge'
import fs from 'node:fs'
import path from 'node:path'

describe('Local API Bridge Logic (DRAW-5)', () => {
	describe('isLocalhost security filter', () => {
		it('allows 127.0.0.1 and ::1', () => {
			expect(isLocalhost('127.0.0.1')).toBe(true)
			expect(isLocalhost('::1')).toBe(true)
			expect(isLocalhost('::ffff:127.0.0.1')).toBe(true)
			expect(isLocalhost('localhost')).toBe(true)
			expect(isLocalhost({ ip: '127.0.0.1' })).toBe(true)
			expect(isLocalhost({ socket: { remoteAddress: '127.0.0.1' } })).toBe(true)
		})

		it('rejects external IP addresses', () => {
			expect(isLocalhost('192.168.1.10')).toBe(false)
			expect(isLocalhost('10.0.0.1')).toBe(false)
			expect(isLocalhost('203.0.113.55')).toBe(false)
			expect(isLocalhost({ ip: '8.8.8.8' })).toBe(false)
			expect(isLocalhost(null)).toBe(false)
			expect(isLocalhost('')).toBe(false)
		})
	})

	describe('toRichText conversion', () => {
		it('converts plain text to TipTap doc structure', () => {
			const rich = toRichText('Line 1\nLine 2')
			expect(rich.type).toBe('doc')
			expect(rich.content).toHaveLength(2)
			expect(rich.content[0].content?.[0]?.text).toBe('Line 1')
			expect(rich.content[1].content?.[0]?.text).toBe('Line 2')
		})

		it('handles empty text', () => {
			const rich = toRichText('')
			expect(rich.type).toBe('doc')
			expect(rich.content).toHaveLength(1)
		})
	})

	describe('executeFileStoreFallback', () => {
		const testFileName = 'test_bridge_drawing'
		const testFilePath = path.join(DRAWINGS_DIR, `${testFileName}.tldr`)

		beforeEach(() => {
			const initialTldr = {
				schema: { schemaVersion: 2 },
				store: {
					'document:document': { id: 'document:document', typeName: 'document' },
					'page:page': { id: 'page:page', typeName: 'page', name: 'Page 1' }
				}
			}
			fs.mkdirSync(DRAWINGS_DIR, { recursive: true })
			fs.writeFileSync(testFilePath, JSON.stringify(initialTldr, null, 2), 'utf-8')
		})

		afterEach(() => {
			if (fs.existsSync(testFilePath)) {
				try {
					fs.unlinkSync(testFilePath)
				} catch (_) {}
			}
		})

		it('adds a sticky note to .tldr file', () => {
			const res = executeFileStoreFallback('add_sticky_note', {
				file: testFileName,
				text: 'Agent Sticky Note',
				x: 150,
				y: 250,
				color: 'blue'
			})

			expect(res.ok).toBe(true)
			expect(res.shapeId).toMatch(/^shape:/)

			const content = JSON.parse(fs.readFileSync(testFilePath, 'utf-8'))
			const shape = content.store[res.shapeId]
			expect(shape).toBeDefined()
			expect(shape.type).toBe('note')
			expect(shape.x).toBe(150)
			expect(shape.y).toBe(250)
			expect(shape.props.color).toBe('blue')
		})

		it('adds a wireframe box with text label to .tldr file', () => {
			const res = executeFileStoreFallback('add_wireframe_box', {
				file: testFileName,
				x: 50,
				y: 50,
				w: 300,
				h: 200,
				text: 'User Form'
			})

			expect(res.ok).toBe(true)
			expect(res.shapeId).toBeDefined()
			expect(res.labelId).toBeDefined()

			const content = JSON.parse(fs.readFileSync(testFilePath, 'utf-8'))
			const box = content.store[res.shapeId]
			expect(box.type).toBe('geo')
			expect(box.props.w).toBe(300)

			const label = content.store[res.labelId]
			expect(label.type).toBe('text')
		})

		it('retrieves room state from .tldr file', () => {
			executeFileStoreFallback('add_sticky_note', {
				file: testFileName,
				text: 'Sample Item'
			})

			const state = executeFileStoreFallback('get_room_state', { file: testFileName })
			expect(state.ok).toBe(true)
			expect(state.shapes.length).toBeGreaterThanOrEqual(1)
			expect(state.availablePages).toHaveLength(1)
		})

		it('pushes items to wired-mcp-inbox in .tldr file', () => {
			const res1 = executeFileStoreFallback('push_to_inbox', {
				file: testFileName,
				title: 'Inbox Test',
				items: [{ id: 1, name: 'Item 1' }]
			})
			expect(res1.ok).toBe(true)
			expect(res1.created).toBe(true)
			expect(res1.itemCount).toBe(1)

			const res2 = executeFileStoreFallback('push_to_inbox', {
				file: testFileName,
				items: [{ id: 2, name: 'Item 2' }]
			})
			expect(res2.ok).toBe(true)
			expect(res2.created).toBe(false)
			expect(res2.itemCount).toBe(2)
		})
	})
})
