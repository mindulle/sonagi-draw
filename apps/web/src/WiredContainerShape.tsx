import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredContainerShape = TLBaseShape<
    'wired-container',
    {
        w: number
        h: number
    }
>

// @ts-expect-error
export class WiredContainerShapeUtil extends ShapeUtil<WiredContainerShape> {
    static override type = 'wired-container' as const
    static override props: RecordProps<WiredContainerShape> = {
        w: T.number,
        h: T.number
    }

    override getDefaultProps(): WiredContainerShape['props'] {
        return {
            w: 400,
            h: 400
        }
    }

    override getGeometry(shape: WiredContainerShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(50, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredContainerShape) {
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
                            {/* Fill */}
                            <path 
                                d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                                fill="#ffffff" 
                                stroke="none"
                            />
                            {/* Outline */}
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
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredContainerShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredContainerShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredContainerShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
