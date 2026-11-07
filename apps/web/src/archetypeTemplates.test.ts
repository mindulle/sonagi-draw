import { describe, it, expect, vi } from 'vitest'
import { toRichText, applyCinematicStoryboardTemplate } from './archetypeTemplates'

describe('archetypeTemplates', () => {
    it('converts multi-line text into valid richText doc content', () => {
        const text = 'Line 1\nLine 2\n\nLine 3'
        const result = toRichText(text)
        expect(result.type).toBe('doc')
        expect(result.content.length).toBe(4)
        expect(result.content[0].type).toBe('paragraph')
        expect(result.content[0].content?.[0].text).toBe('Line 1')
        expect(result.content[2].content).toBeUndefined() // empty line paragraph
    })

    it('applyCinematicStoryboardTemplate creates 3-act storyboards and HUD', () => {
        const mockEditor = {
            getCurrentPage: vi.fn().mockReturnValue({ id: 'page:test' }),
            updatePage: vi.fn(),
            createShapes: vi.fn(),
            centerOnPoint: vi.fn(),
        } as any

        applyCinematicStoryboardTemplate(mockEditor)
        expect(mockEditor.updatePage).toHaveBeenCalledWith({ id: 'page:test', name: '🎬 Cinematic Storyboard' })
        expect(mockEditor.createShapes).toHaveBeenCalled()
        const created = mockEditor.createShapes.mock.calls[0][0]
        expect(created.length).toBeGreaterThanOrEqual(7)
        const videoCards = created.filter((s: any) => s.type === 'wired-video-card')
        expect(videoCards.length).toBe(4) // Act 1, 2, 3 and Master
    })
})
