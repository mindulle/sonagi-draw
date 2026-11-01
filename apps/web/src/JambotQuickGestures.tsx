import { useState, useCallback } from 'react'
import { useEditor, useValue, createShapeId, Editor, TLShape, TLShapeId } from 'tldraw'
import { toRichText } from './libraryTemplates'

export type IdeationGestureMode = 'branch' | 'summarize' | 'challenge'

export interface IdeatedIdea {
	text: string
	color?: string
}

export interface SpatialPlacement {
	targetX: number
	targetY: number
	width: number
	height: number
}

export function extractTextFromShape(shape: any): string {
	if (!shape || !shape.props) return ''
	const props = shape.props

	if (typeof props.text === 'string' && props.text.trim()) {
		return props.text.trim()
	}
	if (typeof props.title === 'string' && props.title.trim()) {
		return props.title.trim()
	}
	if (typeof props.label === 'string' && props.label.trim()) {
		return props.label.trim()
	}
	if (props.richText && props.richText.content) {
		const extractNodes = (nodes: any[]): string => {
			return nodes
				.map((node) => {
					if (node.text) return node.text
					if (node.content && Array.isArray(node.content)) return extractNodes(node.content)
					return ''
				})
				.join(' ')
		}
		const text = extractNodes(props.richText.content).trim()
		if (text) return text
	}
	return ''
}

export function computeSpatialLayout(
	originBounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number },
	count: number,
	existingBounds: Array<{ minX: number; maxX: number; minY: number; maxY: number }> = [],
	nodeWidth = 200,
	nodeHeight = 200,
	gapX = 140,
	gapY = 20
): SpatialPlacement[] {
	const originCenterY = originBounds.minY + originBounds.height / 2
	const spacingY = nodeHeight + gapY
	const totalHeight = count * nodeHeight + (count - 1) * gapY
	const initialStartY = originCenterY - totalHeight / 2

	let targetX = originBounds.maxX + gapX

	let attempts = 0
	let hasCollision = true
	while (hasCollision && attempts < 10) {
		hasCollision = false
		attempts++
		const testMinX = targetX
		const testMaxX = targetX + nodeWidth
		const testMinY = initialStartY
		const testMaxY = initialStartY + totalHeight

		for (const b of existingBounds) {
			if (testMinX < b.maxX && testMaxX > b.minX && testMinY < b.maxY && testMaxY > b.minY) {
				targetX = Math.max(targetX, b.maxX + 60)
				hasCollision = true
			}
		}
	}

	const placements: SpatialPlacement[] = []
	for (let i = 0; i < count; i++) {
		placements.push({
			targetX,
			targetY: initialStartY + i * spacingY,
			width: nodeWidth,
			height: nodeHeight
		})
	}

	return placements
}

