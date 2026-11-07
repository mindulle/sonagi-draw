export interface MakeRealRequest {
	shapes?: any[]
	svg?: string
	context?: string
}

export interface MakeRealResponse {
	ok: boolean
	html: string
	source: 'llm' | 'fallback'
	error?: string
}

export function extractShapeText(s: any): string {
	if (!s || !s.props) return ''
	const props = s.props
	if (typeof props.text === 'string' && props.text.trim()) return props.text.trim()
	if (typeof props.title === 'string' && props.title.trim()) return props.title.trim()
	if (typeof props.label === 'string' && props.label.trim()) return props.label.trim()
	if (props.richText && props.richText.content) {
		const extractNodes = (nodes: any[]): string => {
			return nodes
				.map((n) => {
					if (n.text) return n.text
					if (n.content && Array.isArray(n.content)) return extractNodes(n.content)
					return ''
				})
				.join(' ')
		}
		const extracted = extractNodes(props.richText.content).trim()
		if (extracted) return extracted
	}
	return ''
}

export function generateFallbackHtml(shapes: any[] = [], context = ''): string {
	const shapeElements: string[] = []

	for (const s of shapes) {
		const props = s.props || {}
		const text = extractShapeText(s)

		if (s.type === 'wired-button') {
			shapeElements.push(`
        <button class="px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-blue-500/20 bg-sonagi-accent hover:bg-sonagi-accent-dark transition-all duration-200 active:scale-95 flex items-center gap-2">
          <span>${text || 'Action Button'}</span>
          <svg class="w-4 h-4 text-sonagi-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>`)
		} else if (s.type === 'wired-input') {
			shapeElements.push(`
        <div class="flex flex-col gap-1.5 w-full max-w-sm">
          <label class="text-xs font-semibold text-sonagi-muted uppercase tracking-wider">${props.placeholder || 'Input Field'}</label>
          <input type="text" placeholder="${props.placeholder || 'Enter value...'}" class="px-4 py-2.5 bg-sonagi-surface border border-sonagi-border rounded-xl text-sm text-sonagi-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sonagi-accent/60 transition" />
        </div>`)
		} else if (s.type === 'wired-toggle') {
			shapeElements.push(`
        <label class="inline-flex items-center gap-3 cursor-pointer select-none">
          <div class="relative inline-flex items-center h-6 rounded-full w-11 bg-sonagi-accent transition">
            <span class="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full shadow-md transition"></span>
          </div>
          <span class="text-sm font-medium text-sonagi-text">${text || 'MDS Toggle'}</span>
        </label>`)
		} else if (s.type === 'wired-card') {
			shapeElements.push(`
        <div class="p-6 bg-sonagi-card border border-sonagi-border rounded-2xl shadow-xl hover:border-sonagi-accent/50 transition-all duration-200 group">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-sonagi-text group-hover:text-sonagi-cyan transition">${props.title || text || 'Card Title'}</h3>
            <span class="w-2 h-2 rounded-full bg-sonagi-cyan animate-pulse"></span>
          </div>
          <p class="text-sm text-sonagi-muted">Sonagi Design System component synthesized by Make Real token pipeline.</p>
        </div>`)
		} else if (s.type === 'note') {
			shapeElements.push(`
        <div class="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl text-amber-200 text-sm backdrop-blur-sm">
          <div class="text-xs font-mono text-amber-400 mb-1">MDS NOTE</div>
          <p class="font-medium">${text || 'Idea Note'}</p>
        </div>`)
		} else {
			shapeElements.push(`
        <div class="p-4 bg-sonagi-surface border border-sonagi-border rounded-xl text-sonagi-text text-sm">
          <span class="text-xs text-sonagi-muted uppercase tracking-wider block mb-1">${s.type}</span>
          ${text || 'Component'}
        </div>`)
		}
	}

	return `<!DOCTYPE html>
<html lang="ko" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Make Real • Sonagi Design System Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            sonagi: {
              bg: '#030508',
              surface: '#0d1117',
              card: '#161b22',
              border: '#30363d',
              accent: '#4A90E2',
              'accent-dark': '#2a6bbf',
              cyan: '#00ffcc',
              muted: '#8b949e',
              text: '#f0ede8'
            }
          },
          fontFamily: {
            sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif']
          }
        }
      }
    }
  </script>
</head>
<body class="bg-sonagi-bg text-sonagi-text min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(74,144,226,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
  <div class="w-full max-w-2xl bg-sonagi-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-sonagi-border p-8 space-y-6 relative z-10">
    <div class="border-b border-sonagi-border/80 pb-4 flex items-center justify-between">
      <div>
        <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-sonagi-accent/15 text-sonagi-cyan border border-sonagi-cyan/30">MDS v3.1 • TOKENS</span>
        <h1 class="text-xl font-bold text-sonagi-text mt-2">${context || 'Sonagi Interactive Prototype'}</h1>
      </div>
      <div class="w-3 h-3 rounded-full bg-sonagi-cyan shadow-[0_0_12px_#00ffcc]"></div>
    </div>
    <div class="flex flex-wrap gap-4 items-center justify-start">
      ${shapeElements.length > 0 ? shapeElements.join('\n') : '<p class="text-sonagi-muted">No components provided.</p>'}
    </div>
  </div>
</body>
</html>`
}

