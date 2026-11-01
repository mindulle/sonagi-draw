import { describe, it, expect, vi } from 'vitest'
import {
	extractTextFromShape,
	computeSpatialLayout,
	executeSpatialIdeation,
	generateClientFallbackHtml,
	IdeatedIdea
} from './JambotQuickGestures'

describe('JambotQuickGestures (DRAW-9)', () => {
	describe('extractTextFromShape', () => {
		it('extracts from props.text', () => {
			const shape = { props: { text: 'Hello World' } }
			expect(extractTextFromShape(shape)).toBe('Hello World')
		})

		it('extracts from props.title', () => {
			const shape = { props: { title: 'Card Title' } }
			expect(extractTextFromShape(shape)).toBe('Card Title')
		})

		it('extracts from props.label', () => {
			const shape = { props: { label: 'Checkbox Label' } }
			expect(extractTextFromShape(shape)).toBe('Checkbox Label')
		})

		it('extracts from props.richText doc format', () => {
			const shape = {
				props: {
					richText: {
						type: 'doc',
						content: [
							{
								type: 'paragraph',
								content: [{ type: 'text', text: 'Sticky idea 1' }]
							},
							{
								type: 'paragraph',
								content: [{ type: 'text', text: 'Second line' }]
							}
						]
					}
				}
			}
			expect(extractTextFromShape(shape)).toBe('Sticky idea 1 Second line')
		})

		it('returns empty string for shape with no text', () => {
			expect(extractTextFromShape(null)).toBe('')
			expect(extractTextFromShape({})).toBe('')
			expect(extractTextFromShape({ props: {} })).toBe('')
		})
	})

	describe('computeSpatialLayout', () => {
		const originBounds = {
			minX: 100,
			maxX: 300,
			minY: 100,
			maxY: 300,
			width: 200,
			height: 200
		}

		it('computes 3 vertical placements to the right of origin', () => {
			const placements = computeSpatialLayout(originBounds, 3, [], 200, 200, 140, 20)
			expect(placements).toHaveLength(3)

			// targetX should be originBounds.maxX (300) + gapX (140) = 440
			expect(placements[0].targetX).toBe(440)
			expect(placements[1].targetX).toBe(440)
			expect(placements[2].targetX).toBe(440)

			// Total height: 3 * 200 + 2 * 20 = 640
			// Center Y of origin is 200
			// startY = 200 - 320 = -120
			expect(placements[0].targetY).toBe(-120)
			expect(placements[1].targetY).toBe(100) // -120 + 220
			expect(placements[2].targetY).toBe(320) // 100 + 220
		})

		it('avoids collision with existing shape bounds', () => {
			// Existing shape right at targetX (440) to 700
			const existingBounds = [{ minX: 400, maxX: 700, minY: -200, maxY: 400 }]

			const placements = computeSpatialLayout(originBounds, 3, existingBounds, 200, 200, 140, 20)
			expect(placements).toHaveLength(3)

			// Target X must have been shifted past existing shape maxX (700) + 60 = 760
			expect(placements[0].targetX).toBeGreaterThanOrEqual(760)
		})
	})

	describe('executeSpatialIdeation', () => {
		it('creates note and arrow shapes and selects them in editor', () => {
			const createdShapes: any[] = []
			let selectedIds: string[] = []

			const mockEditor: any = {
				getShapePageBounds: vi.fn((id: string) => {
					if (id === 'shape:origin') {
						return { minX: 100, maxX: 300, minY: 100, maxY: 300, width: 200, height: 200 }
					}
					return null
				}),
				getCurrentPageShapes: vi.fn(() => []),
				createShapes: vi.fn((shapes: any[]) => {
					createdShapes.push(...shapes)
				}),
				select: vi.fn((...ids: string[]) => {
					selectedIds = ids
				}),
				createBinding: vi.fn()
			}

			const originShape: any = { id: 'shape:origin', type: 'note' }
			const ideas: IdeatedIdea[] = [
				{ text: 'Idea A', color: 'blue' },
				{ text: 'Idea B', color: 'violet' },
				{ text: 'Idea C', color: 'green' }
			]

			const newIds = executeSpatialIdeation(mockEditor, originShape, 'branch', ideas)

			expect(newIds).toHaveLength(3)
			expect(mockEditor.createShapes).toHaveBeenCalled()
			// 3 notes + 3 arrows = 6 shapes
			expect(createdShapes).toHaveLength(6)

			const notes = createdShapes.filter((s) => s.type === 'note')
			const arrows = createdShapes.filter((s) => s.type === 'arrow')

			expect(notes).toHaveLength(3)
			expect(arrows).toHaveLength(3)

			expect(notes[0].props.color).toBe('blue')
			expect(notes[1].props.color).toBe('violet')
			expect(notes[2].props.color).toBe('green')

			arrows.forEach((arr) => {
				expect(arr.props.arrowheadEnd).toBe('arrow')
			})

			expect(selectedIds).toEqual(newIds)
		})
	})

	describe('generateClientFallbackHtml (Make Real)', () => {
		it('renders HTML boilerplate with Tailwind CDN and components', () => {
			const html = generateClientFallbackHtml(
				[
					{ type: 'wired-button', props: { text: 'Login Button' } },
					{ type: 'wired-input', props: { placeholder: 'Username' } },
					{ type: 'wired-card', props: { title: 'User Card' } }
				],
				'Auth Page Wireframe'
			)

			expect(html).toContain('<!DOCTYPE html>')
			expect(html).toContain('https://cdn.tailwindcss.com')
			expect(html).toContain('Login Button')
			expect(html).toContain('Username')
			expect(html).toContain('User Card')
			expect(html).toContain('Auth Page Wireframe')
		})
	})
})
