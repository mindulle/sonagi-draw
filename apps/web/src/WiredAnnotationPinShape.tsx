import { HTMLContainer, ShapeUtil, TLBaseShape, Circle2d, T, RecordProps } from 'tldraw'

export type WiredAnnotationPinShape = TLBaseShape<
    'wired-annotation-pin',
    {
        r: number
        label: string
        color: string
    }
>

// @ts-expect-error
export class WiredAnnotationPinShapeUtil extends ShapeUtil<WiredAnnotationPinShape> {
    static override type = 'wired-annotation-pin' as const
    static override props: RecordProps<WiredAnnotationPinShape> = {
        r: T.number,
        label: T.string,
        color: T.string
    }

    override getDefaultProps(): WiredAnnotationPinShape['props'] {
        return {
            r: 20,
            label: '1',
            color: '#ef4444'
        }
    }

    override getGeometry(shape: WiredAnnotationPinShape) {
        return new Circle2d({ x: 0, y: 0, radius: shape.props.r, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        const minDim = Math.min(info.initialBounds.w * info.scaleX, info.initialBounds.h * info.scaleY)
        return {
            props: {
                r: Math.max(10, minDim / 2),
            }
        } as any
    }

    override component(shape: WiredAnnotationPinShape) {
        try {
            const { r, label, color } = shape.props
            const d = r * 2
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: d,
                        height: d,
                        pointerEvents: 'all'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={d} height={d} style={{ position: 'absolute', top: 0, left: 0 }}>
                            {/* Fill */}
                            <circle cx={r} cy={r} r={r-2} fill={color} stroke="none" />
                            {/* Outline */}
                            <path 
                                d={`M 2 ${r} A ${r-2} ${r-2} 0 1 1 ${d-2} ${r} A ${r-2} ${r-2} 0 1 1 2 ${r}`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2.5}
                            />
                            {/* Inner sketchy circle */}
                            <circle cx={r+1} cy={r-1} r={r-4} fill="none" stroke="#111" strokeWidth={1} opacity={0.5} />
                        </svg>
                        
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'bold',
                            fontSize: `${r}px`,
                            color: '#fff',
                            pointerEvents: 'none'
                        }}>
                            {label}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredAnnotationPinShape render error:", e)
            return <HTMLContainer id={shape.id}>!</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredAnnotationPinShape) {
        const d = shape.props.r * 2
        return new Path2D(`M 0 0 L ${d} 0 L ${d} ${d} L 0 ${d} Z`)
    }

    override indicator(shape: WiredAnnotationPinShape) {
        return <circle cx={shape.props.r} cy={shape.props.r} r={shape.props.r} />
    }
}
