import { WiredVideoCardProps, WiredVideoCardMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'
import React, { useState, useRef } from 'react'

export type WiredVideoCardShape = TLBaseShape<
	'wired-video-card',
	{
		w: number
		h: number
		title: string
		videoUrl: string
		posterUrl: string
		prompt: string
		aspect: string
		status: string // 'idle' | 'generating' | 'ready' | 'error'
	}
>

// @ts-expect-error
export class WiredVideoCardShapeUtil extends ShapeUtil<WiredVideoCardShape> {
	static override type = 'wired-video-card' as const
	static override props: RecordProps<any> = WiredVideoCardProps as any
	static override migrations = WiredVideoCardMigrations

	override getDefaultProps(): WiredVideoCardShape['props'] {
		return {
			w: 420,
			h: 340,
			title: 'Scene 01: [ELS] Cinematic Shot',
			videoUrl: '',
			posterUrl: '',
			prompt: '24mm Wide Angle | Blizzard Tundra | Backlight & Amber Rimlight',
			aspect: '16:9',
			status: 'idle'
		}
	}

	override getGeometry(shape: WiredVideoCardShape) {
		return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
	}

	override onResize(_shape: any, info: any) {
		return {
			props: {
				w: Math.max(260, info.initialBounds.w * info.scaleX),
				h: Math.max(220, info.initialBounds.h * info.scaleY)
			}
		} as any
	}

	override component(shape: WiredVideoCardShape) {
		const { w, h, title, videoUrl, posterUrl, prompt, aspect, status } = shape.props
		const videoH = Math.round(h * 0.65)
		const [isPlaying, setIsPlaying] = useState(true)
		const videoRef = useRef<HTMLVideoElement>(null)

		const togglePlay = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (!videoRef.current) return
			if (videoRef.current.paused) {
				videoRef.current.play()
				setIsPlaying(true)
			} else {
				videoRef.current.pause()
				setIsPlaying(false)
			}
		}

		const handleGenerateVideo = async (e: React.MouseEvent) => {
			e.stopPropagation()
			if (status === 'generating') return

			this.editor.updateShape({
				id: shape.id,
				type: shape.type as any,
				props: { status: 'generating' }
			} as any)

			try {
				const res = await fetch('/api/ai/video-generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						prompt: prompt || title,
						aspect: aspect || '16:9',
						initialFrame: posterUrl
					})
				})
				const data = await res.json()
				if (data.ok && data.videoUrl) {
					this.editor.updateShape({
						id: shape.id,
						type: shape.type as any,
						props: {
							videoUrl: data.videoUrl,
							status: 'ready'
						}
					} as any)
				} else {
					this.editor.updateShape({
						id: shape.id,
						type: shape.type as any,
						props: { status: 'error' }
					} as any)
				}
			} catch (_) {
				this.editor.updateShape({
					id: shape.id,
					type: shape.type as any,
					props: { status: 'error' }
				} as any)
			}
		}

		const handleGenerateStill = async (e: React.MouseEvent) => {
			e.stopPropagation()
			if (status === 'generating') return

			this.editor.updateShape({
				id: shape.id,
				type: shape.type as any,
				props: { status: 'generating' }
			} as any)

			try {
				const res = await fetch('/api/ai/image-generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						prompt: prompt || title
					})
				})
				const data = await res.json()
				if (data.ok && data.url) {
					this.editor.updateShape({
						id: shape.id,
						type: shape.type as any,
						props: {
							posterUrl: data.url,
							status: 'ready'
						}
					} as any)
				} else {
					this.editor.updateShape({
						id: shape.id,
						type: shape.type as any,
						props: { status: 'error' }
					} as any)
				}
			} catch (_) {
				this.editor.updateShape({
					id: shape.id,
					type: shape.type as any,
					props: { status: 'error' }
				} as any)
			}
		}

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					width: w,
					height: h,
					pointerEvents: 'all',
					background: '#161b22',
					borderRadius: 16,
					border: '1px solid #30363d',
					boxShadow: '0 12px 32px rgba(3, 5, 8, 0.45)',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
					userSelect: 'none'
				}}
			>
				{/* Top 65%: Video/Viewport Canvas */}
				<div
					style={{
						width: '100%',
						height: videoH,
						position: 'relative',
						background: '#030508',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden'
					}}
				>
					{videoUrl ? (
						<>
							<video
								ref={videoRef}
								src={videoUrl}
								poster={posterUrl || undefined}
								autoPlay
								loop
								muted
								playsInline
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover'
								}}
							/>
							{/* Play/Pause hover toggle */}
							<button
								onClick={togglePlay}
								style={{
									position: 'absolute',
									bottom: 10,
									right: 10,
									background: 'rgba(3, 5, 8, 0.75)',
									backdropFilter: 'blur(8px)',
									border: '1px solid rgba(255, 255, 255, 0.2)',
									borderRadius: '50%',
									width: 32,
									height: 32,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#ffffff',
									cursor: 'pointer',
									transition: 'transform 0.15s ease'
								}}
							>
								{isPlaying ? (
									<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
									</svg>
								) : (
									<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
										<path d="M8 5v14l11-7z" />
									</svg>
								)}
							</button>
						</>
					) : posterUrl ? (
						<img
							src={posterUrl}
							alt={title}
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					) : (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 8,
								color: '#64748b'
							}}
						>
							<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
								<rect x="2" y="4" width="20" height="16" rx="3" />
								<path d="M7 4v4M12 4v4M17 4v4" />
								<polygon points="10,11 10,17 15,14" fill="currentColor" />
							</svg>
							<span style={{ fontSize: 11, letterSpacing: '0.05em', color: '#94a3b8' }}>16:9 VIEWPORT READY</span>
						</div>
					)}

					{/* Aspect ratio badge */}
					<div
						style={{
							position: 'absolute',
							top: 8,
							left: 8,
							background: 'rgba(15, 23, 42, 0.75)',
							backdropFilter: 'blur(8px)',
							border: '1px solid rgba(255, 255, 255, 0.15)',
							borderRadius: 6,
							padding: '2px 8px',
							fontSize: 10,
							fontWeight: 700,
							color: '#38bdf8',
							letterSpacing: '0.04em'
						}}
					>
						{aspect || '16:9'} • 24FPS
					</div>

					{/* Generating Spinner Overlay */}
					{status === 'generating' && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: 'rgba(3, 5, 8, 0.85)',
								backdropFilter: 'blur(6px)',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 10,
								color: '#00ffcc'
							}}
						>
							<div
								style={{
									width: 32,
									height: 32,
									border: '3px solid rgba(0, 255, 204, 0.2)',
									borderTopColor: '#00ffcc',
									borderRadius: '50%',
									animation: 'spin 0.8s linear infinite'
								}}
							/>
							<span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
								Veo 3.1 렌더링 중...
							</span>
						</div>
					)}
				</div>

				{/* Bottom 35%: Metadata & One-Click Generation Actions */}
				<div
					style={{
						flex: 1,
						padding: '10px 14px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						background: '#161b22'
					}}
				>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
							<h4
								style={{
									fontSize: 13,
									fontWeight: 700,
									color: '#f0ede8',
									margin: 0,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}
							>
								{title}
							</h4>
							{status === 'ready' && (
								<span style={{ fontSize: 10, color: '#00ffcc', fontWeight: 600 }}>✓ Ready</span>
							)}
							{status === 'error' && (
								<span style={{ fontSize: 10, color: '#f85149', fontWeight: 600 }}>! Error</span>
							)}
						</div>
						<p
							style={{
								fontSize: 11,
								color: '#8b949e',
								margin: 0,
								lineHeight: 1.4,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden'
							}}
						>
							{prompt || 'No direction prompt specified'}
						</p>
					</div>

					{/* Action Buttons: 1-Click Veo 3.1 & Still */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'flex-end',
							gap: 6,
							marginTop: 6
						}}
					>
						<button
							onClick={handleGenerateStill}
							disabled={status === 'generating'}
							style={{
								background: '#21262d',
								color: '#c9d1d9',
								border: '1px solid #30363d',
								borderRadius: 8,
								padding: '5px 10px',
								fontSize: 11,
								fontWeight: 600,
								cursor: status === 'generating' ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 4,
								transition: 'all 0.15s ease'
							}}
						>
							<span>🎨 Still</span>
						</button>

						<button
							onClick={handleGenerateVideo}
							disabled={status === 'generating'}
							style={{
								background: 'linear-gradient(135deg, #4A90E2 0%, #2a6bbf 100%)',
								color: '#ffffff',
								border: '1px solid rgba(74, 144, 226, 0.6)',
								borderRadius: 8,
								padding: '5px 12px',
								fontSize: 11,
								fontWeight: 700,
								cursor: status === 'generating' ? 'not-allowed' : 'pointer',
								boxShadow: '0 2px 8px rgba(74, 144, 226, 0.35)',
								display: 'flex',
								alignItems: 'center',
								gap: 4,
								transition: 'all 0.15s ease'
							}}
						>
							<span>🎬 Veo 3.1</span>
						</button>
					</div>
				</div>
			</HTMLContainer>
		)
	}
}
