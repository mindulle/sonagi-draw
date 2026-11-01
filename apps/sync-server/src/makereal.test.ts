import { describe, it, expect } from 'vitest'
import { generateFallbackHtml, executeMakeReal } from './makereal'

describe('Make Real AI Prototype Engine (DRAW-2)', () => {
	it('generates self-contained HTML with Tailwind CDN and components in fallback', () => {
		const html = generateFallbackHtml(
			[
				{ type: 'wired-button', props: { text: 'Click Me', color: '#10b981' } },
				{ type: 'wired-input', props: { placeholder: 'Email Address' } },
				{ type: 'wired-toggle' },
				{ type: 'wired-card', props: { title: 'Product Card' } }
			],
			'Auth Form'
		)

		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain('https://cdn.tailwindcss.com')
		expect(html).toContain('Click Me')
		expect(html).toContain('Email Address')
		expect(html).toContain('Product Card')
		expect(html).toContain('Auth Form')
	})

	it('executeMakeReal produces valid HTML prototype', async () => {
		const res = await executeMakeReal({
			shapes: [
				{ type: 'wired-button', props: { text: 'Submit' } }
			],
			context: 'Landing Page CTA'
		})

		expect(res.ok).toBe(true)
		expect(res.html).toContain('<!DOCTYPE html>')
		expect(res.html).toContain('<html')
		expect(res.html).toContain('</html>')
	}, 15000)
})
