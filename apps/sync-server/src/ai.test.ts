import { describe, it, expect } from 'vitest'
import { generateHeuristicIdeas, generateAiIdeas, parseRequestBody } from './ai'

describe('Jambot AI Ideation Logic (DRAW-9)', () => {
	it('generates 3 diverging ideas in branch mode (heuristic)', () => {
		const ideas = generateHeuristicIdeas('branch', '온캔버스 AI 협업 툴')
		expect(ideas).toHaveLength(3)
		expect(ideas[0].color).toBe('blue')
		expect(ideas[1].color).toBe('violet')
		expect(ideas[2].color).toBe('green')
		ideas.forEach(idea => {
			expect(idea.text).toContain('온캔버스 AI 협업 툴')
		})
	})

	it('generates 1 summary idea in summarize mode (heuristic)', () => {
		const ideas = generateHeuristicIdeas('summarize', '사용자 피드백 수집 및 분석')
		expect(ideas).toHaveLength(1)
		expect(ideas[0].color).toBe('green')
		expect(ideas[0].text).toContain('사용자 피드백 수집 및 분석')
	})

	it('generates 2 risk/counterpoint ideas in challenge mode (heuristic)', () => {
		const ideas = generateHeuristicIdeas('challenge', '원클릭 결제 자동화')
		expect(ideas).toHaveLength(2)
		expect(ideas[0].color).toBe('red')
		expect(ideas[1].color).toBe('orange')
		expect(ideas[0].text).toContain('원클릭 결제 자동화')
	})

	it('generateAiIdeas handles empty text with error', async () => {
		const res = await generateAiIdeas({ mode: 'branch', text: '' })
		expect(res.ok).toBe(false)
		expect(res.ideas).toHaveLength(0)
	})

	it('generateAiIdeas executes and returns valid ideas for branch', async () => {
		const res = await generateAiIdeas({ mode: 'branch', text: '화이트보드 AI 제스처' })
		expect(res.ok).toBe(true)
		expect(res.mode).toBe('branch')
		expect(res.ideas.length).toBeGreaterThanOrEqual(1)
		expect(res.ideas[0].text.length).toBeGreaterThan(0)
	})

	it('generateAiIdeas executes and returns valid ideas for summarize', async () => {
		const res = await generateAiIdeas({ mode: 'summarize', text: '화이트보드 기획' })
		expect(res.ok).toBe(true)
		expect(res.mode).toBe('summarize')
		expect(res.ideas.length).toBeGreaterThanOrEqual(1)
	})

	it('generateAiIdeas executes and returns valid ideas for challenge', async () => {
		const res = await generateAiIdeas({ mode: 'challenge', text: '모바일 제스처' })
		expect(res.ok).toBe(true)
		expect(res.mode).toBe('challenge')
		expect(res.ideas.length).toBeGreaterThanOrEqual(1)
	})

	it('parseRequestBody parses json from req.body or req.raw', async () => {
		const mockReqBody = { body: { mode: 'branch', text: 'test' } }
		const parsed = await parseRequestBody(mockReqBody)
		expect(parsed.mode).toBe('branch')
		expect(parsed.text).toBe('test')

		async function* makeChunks() {
			yield Buffer.from(JSON.stringify({ mode: 'summarize', text: 'raw test' }))
		}
		const mockReqRaw = { raw: makeChunks() }
		const parsedRaw = await parseRequestBody(mockReqRaw)
		expect(parsedRaw.mode).toBe('summarize')
		expect(parsedRaw.text).toBe('raw test')
	})
})