export function executeSpatialIdeation(
	editor: Editor,
	originShape: TLShape,
	mode: IdeationGestureMode,
	ideas: IdeatedIdea[]
): TLShapeId[] {
	const originBounds = editor.getShapePageBounds(originShape.id)
	if (!originBounds || ideas.length === 0) return []

	const allShapes = editor.getCurrentPageShapes()
	const existingBounds = allShapes
		.filter((s) => s.id !== originShape.id)
		.map((s) => editor.getShapePageBounds(s.id))
		.filter(Boolean) as Array<{ minX: number; maxX: number; minY: number; maxY: number }>

	const placements = computeSpatialLayout(
		{
			minX: originBounds.minX,
			maxX: originBounds.maxX,
			minY: originBounds.minY,
			maxY: originBounds.maxY,
			width: originBounds.width,
			height: originBounds.height
		},
		ideas.length,
		existingBounds
	)

	const shapesToCreate: any[] = []
	const newNoteIds: TLShapeId[] = []
	const arrowIds: TLShapeId[] = []

	const originRight = originBounds.maxX
	const originCenterY = originBounds.minY + originBounds.height / 2

	ideas.forEach((idea, idx) => {
		const placement = placements[idx]
		const noteId = createShapeId()
		const arrowId = createShapeId()

		newNoteIds.push(noteId)
		arrowIds.push(arrowId)

		const defaultColor =
			mode === 'branch'
				? ['blue', 'violet', 'green'][idx % 3]
				: mode === 'summarize'
				? 'green'
				: ['red', 'orange'][idx % 2]

		const noteColor = idea.color || defaultColor

		// 1. New Sticky Note Shape
		shapesToCreate.push({
			id: noteId,
			type: 'note',
			x: placement.targetX,
			y: placement.targetY,
			props: {
				color: noteColor,
				size: 'm',
				richText: toRichText(idea.text)
			}
		})

		// 2. Spatial Connecting Arrow Shape
		const arrowStartX = originRight
		const arrowStartY = originCenterY
		const arrowEndX = placement.targetX
		const arrowEndY = placement.targetY + placement.height / 2

		shapesToCreate.push({
			id: arrowId,
			type: 'arrow',
			x: arrowStartX,
			y: arrowStartY,
			props: {
				start: { x: 0, y: 0 },
				end: { x: arrowEndX - arrowStartX, y: arrowEndY - arrowStartY },
				arrowheadStart: 'none',
				arrowheadEnd: 'arrow',
				color: mode === 'challenge' ? 'red' : 'grey',
				size: 's'
			}
		})
	})

	editor.createShapes(shapesToCreate)

	try {
		newNoteIds.forEach((noteId, idx) => {
			const arrowId = arrowIds[idx]
			;(editor as any).createBinding?.({
				type: 'arrow',
				fromId: arrowId,
				toId: originShape.id,
				props: {
					terminal: 'start',
					normalizedAnchor: { x: 1, y: 0.5 },
					isExact: false,
					isPrecise: false
				}
			})
			;(editor as any).createBinding?.({
				type: 'arrow',
				fromId: arrowId,
				toId: noteId,
				props: {
					terminal: 'end',
					normalizedAnchor: { x: 0, y: 0.5 },
					isExact: false,
					isPrecise: false
				}
			})
		})
	} catch (_) {}

	editor.select(...newNoteIds)
	return newNoteIds
}

