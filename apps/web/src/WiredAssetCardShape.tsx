import { WiredAssetCardProps, WiredAssetCardMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredAssetCardShape = TLBaseShape<
    'wired-asset-card',
    {
        w: number
        h: number
        title: string
        ext: string
        tags: string
        imageUrl: string
    }
>

// @ts-expect-error
export class WiredAssetCardShapeUtil extends ShapeUtil<WiredAssetCardShape> {
    static override type = 'wired-asset-card' as const
    static override props: RecordProps<any> = WiredAssetCardProps as any
    static override migrations = WiredAssetCardMigrations

    override getDefaultProps(): WiredAssetCardShape['props'] {
        return {
            w: 240,
            h: 300,
            title: 'Asset Name',
            ext: 'svg',
            tags: '',
            imageUrl: ''
        }
    }

    override getGeometry(shape: WiredAssetCardShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(150, info.initialBounds.w * info.scaleX),
                h: Math.max(200, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredAssetCardShape) {
        try {
            const { w, h, title, ext, tags, imageUrl } = shape.props
            const imgH = h * 0.6 // Image takes top 60%
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: '#ffffff',
                        fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                            {/* Card Outline */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                        </svg>
                        
                        {/* Image Box */}
                        <div style={{
                            position: 'absolute',
                            top: 8, left: 8, width: w - 16, height: imgH - 16,
                            background: '#f9fafb',
                            border: '1.5px solid #111',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {imageUrl ? (
                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
                                    <img src={imageUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} draggable={false} title="새 탭에서 원본 보기" />
                                </a>
                            ) : (
                                <span style={{ color: '#ccc', fontSize: '14px' }}>No Image</span>
                            )}
                        </div>
                        
                        {/* Title and details */}
                        <div style={{
                            position: 'absolute',
                            top: imgH, left: 12, width: w - 24,
                            display: 'flex', flexDirection: 'column', gap: '4px'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <span style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{ext}</span>
                                </div>
                                {imageUrl && (
                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', pointerEvents: 'all' }}>
                                        원본 열기 ↗
                                    </a>
                                )}
                            </div>
                            {tags && (
                                <div style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.2', marginTop: '2px', wordBreak: 'break-word', maxHeight: '40px', overflow: 'hidden' }}>
                                    {tags}
                                </div>
                            )}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredAssetCardShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: any) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredAssetCardShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
