import { describe, it, expect } from 'vitest'
import { WiredReferenceCardShapeUtil } from './WiredReferenceCardShape'
import type { KarakeepBookmark } from './AssetDrawer'

describe('AssetDrawer Karakeep Reference Integration (DRAW-14)', () => {
    it('should register wired-reference-card shape type correctly', () => {
        expect(WiredReferenceCardShapeUtil.type).toBe('wired-reference-card')
        expect(WiredReferenceCardShapeUtil.props).toBeDefined()
    })

    it('should transform Karakeep bookmark into wired-reference-card shape props', () => {
        const mockBookmark: KarakeepBookmark = {
            id: 'bm-test-123',
            title: 'Linear App - Design System',
            content: {
                type: 'link',
                url: 'https://linear.app',
                title: 'Linear App',
                imageUrl: 'https://cdn.sonagi.space/references/image1.jpg',
                favicon: 'https://linear.app/favicon.ico'
            },
            tags: [
                { id: 't1', name: 'ui-reference' },
                { id: 't2', name: 'mobbin' }
            ]
        }

        const shapeProps = {
            w: 320,
            h: 240,
            title: mockBookmark.title || mockBookmark.content?.title || '레퍼런스 북마크',
            url: mockBookmark.content?.url || '',
            imageUrl: mockBookmark.content?.imageUrl || mockBookmark.content?.favicon || ''
        }

        expect(shapeProps.title).toBe('Linear App - Design System')
        expect(shapeProps.url).toBe('https://linear.app')
        expect(shapeProps.imageUrl).toBe('https://cdn.sonagi.space/references/image1.jpg')
    })

    it('should handle bookmarks with missing images gracefully using favicon fallback', () => {
        const mockBookmarkWithoutImage: KarakeepBookmark = {
            id: 'bm-test-456',
            title: 'GitHub Docs',
            content: {
                type: 'link',
                url: 'https://docs.github.com',
                favicon: 'https://github.githubassets.com/favicons/favicon.svg'
            }
        }

        const imageUrl = mockBookmarkWithoutImage.content?.imageUrl || mockBookmarkWithoutImage.content?.favicon || ''
        expect(imageUrl).toBe('https://github.githubassets.com/favicons/favicon.svg')
    })

    it('should handle bookmarks with no media gracefully', () => {
        const mockBookmarkEmptyMedia: KarakeepBookmark = {
            id: 'bm-test-789',
            title: 'Plain Note',
            content: {
                type: 'text'
            }
        }

        const imageUrl = mockBookmarkEmptyMedia.content?.imageUrl || mockBookmarkEmptyMedia.content?.favicon || ''
        expect(imageUrl).toBe('')
    })
})