export function generateClientFallbackHtml(shapes: any[] = [], context = ''): string {
	const shapeElements: string[] = []

	for (const s of shapes) {
		const props = s.props || {}
		const text = props.text || props.title || props.label || ''

		if (s.type === 'wired-button') {
			shapeElements.push(`
        <button class="px-5 py-2.5 rounded-lg font-medium text-white shadow-sm transition hover:opacity-90 active:scale-95" style="background-color: ${props.color || '#3b82f6'};">
          ${text || 'Button'}
        </button>`)
		} else if (s.type === 'wired-input') {
			shapeElements.push(`
        <div class="flex flex-col gap-1 w-full max-w-sm">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${props.placeholder || 'Input Field'}</label>
          <input type="text" placeholder="${props.placeholder || 'Enter value...'}" class="px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>`)
		} else if (s.type === 'wired-card') {
			shapeElements.push(`
        <div class="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition">
          <h3 class="text-lg font-bold text-slate-900 mb-2">${props.title || 'Card Title'}</h3>
          <p class="text-sm text-slate-600">Interactive wireframe component generated by Sonagi Draw Make Real.</p>
        </div>`)
		} else if (s.type === 'note') {
			shapeElements.push(`
        <div class="p-5 bg-amber-100 border border-amber-300 rounded-lg shadow-sm text-amber-950 font-sans text-sm rotate-[-1deg]">
          <p class="font-medium">${text || 'Sticky Note'}</p>
        </div>`)
		} else {
			shapeElements.push(`
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm">
          ${text || s.type}
        </div>`)
		}
	}

	return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Make Real Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
    <div class="border-b border-slate-100 pb-4">
      <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">MAKE REAL • SONAGI</span>
      <h1 class="text-xl font-bold text-slate-900 mt-2">${context || 'Interactive Prototype'}</h1>
    </div>
    <div class="flex flex-wrap gap-4 items-center justify-start">
      ${shapeElements.length > 0 ? shapeElements.join('\n') : '<p class="text-slate-400">No components selected.</p>'}
    </div>
  </div>
</body>
</html>`
}

export function JambotQuickGestures() {
	const editor = useEditor()
	const [activeLoadingMode, setActiveLoadingMode] = useState<IdeationGestureMode | null>(null)
	const [feedbackToast, setFeedbackToast] = useState<string | null>(null)

	// Make Real State
	const [isMakeRealLoading, setIsMakeRealLoading] = useState(false)
	const [isMakeRealOpen, setIsMakeRealOpen] = useState(false)
	const [makeRealHtml, setMakeRealHtml] = useState('')
	const [makeRealView, setMakeRealView] = useState<'preview' | 'code'>('preview')
	const [copySuccess, setCopySuccess] = useState(false)

	const isMobile = useValue('isMobile', () => {
		if (typeof window === 'undefined') return false
		return window.innerWidth <= 768
	}, [])

	const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor])

	const selectedShapes = useValue('selectedShapes', () => {
		return selectedShapeIds.map((id) => editor.getShape(id)).filter(Boolean) as TLShape[]
	}, [selectedShapeIds, editor])

	const screenBounds = useValue('selectionScreenBounds', () => {
		if (selectedShapeIds.length === 0) return null
		try {
			return editor.getSelectionRotatedScreenBounds() || editor.getSelectionScreenBounds()
		} catch (_) {
			return null
		}
	}, [selectedShapeIds, editor])

	const primaryShape = selectedShapes[0]
	const combinedText = selectedShapes.map(extractTextFromShape).filter(Boolean).join('\n---\n')

	const triggerGesture = useCallback(
		async (mode: IdeationGestureMode) => {
			if (!primaryShape || !combinedText || activeLoadingMode) return

			if (typeof navigator !== 'undefined' && navigator.vibrate) {
				try {
					navigator.vibrate(20)
				} catch (_) {}
			}

			setActiveLoadingMode(mode)

			try {
				let ideas: IdeatedIdea[] = []

				const res = await fetch('/api/ai/ideate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						mode,
						text: combinedText
					})
				})

				if (res.ok) {
					const data = await res.json()
					if (data.ok && Array.isArray(data.ideas) && data.ideas.length > 0) {
						ideas = data.ideas
					}
				}

				if (ideas.length === 0) {
					const clean = combinedText.split('\n')[0].slice(0, 40)
					if (mode === 'branch') {
						ideas = [
							{ text: `[핵심 플로우] ${clean} 상세 인터랙션 설계`, color: 'blue' },
							{ text: `[기술/연계] ${clean} 실시간 데이터 동기화`, color: 'violet' },
							{ text: `[사용자 가치] ${clean} 원클릭 제스처 편의성`, color: 'green' }
						]
					} else if (mode === 'summarize') {
						ideas = [{ text: `[요약] ${clean} → 직관적 온캔버스 공간 제스처 실행`, color: 'green' }]
					} else {
						ideas = [
							{ text: `[리스크] ${clean} - 모바일 임베디드 웹뷰 시야 제약`, color: 'red' },
							{ text: `[검증 과제] ${clean} - 캔버스 요소 겹침 방지`, color: 'orange' }
						]
					}
				}

				executeSpatialIdeation(editor, primaryShape, mode, ideas)

				const toastText =
					mode === 'branch'
						? '💡 3갈래 아이디어 분기 완료!'
						: mode === 'summarize'
						? '📝 핵심 요약 생성 완료!'
						: '⚡ 반박 & 리스크 생성 완료!'

				setFeedbackToast(toastText)
				setTimeout(() => setFeedbackToast(null), 2500)
			} catch (err) {
				console.error('[Jambot Gesture Error]', err)
			} finally {
				setActiveLoadingMode(null)
			}
		},
		[editor, primaryShape, combinedText, activeLoadingMode]
	)

	const triggerMakeReal = useCallback(async () => {
		if (selectedShapes.length === 0 || isMakeRealLoading) return
		setIsMakeRealLoading(true)

		try {
			let svg = ''
			try {
				const svgRes = await editor.getSvgString(selectedShapeIds, { background: false })
				svg = svgRes?.svg || ''
			} catch (_) {}

			const res = await fetch('/api/ai/make-real', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					shapes: selectedShapes,
					svg,
					context: combinedText
				})
			})

			let generatedHtml = ''
			if (res.ok) {
				const data = await res.json()
				if (data.ok && data.html) {
					generatedHtml = data.html
				}
			}

			if (!generatedHtml) {
				generatedHtml = generateClientFallbackHtml(selectedShapes, combinedText)
			}

			setMakeRealHtml(generatedHtml)
			setMakeRealView('preview')
			setIsMakeRealOpen(true)
		} catch (err) {
			console.error('[Make Real Error]', err)
			const fallback = generateClientFallbackHtml(selectedShapes, combinedText)
			setMakeRealHtml(fallback)
			setMakeRealView('preview')
			setIsMakeRealOpen(true)
		} finally {
			setIsMakeRealLoading(false)
		}
	}, [editor, selectedShapes, selectedShapeIds, combinedText, isMakeRealLoading])

	if (typeof window !== 'undefined') {
		;(window as any).__JAMBOT_GESTURE__ = triggerGesture
		;(window as any).__MAKE_REAL_TRIGGER__ = triggerMakeReal
	}

	if (!screenBounds || selectedShapes.length === 0 || !combinedText) {
		return null
	}

	const toolbarWidth = isMobile ? 310 : 420
	const toolbarHeight = 44
	let left = screenBounds.x + screenBounds.w / 2 - toolbarWidth / 2
	let top = screenBounds.y - toolbarHeight - 12

	if (top < 56) {
		top = screenBounds.y + screenBounds.h + 12
	}

	const padding = 12
	if (typeof window !== 'undefined') {
		left = Math.max(padding, Math.min(left, window.innerWidth - toolbarWidth - padding))
		top = Math.max(padding, Math.min(top, window.innerHeight - toolbarHeight - padding))
	}

	return (
		<>
			{/* Floating Glassmorphism Gesture Toolbar */}
			<div
				data-testid="jambot-quick-gestures-toolbar"
				style={{
					position: 'fixed',
					left: `${left}px`,
					top: `${top}px`,
					width: `${toolbarWidth}px`,
					height: `${toolbarHeight}px`,
					zIndex: 9999,
					pointerEvents: 'all',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 4,
					padding: '4px 6px',
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(16px)',
					WebkitBackdropFilter: 'blur(16px)',
					borderRadius: 24,
					border: '1px solid rgba(226, 232, 240, 0.9)',
					boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
					userSelect: 'none'
				}}
			>
				{/* Gesture 1: Branch */}
				<button
					data-testid="gesture-branch"
					onClick={() => triggerGesture('branch')}
					disabled={activeLoadingMode !== null || isMakeRealLoading}
					style={{
						flex: 1,
						height: 34,
						border: 'none',
						borderRadius: 18,
						background: activeLoadingMode === 'branch' ? '#dbeafe' : 'transparent',
						color: '#1e40af',
						fontSize: isMobile ? 11 : 12,
						fontWeight: 600,
						cursor: activeLoadingMode !== null ? 'wait' : 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 4,
						transition: 'all 0.12s ease',
						padding: '0 4px',
						whiteSpace: 'nowrap'
					}}
					title="선택한 스티키로부터 3가지 연관 아이디어와 화살표를 즉시 분기합니다"
				>
					<span>💡</span>
					<span>{activeLoadingMode === 'branch' ? '...' : isMobile ? '분기' : '3갈래 분기'}</span>
				</button>

				<div style={{ width: 1, height: 18, background: '#e2e8f0' }} />

				{/* Gesture 2: Summarize */}
				<button
					data-testid="gesture-summarize"
					onClick={() => triggerGesture('summarize')}
					disabled={activeLoadingMode !== null || isMakeRealLoading}
					style={{
						flex: 1,
						height: 34,
						border: 'none',
						borderRadius: 18,
						background: activeLoadingMode === 'summarize' ? '#dcfce7' : 'transparent',
						color: '#166534',
						fontSize: isMobile ? 11 : 12,
						fontWeight: 600,
						cursor: activeLoadingMode !== null ? 'wait' : 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 4,
						transition: 'all 0.12s ease',
						padding: '0 4px',
						whiteSpace: 'nowrap'
					}}
					title="선택한 스티키의 핵심을 1장의 요약 노트로 집약합니다"
				>
					<span>📝</span>
					<span>{activeLoadingMode === 'summarize' ? '...' : isMobile ? '요약' : '핵심 요약'}</span>
				</button>

				<div style={{ width: 1, height: 18, background: '#e2e8f0' }} />

				{/* Gesture 3: Challenge */}
				<button
					data-testid="gesture-challenge"
					onClick={() => triggerGesture('challenge')}
					disabled={activeLoadingMode !== null || isMakeRealLoading}
					style={{
						flex: 1,
						height: 34,
						border: 'none',
						borderRadius: 18,
						background: activeLoadingMode === 'challenge' ? '#fee2e2' : 'transparent',
						color: '#991b1b',
						fontSize: isMobile ? 11 : 12,
						fontWeight: 600,
						cursor: activeLoadingMode !== null ? 'wait' : 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 4,
						transition: 'all 0.12s ease',
						padding: '0 4px',
						whiteSpace: 'nowrap'
					}}
					title="잠재 리스크 및 비판적 반박 포인트를 도출합니다"
				>
					<span>⚡</span>
					<span>{activeLoadingMode === 'challenge' ? '...' : isMobile ? '반박' : '반박/리스크'}</span>
				</button>

				<div style={{ width: 1, height: 18, background: '#e2e8f0' }} />

				{/* Gesture 4: Make Real (DRAW-2) */}
				<button
					data-testid="gesture-make-real"
					onClick={triggerMakeReal}
					disabled={activeLoadingMode !== null || isMakeRealLoading}
					style={{
						flex: 1,
						height: 34,
						border: 'none',
						borderRadius: 18,
						background: isMakeRealLoading ? '#f3e8ff' : '#faf5ff',
						color: '#7e22ce',
						fontSize: isMobile ? 11 : 12,
						fontWeight: 700,
						cursor: isMakeRealLoading ? 'wait' : 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 4,
						transition: 'all 0.12s ease',
						padding: '0 6px',
						whiteSpace: 'nowrap'
					}}
					title="선택한 와이어프레임을 반응형 인터랙티브 HTML 코드로 실시간 변환합니다"
				>
					<span>🔮</span>
					<span>{isMakeRealLoading ? '생성 중...' : isMobile ? 'Real' : 'Make Real'}</span>
				</button>
			</div>

			{/* Non-intrusive feedback toast */}
			{feedbackToast && (
				<div
					style={{
						position: 'fixed',
						bottom: 24,
						left: '50%',
						transform: 'translateX(-50%)',
						background: 'rgba(15, 23, 42, 0.92)',
						color: '#ffffff',
						padding: '8px 16px',
						borderRadius: 20,
						fontSize: 12,
						fontWeight: 600,
						zIndex: 100000,
						pointerEvents: 'none',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						display: 'flex',
						alignItems: 'center',
						gap: 6
					}}
				>
					<span>✨</span>
					<span>{feedbackToast}</span>
				</div>
			)}

			{/* [DRAW-2] Make Real Live Prototype Modal */}
			{isMakeRealOpen && (
				<div
					data-testid="make-real-modal"
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 100001,
						background: 'rgba(0, 0, 0, 0.65)',
						backdropFilter: 'blur(6px)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: isMobile ? 8 : 24
					}}
					onClick={() => setIsMakeRealOpen(false)}
				>
					<div
						style={{
							background: '#ffffff',
							borderRadius: 16,
							width: '100%',
							maxWidth: 960,
							height: isMobile ? '92vh' : '82vh',
							display: 'flex',
							flexDirection: 'column',
							overflow: 'hidden',
							boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
							border: '1px solid #e2e8f0'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div
							style={{
								padding: '12px 18px',
								borderBottom: '1px solid #e2e8f0',
								background: '#f8fafc',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
								<span style={{ fontSize: 18 }}>🔮</span>
								<div>
									<h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Make Real Live Prototype</h2>
									<span style={{ fontSize: 11, color: '#64748b' }}>Interactive HTML & Tailwind CSS Sandbox</span>
								</div>
							</div>

							{/* Controls */}
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								{/* View Switcher Tabs */}
								<div style={{ display: 'flex', background: '#e2e8f0', padding: 2, borderRadius: 8 }}>
									<button
										onClick={() => setMakeRealView('preview')}
										style={{
											padding: '4px 10px',
											borderRadius: 6,
											border: 'none',
											fontSize: 12,
											fontWeight: 600,
											background: makeRealView === 'preview' ? '#ffffff' : 'transparent',
											color: makeRealView === 'preview' ? '#0f172a' : '#64748b',
											cursor: 'pointer'
										}}
									>
										미리보기 👁️
									</button>
									<button
										onClick={() => setMakeRealView('code')}
										style={{
											padding: '4px 10px',
											borderRadius: 6,
											border: 'none',
											fontSize: 12,
											fontWeight: 600,
											background: makeRealView === 'code' ? '#ffffff' : 'transparent',
											color: makeRealView === 'code' ? '#0f172a' : '#64748b',
											cursor: 'pointer'
										}}
									>
										코드 💻
									</button>
								</div>

								{/* Open in New Tab */}
								<button
									onClick={() => {
										const blob = new Blob([makeRealHtml], { type: 'text/html' })
										const url = URL.createObjectURL(blob)
										window.open(url, '_blank')
									}}
									style={{
										padding: '6px 10px',
										borderRadius: 6,
										border: '1px solid #cbd5e1',
										background: '#ffffff',
										fontSize: 12,
										fontWeight: 600,
										color: '#334155',
										cursor: 'pointer'
									}}
									title="새 탭에서 열기"
								>
									새 탭 ↗
								</button>

								{/* Copy Code */}
								<button
									onClick={() => {
										navigator.clipboard.writeText(makeRealHtml)
										setCopySuccess(true)
										setTimeout(() => setCopySuccess(false), 2000)
									}}
									style={{
										padding: '6px 12px',
										borderRadius: 6,
										border: 'none',
										background: copySuccess ? '#10b981' : '#7e22ce',
										color: '#ffffff',
										fontSize: 12,
										fontWeight: 600,
										cursor: 'pointer',
										transition: 'background 0.15s ease'
									}}
								>
									{copySuccess ? '✓ 복사됨!' : '코드 복사'}
								</button>

								{/* Close */}
								<button
									onClick={() => setIsMakeRealOpen(false)}
									style={{
										background: 'transparent',
										border: 'none',
										fontSize: 16,
										color: '#64748b',
										cursor: 'pointer',
										padding: 4
									}}
								>
									✕
								</button>
							</div>
						</div>

						{/* Modal Content */}
						<div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
							{makeRealView === 'preview' ? (
								<iframe
									data-testid="make-real-iframe"
									srcDoc={makeRealHtml}
									sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
									style={{ width: '100%', height: '100%', border: 'none' }}
									title="Make Real Sandbox"
								/>
							) : (
								<textarea
									readOnly
									value={makeRealHtml}
									style={{
										width: '100%',
										height: '100%',
										boxSizing: 'border-box',
										padding: 16,
										fontFamily: 'monospace',
										fontSize: 13,
										background: '#0f172a',
										color: '#38bdf8',
										border: 'none',
										outline: 'none',
										resize: 'none'
									}}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
