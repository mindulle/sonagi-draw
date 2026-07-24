import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredBrowserFrameShape = TLBaseShape<
    'wired-browser-frame',
    {
        w: number
        h: number
    }
>

// @ts-expect-error
export class WiredBrowserFrameShapeUtil extends ShapeUtil<WiredBrowserFrameShape> {
    static override type = 'wired-browser-frame' as const
    static override props: RecordProps<WiredBrowserFrameShape> = {
        w: T.number,
        h: T.number
    }

    override getDefaultProps(): WiredBrowserFrameShape['props'] {
        return {
            w: 800,
            h: 600
        }
    }

    override getGeometry(shape: WiredBrowserFrameShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(300, info.initialBounds.w * info.scaleX),
                h: Math.max(200, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredBrowserFrameShape) {
        try {
            const { w, h } = shape.props
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                            {/* Browser Body */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="#ffffff" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            {/* Top Bar Separator */}
                            <path 
                                d={`M 2 40 L ${w-2} 42`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            {/* Traffic Lights */}
                            <circle cx="20" cy="21" r="6" fill="#ef4444" stroke="#111" strokeWidth="1.5" />
                            <circle cx="40" cy="20" r="6" fill="#f59e0b" stroke="#111" strokeWidth="1.5" />
                            <circle cx="60" cy="22" r="6" fill="#10b981" stroke="#111" strokeWidth="1.5" />
                            
                            {/* URL Bar */}
                            <path 
                                d={`M 90 12 L ${w - 20} 10 L ${w - 18} 30 L 88 32 Z`} 
                                fill="#f3f4f6" 
                                stroke="#111" 
                                strokeWidth={1.5}
                            />
                            
                            {/* Inner Screen Line */}
                            <path 
                                d={`M 10 50 L ${w-12} 52 L ${w-8} ${h-10} L 12 ${h-12} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={1}
                                opacity={0.3}
                            />
                        </svg>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredBrowserFrameShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredBrowserFrameShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredBrowserFrameShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
