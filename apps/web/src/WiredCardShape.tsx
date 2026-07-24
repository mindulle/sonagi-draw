import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredCardShape = TLBaseShape<
    'wired-card',
    {
        w: number
        h: number
        title: string
    }
>

// @ts-expect-error
export class WiredCardShapeUtil extends ShapeUtil<WiredCardShape> {
    static override type = 'wired-card' as const
    static override props: RecordProps<WiredCardShape> = {
        w: T.number,
        h: T.number,
        title: T.string
    }

    override getDefaultProps(): WiredCardShape['props'] {
        return {
            w: 240,
            h: 300,
            title: 'Card Title'
        }
    }

    override getGeometry(shape: WiredCardShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(100, info.initialBounds.w * info.scaleX),
                h: Math.max(150, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredCardShape) {
        try {
            const { w, h, title } = shape.props
            
            const imgH = h * 0.5 // Image takes top half
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: '#ffffff'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                            {/* Card Outline */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            
                            {/* Image Placeholder Box */}
                            <path 
                                d={`M 10 10 L ${w-10} 12 L ${w-12} ${imgH} L 8 ${imgH-2} Z`} 
                                fill="#f3f4f6" 
                                stroke="#111" 
                                strokeWidth={1.5}
                            />
                            {/* Image X lines */}
                            <path 
                                d={`M 10 10 L ${w-12} ${imgH}`} 
                                stroke="#ccc" 
                                strokeWidth={1.5}
                            />
                            <path 
                                d={`M ${w-10} 12 L 8 ${imgH-2}`} 
                                stroke="#ccc" 
                                strokeWidth={1.5}
                            />
                            
                            {/* Text skeleton lines */}
                            <path d={`M 15 ${imgH + 50} L ${w - 15} ${imgH + 48}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                            <path d={`M 15 ${imgH + 70} L ${w - 40} ${imgH + 72}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                            <path d={`M 15 ${imgH + 90} L ${w - 80} ${imgH + 88}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                        </svg>
                        
                        {/* Title */}
                        <div style={{
                            position: 'absolute',
                            top: imgH + 10, left: 15, width: w - 30,
                            fontFamily: 'Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            color: '#111',
                            pointerEvents: 'none'
                        }}>
                            {title}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredCardShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredCardShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredCardShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
