import { describe, it, expect, vi } from 'vitest'
import { executeEditorAction } from './LocalBridgeReceiver'

describe('LocalBridgeReceiver (DRAW-5)', () => {
	it('executes add_sticky_note against editor', () => {
		const createdShapes: any[] = []
		const mockEditor: any = {
			createShapes: vi.fn((shapes: any[]) => createdShapes.push(...shapes)),
			getCurrentPageId: vi.fn(() => 'page:page')
		}

		const res = executeEditorAction(mockEditor, 'add_sticky_note', {
			text: 'Test Sticky',
			x: 100,
			y: 200,
			color: 'green'
		})

		expect(res.shapeId).toBeDefined()
		expect(mockEditor.createShapes).toHaveBeenCalled()
		expect(createdShapes).toHaveLength(1)
		expect(createdShapes[0].type).toBe('note')
		expect(createdShapes[0].x).toBe(100)
		expect(createdShapes[0].y).toBe(200)
		expect(createdShapes[0].props.color).toBe('green')
	})

	it('executes add_wireframe_box with text label against editor', () => {
		const createdShapes: any[] = []
		const mockEditor: any = {
			createShapes: vi.fn((shapes: any[]) => createdShapes.push(...shapes)),
			getCurrentPageId: vi.fn(() => 'page:page')
		}

		const res = executeEditorAction(mockEditor, 'add_wireframe_box', {
			x: 50,
			y: 50,
			w: 300,
			h: 150,
			text: 'Login Box'
		})

		expect(res.shapeId).toBeDefined()
		expect(res.labelId).toBeDefined()
		expect(createdShapes).toHaveLength(2)
		expect(createdShapes[0].type).toBe('geo')
		expect(createdShapes[1].type).toBe('text')
	})

	it('executes create_shapes against editor', () => {
		const shapes = [{ id: 'shape:1', type: 'note' }, { id: 'shape:2', type: 'arrow' }]
		const mockEditor: any = {
			createShapes: vi.fn()
		}

		const res = executeEditorAction(mockEditor, 'create_shapes', { shapes })
		expect(res.createdCount).toBe(2)
		expect(mockEditor.createShapes).toHaveBeenCalledWith(shapes)
	})

	it('executes get_room_state and returns shapes and pages', () => {
		const mockShapes = [{ id: 'shape:note1', type: 'note' }]
		const mockPages = [{ id: 'page:page', name: 'Page 1' }]
		const mockEditor: any = {
			getCurrentPageShapes: vi.fn(() => mockShapes),
			getPages: vi.fn(() => mockPages)
		}

		const res = executeEditorAction(mockEditor, 'get_room_state')
		expect(res.shapes).toEqual(mockShapes)
		expect(res.availablePages).toEqual(mockPages)
	})

	it('executes push_to_inbox creating new inbox shape if not present', () => {
		const createdShapes: any[] = []
		const mockEditor: any = {
			getCurrentPageShapes: vi.fn(() => []),
			getViewportPageBounds: vi.fn(() => ({ center: { x: 500, y: 500 } })),
			createShapes: vi.fn((shapes: any[]) => createdShapes.push(...shapes))
		}

		const res = executeEditorAction(mockEditor, 'push_to_inbox', {
			title: 'Test Inbox',
			items: [{ a: 1 }]
		})

		expect(res.created).toBe(true)
		expect(res.itemCount).toBe(1)
		expect(createdShapes).toHaveLength(1)
		expect(createdShapes[0].type).toBe('wired-mcp-inbox')
	})

	it('throws error on unsupported action', () => {
		const mockEditor: any = {}
		expect(() => executeEditorAction(mockEditor, 'unknown_action')).toThrow('Unsupported action')
	})
})
