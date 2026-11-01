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

	// Collision avoidance: check if [targetX .. targetX + nodeWidth, initialStartY .. initialStartY + totalHeight]
	// intersects any existing shape. If so, shift targetX to the right.
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

	// Batch creation in editor
	editor.createShapes(shapesToCreate)

	// Try establishing bindings if supported by current tldraw version
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
	} catch (_) {
		// Fallback: visual geometric coordinates already perfectly placed
	}

	// Select the newly created notes
	editor.select(...newNoteIds)

	return newNoteIds
}

export function JambotQuickGestures() {
	const editor = useEditor()
	const [activeLoadingMode, setActiveLoadingMode] = useState<IdeationGestureMode | null>(null)
	const [feedbackToast, setFeedbackToast] = useState<string | null>(null)

	const isMobile = useValue('isMobile', () => {
		if (typeof window === 'undefined') return false
		return window.innerWidth <= 768
	}, [])

	const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor])

	const selectedShapes = useValue('selectedShapes', () => {
		return selectedShapeIds.map((id) => editor.getShape(id)).filter(Boolean) as TLShape[]
	}, [selectedShapeIds, editor])

	// Screen bounds of current selection
	const screenBounds = useValue('selectionScreenBounds', () => {
		if (selectedShapeIds.length === 0) return null
		try {
			return editor.getSelectionRotatedScreenBounds() || editor.getSelectionScreenBounds()
		} catch (_) {
			return null
		}
	}, [selectedShapeIds, editor])

	// Eligible shapes must have some text content (either sticky note or text/container)
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

				// Client-side fallback if server returned empty or offline
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

	// Expose programmatic trigger on window for E2E testing and automation
	if (typeof window !== 'undefined') {
		;(window as any).__JAMBOT_GESTURE__ = triggerGesture
	}

	if (!screenBounds || selectedShapes.length === 0 || !combinedText) {
		return null
	}

	// Calculate toolbar screen placement
	const toolbarWidth = isMobile ? 220 : 310
	const toolbarHeight = 44
	let left = screenBounds.x + screenBounds.w / 2 - toolbarWidth / 2
	let top = screenBounds.y - toolbarHeight - 12

	// Flip below if too close to screen top
	if (top < 56) {
		top = screenBounds.y + screenBounds.h + 12
	}

	// Clamp within viewport
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
					userSelect: 'none',
					animation: 'jambotPopIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
				}}
			>
				{/* Gesture 1: Branch (3갈래 분기) */}
				<button
					data-testid="gesture-branch"
					onClick={() => triggerGesture('branch')}
					disabled={activeLoadingMode !== null}
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
						padding: '0 6px',
						whiteSpace: 'nowrap'
					}}
					onMouseEnter={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = '#eff6ff'
					}}
					onMouseLeave={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = 'transparent'
					}}
					title="선택한 스티키로부터 3가지 연관 아이디어와 화살표를 즉시 분기합니다"
				>
					<span>💡</span>
					<span>{activeLoadingMode === 'branch' ? '분기 중...' : isMobile ? '분기' : '3갈래 분기'}</span>
				</button>

				<div style={{ width: 1, height: 18, background: '#e2e8f0' }} />

				{/* Gesture 2: Summarize (핵심 요약) */}
				<button
					data-testid="gesture-summarize"
					onClick={() => triggerGesture('summarize')}
					disabled={activeLoadingMode !== null}
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
						padding: '0 6px',
						whiteSpace: 'nowrap'
					}}
					onMouseEnter={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = '#f0fdf4'
					}}
					onMouseLeave={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = 'transparent'
					}}
					title="선택한 스티키의 핵심을 1장의 요약 노트로 집약합니다"
				>
					<span>📝</span>
					<span>{activeLoadingMode === 'summarize' ? '요약 중...' : isMobile ? '요약' : '핵심 요약'}</span>
				</button>

				<div style={{ width: 1, height: 18, background: '#e2e8f0' }} />

				{/* Gesture 3: Challenge (반박/리스크) */}
				<button
					data-testid="gesture-challenge"
					onClick={() => triggerGesture('challenge')}
					disabled={activeLoadingMode !== null}
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
						padding: '0 6px',
						whiteSpace: 'nowrap'
					}}
					onMouseEnter={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = '#fef2f2'
					}}
					onMouseLeave={(e) => {
						if (!activeLoadingMode) e.currentTarget.style.background = 'transparent'
					}}
					title="잠재 리스크 및 비판적 반박 포인트를 도출합니다"
				>
					<span>⚡</span>
					<span>{activeLoadingMode === 'challenge' ? '도출 중...' : isMobile ? '반박' : '반박/리스크'}</span>
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
		</>
	)
}
