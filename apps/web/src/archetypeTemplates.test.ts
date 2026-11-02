import { describe, it, expect } from 'vitest'
import { toRichText } from './archetypeTemplates'

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
})
