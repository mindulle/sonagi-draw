import { Buffer } from 'node:buffer'

export type IdeationMode = 'branch' | 'summarize' | 'challenge'

export interface IdeateRequest {
	mode: IdeationMode
	text: string
	context?: string
}

export interface IdeatedIdea {
	text: string
	color: string
}

export interface IdeateResponse {
	ok: boolean
	mode: IdeationMode
	ideas: IdeatedIdea[]
	source: 'llm' | 'heuristic'
	error?: string
}

export function generateHeuristicIdeas(mode: IdeationMode, text: string): IdeatedIdea[] {
	const clean = (text || '').trim().replace(/\s+/g, ' ')

	if (mode === 'branch') {
		return [
			{
				text: `[핵심 플로우] ${clean} 상세 인터랙션 및 화면 동선`,
				color: 'blue'
			},
			{
				text: `[시스템/연동] ${clean} 실시간 데이터 동기화 및 자동화 연계`,
				color: 'violet'
			},
			{
				text: `[사용자 가치] ${clean} 온보딩 편의성 및 원클릭 제스처`,
				color: 'green'
			}
		]
	}

	if (mode === 'summarize') {
		return [
			{
				text: `[요약] ${clean} → 직관적 온캔버스 공간 제스처 기반 초고속 아이디에이션`,
				color: 'green'
			}
		]
	}

	if (mode === 'challenge') {
		return [
			{
				text: `[리스크] ${clean} - 모바일/Discord 임베디드 웹뷰 시야 및 터치 제약`,
				color: 'red'
			},
			{
				text: `[검증 과제] ${clean} - 동시 다발적 생성 시 캔버스 요소 겹침 방지`,
				color: 'orange'
			}
		]
	}

	return [
		{ text: `[아이디어] ${clean}`, color: 'blue' }
	]
}

export async function parseRequestBody(req: any): Promise<any> {
	if (req.body && typeof req.body === 'object') return req.body
	if (typeof req.body === 'string') {
		try {
			return JSON.parse(req.body)
		} catch (_) {}
	}
	const chunks: Buffer[] = []
	for await (const chunk of req.raw) {
		chunks.push(chunk)
	}
	const bodyStr = Buffer.concat(chunks).toString('utf-8')
	if (!bodyStr) return {}
	return JSON.parse(bodyStr)
}

export async function generateAiIdeas(req: IdeateRequest): Promise<IdeateResponse> {
	const { mode, text, context } = req
	const cleanText = (text || '').trim()

	if (!cleanText) {
		return {
			ok: false,
			mode: mode || 'branch',
			ideas: [],
			source: 'heuristic',
			error: 'No text provided for ideation'
		}
	}

	const validMode: IdeationMode = (mode === 'summarize' || mode === 'challenge') ? mode : 'branch'
	const apiBase = process.env.OPENAI_API_BASE || process.env.AI_API_BASE || 'http://127.0.0.1:38107/v1'
	const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || 'dummy'
	const model = process.env.AI_MODEL || 'gemini-3.5-flash-lite'

	let systemPrompt = ''
	let userPrompt = ''

	if (validMode === 'branch') {
		systemPrompt = `You are an expert whiteboard ideation assistant.
Your task is to generate exactly 3 creative, concrete, diverging next-step sub-ideas expanding on the user's sticky note.
Rules:
- Keep each idea concise, actionable, and punchy (max 15-20 Korean words / 1-2 lines suitable for a sticky note).
- Provide 3 distinct angles (e.g. UX/Workflow, Technical/Implementation, Value/Opportunity).
- Output STRICT JSON matching this schema:
[
  {"text": "Idea 1", "color": "blue"},
  {"text": "Idea 2", "color": "violet"},
  {"text": "Idea 3", "color": "green"}
]`
		userPrompt = `Sticky Note Concept: "${cleanText}"${context ? `\nContext: ${context}` : ''}`
	} else if (validMode === 'summarize') {
		systemPrompt = `You are an expert executive synthesizer for a digital whiteboard.
Your task is to distill the core essence of the sticky note(s) into 1 concise, high-impact summary sticky note.
Rules:
- Max 15-20 Korean words.
- Capture the key takeaway or action.
- Output STRICT JSON matching this schema:
[
  {"text": "Summary takeaway", "color": "green"}
]`
		userPrompt = `Sticky Note(s): "${cleanText}"${context ? `\nContext: ${context}` : ''}`
	} else if (validMode === 'challenge') {
		systemPrompt = `You are a sharp Devil's Advocate and Risk Analyst for product design brainstorming.
Your task is to identify 2 critical blindspots, edge cases, adoption risks, or counter-arguments to stress-test this concept.
Rules:
- Keep each challenge constructive, specific, and concise (max 15-20 Korean words).
- Output STRICT JSON matching this schema:
[
  {"text": "Critical Risk / Edge Case", "color": "red"},
  {"text": "Devil's Advocate Question / Tradeoff", "color": "orange"}
]`
		userPrompt = `Concept to Challenge: "${cleanText}"${context ? `\nContext: ${context}` : ''}`
	}

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 4000)

	try {
		const response = await fetch(`${apiBase.replace(/\/$/, '')}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: validMode === 'branch' ? 0.7 : 0.3,
				max_tokens: 350
			}),
			signal: controller.signal
		})

		clearTimeout(timeout)

		if (!response.ok) {
			console.warn(`[AI Ideate] Upstream error: ${response.status} ${response.statusText}. Using heuristic fallback.`)
			return {
				ok: true,
				mode: validMode,
				ideas: generateHeuristicIdeas(validMode, cleanText),
				source: 'heuristic'
			}
		}

		const data = (await response.json()) as any
		const rawContent = data.choices?.[0]?.message?.content?.trim() || ''

		const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0])
			if (Array.isArray(parsed) && parsed.length > 0) {
				const defaultColors = validMode === 'branch'
					? ['blue', 'violet', 'green']
					: validMode === 'summarize'
					? ['green']
					: ['red', 'orange']

				const validIdeas: IdeatedIdea[] = parsed
					.map((item: any, idx: number) => ({
						text: String(item.text || item.idea || item).trim(),
						color: item.color || defaultColors[idx % defaultColors.length]
					}))
					.filter((i) => i.text.length > 0)

				if (validIdeas.length > 0) {
					return {
						ok: true,
						mode: validMode,
						ideas: validIdeas,
						source: 'llm'
					}
				}
			}
		}

		return {
			ok: true,
			mode: validMode,
			ideas: generateHeuristicIdeas(validMode, cleanText),
			source: 'heuristic'
		}
	} catch (err: any) {
		clearTimeout(timeout)
		console.warn(`[AI Ideate] Fetch exception: ${err?.message || err}. Using heuristic fallback.`)
		return {
			ok: true,
			mode: validMode,
			ideas: generateHeuristicIdeas(validMode, cleanText),
			source: 'heuristic'
		}
	}
}
