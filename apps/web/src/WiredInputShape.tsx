import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredInputShape = TLBaseShape<
    'wired-input',
    {
        w: number
        h: number
        placeholder: string
    }
>

// @ts-expect-error
export class WiredInputShapeUtil extends ShapeUtil<WiredInputShape> {
    static override type = 'wired-input' as const
    static override props: RecordProps<WiredInputShape> = {
        w: T.number,
        h: T.number,
        placeholder: T.string
    }

    override getDefaultProps(): WiredInputShape['props'] {
        return {
            w: 320,
            h: 48,
            placeholder: 'Enter text...'
        }
    }

    override getGeometry(shape: WiredInputShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(100, info.initialBounds.w * info.scaleX),
                h: Math.max(30, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredInputShape) {
        try {
            const { w, h, placeholder } = shape.props
            
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
                            {/* Input Background */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="#f9fafb" 
                                stroke="#111" 
                                strokeWidth={1.5}
                                opacity={0.9}
                            />
                            {/* Inner Shadow / Focus line simulation */}
                            <path 
                                d={`M 4 4 L ${w-4} 6`} 
                                fill="none" 
                                stroke="#ccc" 
                                strokeWidth={2}
                            />
                        </svg>
                        
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 16, width: w - 32, height: h,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                            fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'normal',
                            fontSize: '15px',
                            color: '#6b7280', // placeholder gray
                            pointerEvents: 'none'
                        }}>
                            {placeholder}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredInputShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredInputShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredInputShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
