import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredButtonShape = TLBaseShape<
    'wired-button',
    {
        w: number
        h: number
        text: string
        color: string
    }
>

// @ts-expect-error
export class WiredButtonShapeUtil extends ShapeUtil<WiredButtonShape> {
    static override type = 'wired-button' as const
    static override props: RecordProps<WiredButtonShape> = {
        w: T.number,
        h: T.number,
        text: T.string,
        color: T.string
    }

    override getDefaultProps(): WiredButtonShape['props'] {
        return {
            w: 120,
            h: 48,
            text: 'Button',
            color: '#3b82f6'
        }
    }

    override getGeometry(shape: WiredButtonShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(50, info.initialBounds.w * info.scaleX),
                h: Math.max(20, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredButtonShape) {
        try {
            const { w, h, text, color } = shape.props
            
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
                            {/* Fill */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill={color} 
                                stroke="none"
                                opacity={0.8}
                            />
                            {/* Hand-drawn borders */}
                            <path 
                                d={`M 1 3 L ${w-3} 1 L ${w-1} ${h-3} L 3 ${h-1} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                            <path 
                                d={`M 4 4 L ${w-4} 2 L ${w-2} ${h-4} L 2 ${h-2} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={1}
                                opacity={0.5}
                            />
                        </svg>
                        
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'bold',
                            fontSize: `${Math.min(h * 0.4, w * 0.2)}px`,
                            color: '#fff',
                            textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                            textAlign: 'center',
                            overflow: 'hidden',
                            padding: '0 8px'
                        }}>
                            {text}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredButtonShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredButtonShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredButtonShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
