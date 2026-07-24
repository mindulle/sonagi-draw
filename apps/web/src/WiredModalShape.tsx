import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredModalShape = TLBaseShape<
    'wired-modal',
    {
        w: number
        h: number
        title: string
    }
>

// @ts-expect-error
export class WiredModalShapeUtil extends ShapeUtil<WiredModalShape> {
    static override type = 'wired-modal' as const
    static override props: RecordProps<WiredModalShape> = {
        w: T.number,
        h: T.number,
        title: T.string
    }

    override getDefaultProps(): WiredModalShape['props'] {
        return {
            w: 400,
            h: 250,
            title: 'Modal Title'
        }
    }

    override getGeometry(shape: WiredModalShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(200, info.initialBounds.w * info.scaleX),
                h: Math.max(100, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredModalShape) {
        try {
            const { w, h, title } = shape.props
            
            const headerH = 40
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: '#ffffff',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                            {/* Modal Background */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="#ffffff" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            
                            {/* Header Separator Line */}
                            <path 
                                d={`M 2 ${headerH} L ${w-2} ${headerH+2}`} 
                                stroke="#111" 
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                            
                            {/* Close Button (X) */}
                            <path d={`M ${w - 30} 15 L ${w - 15} 30 M ${w - 15} 15 L ${w - 30} 30`} stroke="#111" strokeWidth={2} strokeLinecap="round" />
                            
                            {/* Body Text Placeholder Lines */}
                            <path d={`M 20 ${headerH + 40} L ${w - 20} ${headerH + 42}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                            <path d={`M 20 ${headerH + 60} L ${w - 40} ${headerH + 58}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                            <path d={`M 20 ${headerH + 80} L ${w - 100} ${headerH + 82}`} stroke="#ccc" strokeWidth={4} strokeLinecap="round" opacity={0.6}/>
                            
                            {/* Footer Buttons Placeholder */}
                            <path d={`M ${w - 180} ${h - 30} L ${w - 110} ${h - 32} M ${w - 90} ${h - 28} L ${w - 20} ${h - 30}`} stroke="#3b82f6" strokeWidth={15} strokeLinecap="round" opacity={0.3}/>
                        </svg>
                        
                        {/* Title */}
                        <div style={{
                            position: 'absolute',
                            top: 8, left: 15, width: w - 50,
                            fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            color: '#111',
                            pointerEvents: 'none'
                        }}>
                            {title}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredModalShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredModalShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredModalShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
