import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredMobileFrameShape = TLBaseShape<
    'wired-mobile-frame',
    {
        w: number
        h: number
    }
>

// @ts-expect-error
export class WiredMobileFrameShapeUtil extends ShapeUtil<WiredMobileFrameShape> {
    static override type = 'wired-mobile-frame' as const
    static override props: RecordProps<WiredMobileFrameShape> = {
        w: T.number,
        h: T.number
    }

    override getDefaultProps(): WiredMobileFrameShape['props'] {
        return {
            w: 320,
            h: 680
        }
    }

    override getGeometry(shape: WiredMobileFrameShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(200, info.initialBounds.w * info.scaleX),
                h: Math.max(400, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredMobileFrameShape) {
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
                            {/* Outer phone body */}
                            <path 
                                d={`M 20 2 L ${w-20} 4 A 20 20 0 0 1 ${w-2} 24 L ${w-4} ${h-24} A 20 20 0 0 1 ${w-20} ${h-2} L 20 ${h-4} A 20 20 0 0 1 2 ${h-20} L 4 20 A 20 20 0 0 1 20 2 Z`} 
                                fill="#ffffff" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            {/* Dynamic Island / Notch */}
                            <path 
                                d={`M ${w/2 - 40} 15 L ${w/2 + 40} 16 A 10 10 0 0 1 ${w/2 + 42} 26 L ${w/2 + 38} 34 A 10 10 0 0 1 ${w/2 - 38} 35 L ${w/2 - 42} 25 A 10 10 0 0 1 ${w/2 - 40} 15 Z`} 
                                fill="#111" 
                                stroke="none" 
                                opacity={0.8}
                            />
                            {/* Inner Screen Border (Wired style) */}
                            <path 
                                d={`M 12 40 L ${w-10} 42 L ${w-12} ${h-40} L 10 ${h-38} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={1}
                                opacity={0.5}
                            />
                            {/* Home Indicator */}
                            <path 
                                d={`M ${w/2 - 50} ${h-15} L ${w/2 + 50} ${h-14}`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={4}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredMobileFrameShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredMobileFrameShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredMobileFrameShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