export async function executeMakeReal(req: MakeRealRequest): Promise<MakeRealResponse> {
	const { shapes = [], svg = '', context = '' } = req

	const apiBase = process.env.OPENAI_API_BASE || process.env.AI_API_BASE || 'http://127.0.0.1:38107/v1'
	const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || 'dummy'
	const model = process.env.MAKE_REAL_MODEL || 'gemini-3.5-flash-lite'

	const shapesSummary = shapes
		.map((s) => {
			const text = extractShapeText(s)
			return `- Type: ${s.type}, Pos: (${Math.round(s.x || 0)}, ${Math.round(s.y || 0)}), Text/Title: "${text}"`
		})
		.join('\n')

	const systemPrompt = `You are an expert design systems engineer and frontend architect specializing in the Sonagi / Mindulle Design System (MDS v3.1).
Your task is to take the user's wireframe drawing layout and generate a gorgeous, self-contained, fully interactive Single File HTML + Tailwind CSS web prototype built upon MDS design tokens.

Sonagi Design System (MDS) Token Standards:
1. Palette & Atmosphere:
   - Primary Dark Background: #030508 (Obsidian Void)
   - Primary Surface: #0d1117 (Slate Ink)
   - Card / Panel Surface: #161b22 with border #30363d
   - Accent Rain Blue: #4A90E2 (Primary action / interactive states)
   - Accent Rain Dark: #2a6bbf (Hover / active)
   - Brand Neon Cyan: #00ffcc (Glow accents, status indicators, badges)
   - Typography Neutral: Primary #f0ede8, Secondary/Muted #8b949e
   - States: Success #2ea043, Warning #d29922, Error #f85149
2. Tailwind Custom Theme Config:
   Include a custom tailwind.config script in <head>:
   <script>
     tailwind.config = {
       darkMode: 'class',
       theme: {
         extend: {
           colors: {
             sonagi: {
               bg: '#030508',
               surface: '#0d1117',
               card: '#161b22',
               border: '#30363d',
               accent: '#4A90E2',
               'accent-dark': '#2a6bbf',
               cyan: '#00ffcc',
               muted: '#8b949e',
               text: '#f0ede8'
             }
           }
         }
       }
     }
   </script>
3. Component Polish:
   - Buttons: Rich interactive states, rounded-xl, subtle glow on hover, micro-bounce on click (active:scale-95).
   - Inputs: Sleek dark surface (bg-sonagi-surface), crisp 1px border (border-sonagi-border), focus:ring-2 focus:ring-sonagi-accent/50.
   - Cards/Containers: Glassmorphic borders, soft drop shadows, clean padding and hierarchy.
   - Interactivity: Complete working JavaScript for all buttons, toggles, tabs, forms, modals, or toasts.
4. Return Format:
   Return ONLY the raw HTML string starting with <!DOCTYPE html> and ending with </html>. Do NOT wrap in markdown code blocks.`

	const userPrompt = `Wireframe Components Layout:
${shapesSummary || 'Generic UI prototype'}

Context & Notes:
${context || 'Convert this wireframe into a responsive, clean, high-fidelity UI page adhering to Sonagi Design System'}

${svg ? `Visual SVG Outline:\n${svg.slice(0, 1500)}` : ''}`

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 15000)

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
				temperature: 0.3,
				max_tokens: 1500
			}),
			signal: controller.signal
		})

		clearTimeout(timeout)

		if (!response.ok) {
			console.warn(`[Make Real] Upstream API error: ${response.status}. Using fallback template.`)
			return {
				ok: true,
				html: generateFallbackHtml(shapes, context),
				source: 'fallback'
			}
		}

		const data = (await response.json()) as any
		let rawHtml = data.choices?.[0]?.message?.content?.trim() || ''

		// Clean markdown wrappers if present
		rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim()

		if (rawHtml.includes('<html') || rawHtml.includes('<!DOCTYPE html>')) {
			return {
				ok: true,
				html: rawHtml,
				source: 'llm'
			}
		}

		return {
			ok: true,
			html: generateFallbackHtml(shapes, context),
			source: 'fallback'
		}
	} catch (err: any) {
		clearTimeout(timeout)
		console.warn(`[Make Real] Exception during LLM generation: ${err?.message || err}. Using fallback template.`)
		return {
			ok: true,
			html: generateFallbackHtml(shapes, context),
			source: 'fallback'
		}
	}
}
