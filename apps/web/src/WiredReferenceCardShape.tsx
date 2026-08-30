import { WiredReferenceCardProps, WiredReferenceCardMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'
import { tokens } from '@sonagi/tokens'

export type WiredReferenceCardShape = TLBaseShape<
    'wired-reference-card',
    {
        w: number
        h: number
        title: string
        url: string
        imageUrl: string
    }
>

// @ts-expect-error
export class WiredReferenceCardShapeUtil extends ShapeUtil<WiredReferenceCardShape> {
    static override type = 'wired-reference-card' as const
    static override props: RecordProps<any> = WiredReferenceCardProps as any
    static override migrations = WiredReferenceCardMigrations

    override getDefaultProps(): WiredReferenceCardShape['props'] {
        return {
            w: 320,
            h: 240,
            title: 'Reference Website',
            url: '',
            imageUrl: ''
        }
    }

    override getGeometry(shape: WiredReferenceCardShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(200, info.initialBounds.w * info.scaleX),
                h: Math.max(150, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredReferenceCardShape) {
        try {
            const { w, h, title, url, imageUrl } = shape.props
            const imgH = h - 60 // Leave 60px for bottom bar
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: tokens["--semantic-light-color-bg-elevated"] || '#ffffff',
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
                            {/* Divider */}
                            <path 
                                d={`M 4 ${imgH} L ${w-4} ${imgH}`} 
                                stroke="#111" 
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                            />
                        </svg>
                        
                        {/* Image Box */}
                        <div style={{
                            position: 'absolute',
                            top: 8, left: 8, width: w - 16, height: imgH - 12,
                            background: tokens["--semantic-light-color-border-default"] || '#e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}>
                            {imageUrl ? (
                                <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                            ) : (
                                <span style={{ color: tokens["--semantic-light-color-text-muted"] || '#9ca3af', fontSize: '14px' }}>No Image</span>
                            )}
                        </div>
                        
                        {/* Title and URL */}
                        <div style={{
                            position: 'absolute',
                            top: imgH + 8, left: 12, width: w - 24,
                            display: 'flex', flexDirection: 'column', gap: '4px'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: tokens["--semantic-light-color-text-primary"] || '#111', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {title}
                            </div>
                            {url && (
                                <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{ 
                                        fontSize: '12px', color: tokens["--semantic-light-color-accent-default"] || '#3b82f6', textDecoration: 'none', 
                                        textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                                        pointerEvents: 'all'
                                    }}
                                >
                                    {url}
                                </a>
                            )}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredReferenceCardShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: any) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredReferenceCardShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
