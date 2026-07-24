import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredProgressShape = TLBaseShape<
    'wired-progress',
    {
        w: number
        h: number
        progress: number
        color: string
    }
>

// @ts-expect-error TLShape is a closed union of built-in shapes in current types, so we bypass constraint for custom shapes
export class WiredProgressShapeUtil extends ShapeUtil<WiredProgressShape> {
    static override type = 'wired-progress' as const
    static override props: RecordProps<WiredProgressShape> = {
        w: T.number,
        h: T.number,
        progress: T.number,
        color: T.string
    }

    override getDefaultProps(): WiredProgressShape['props'] {
        return {
            w: 200,
            h: 40,
            progress: 50,
            color: '#3b82f6'
        }
    }

    
    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(50, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override getGeometry(shape: WiredProgressShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredProgressShape) {
        const { w, h, progress, color } = shape.props

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: w,
                    height: h,
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'all'
                }}
            >
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path 
                            d={`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`} 
                            fill="none" 
                            stroke="#000" 
                            strokeWidth={2}
                        />
                        <path 
                            d={`M 4 4 L ${w-4} 2 L ${w-2} ${h-4} L 2 ${h-2} Z`} 
                            fill="none" 
                            stroke="#000" 
                            strokeWidth={1}
                            opacity={0.5}
                        />
                        <path 
                            d={`M 4 4 L ${4 + Math.max(0, (w - 8) * (progress / 100))} 5 L ${4 + Math.max(0, (w - 8) * (progress / 100))} ${h-5} L 5 ${h-4} Z`} 
                            fill={color} 
                            stroke="none" 
                        />
                        <path 
                            d={`M 10 10 L ${10 + Math.max(0, (w - 20) * (progress / 100))} ${h-10}`}
                            stroke="#fff"
                            strokeWidth={2}
                            opacity={0.3}
                        />
                    </svg>
                    
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: progress > 50 ? '#fff' : '#000',
                        textShadow: progress > 50 ? '1px 1px 0px rgba(0,0,0,0.5)' : 'none',
                        pointerEvents: 'none'
                    }}>
                        {Math.round(progress)}%
                    </div>
                    
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => {
                            this.editor.updateShape({
                                id: shape.id,
                                type: shape.type as any,
                                props: { progress: parseInt(e.target.value) }
                            } as any)
                        }}
                        onPointerDown={(e) => {
                            if (this.editor.getOnlySelectedShape()?.id === shape.id) {
                                e.stopPropagation()
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'ew-resize'
                        }}
                    />
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredProgressShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }

    override getIndicatorPath(shape: WiredProgressShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }
}
