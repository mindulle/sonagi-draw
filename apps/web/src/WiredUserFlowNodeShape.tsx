import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredUserFlowNodeShape = TLBaseShape<
    'wired-user-flow-node',
    {
        w: number
        h: number
        title: string
        color: string
    }
>

// @ts-expect-error
export class WiredUserFlowNodeShapeUtil extends ShapeUtil<WiredUserFlowNodeShape> {
    static override type = 'wired-user-flow-node' as const
    static override props: RecordProps<WiredUserFlowNodeShape> = {
        w: T.number,
        h: T.number,
        title: T.string,
        color: T.string
    }

    override getDefaultProps(): WiredUserFlowNodeShape['props'] {
        return {
            w: 160,
            h: 80,
            title: 'Node Step',
            color: '#f97316'
        }
    }

    override getGeometry(shape: WiredUserFlowNodeShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(100, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredUserFlowNodeShape) {
        try {
            const { w, h, title, color } = shape.props
            
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
                                opacity={0.1}
                            />
                            {/* Thick Left Border (Highlight) */}
                            <path 
                                d={`M 4 2 L 6 ${h-2}`} 
                                fill="none" 
                                stroke={color} 
                                strokeWidth={8}
                                strokeLinecap="round"
                            />
                            {/* Outline */}
                            <path 
                                d={`M 1 3 L ${w-3} 1 L ${w-1} ${h-3} L 3 ${h-1} Z`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                            />
                        </svg>
                        
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 16, width: w - 24, height: h,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#111',
                            pointerEvents: 'none',
                            textAlign: 'center'
                        }}>
                            {title}
                        </div>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredUserFlowNodeShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override getIndicatorPath(shape: WiredUserFlowNodeShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }

    override indicator(shape: WiredUserFlowNodeShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
