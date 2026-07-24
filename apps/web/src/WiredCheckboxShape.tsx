import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredCheckboxShape = TLBaseShape<
    'wired-checkbox',
    {
        w: number
        h: number
        isChecked: boolean
        label: string
    }
>

// @ts-expect-error
export class WiredCheckboxShapeUtil extends ShapeUtil<WiredCheckboxShape> {
    static override type = 'wired-checkbox' as const
    static override props: RecordProps<WiredCheckboxShape> = {
        w: T.number,
        h: T.number,
        isChecked: T.boolean,
        label: T.string
    }

    override getDefaultProps(): WiredCheckboxShape['props'] {
        return {
            w: 120,
            h: 30,
            isChecked: false,
            label: "Check me"
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

    override getGeometry(shape: WiredCheckboxShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredCheckboxShape) {
        const { w, h, isChecked, label } = shape.props
        
        const boxSize = 24
        const textOffset = boxSize + 8

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: w,
                    height: h,
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'all',
                    cursor: 'pointer'
                }}
                onPointerDown={(e) => {
                    // Click anywhere on the shape to toggle
                    if (this.editor.getOnlySelectedShape()?.id === shape.id || true) {
                        e.stopPropagation()
                        this.editor.updateShape({
                            id: shape.id,
                            type: shape.type as any,
                            props: { isChecked: !isChecked }
                        } as any)
                    }
                }}
            >
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <svg width={boxSize} height={boxSize} style={{ flexShrink: 0 }}>
                        {/* Rough Box */}
                        <path 
                            d={`M 2 2 L ${boxSize-2} 3 L ${boxSize-3} ${boxSize-2} L 3 ${boxSize-3} Z`} 
                            fill={isChecked ? '#3b82f6' : '#fff'} 
                            stroke="#111" 
                            strokeWidth={2}
                            style={{ transition: 'fill 0.1s' }}
                        />
                        <path 
                            d={`M 3 3 L ${boxSize-3} 2 L ${boxSize-2} ${boxSize-3} L 2 ${boxSize-2} Z`} 
                            fill="none" 
                            stroke="#111" 
                            strokeWidth={1}
                            opacity={0.5}
                        />
                        {/* Checkmark */}
                        {isChecked && (
                            <path 
                                d={`M 6 ${boxSize/2} L 10 ${boxSize-6} L ${boxSize-4} 6`} 
                                fill="none" 
                                stroke="#fff" 
                                strokeWidth={3} 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}
                        {isChecked && (
                            <path 
                                d={`M 5 ${boxSize/2 + 1} L 11 ${boxSize-5} L ${boxSize-5} 5`} 
                                fill="none" 
                                stroke="#fff" 
                                strokeWidth={1} 
                                opacity={0.7}
                            />
                        )}
                    </svg>
                    
                    {/* Label editing */}
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                            this.editor.updateShape({
                                id: shape.id,
                                type: shape.type as any,
                                props: { label: e.target.value }
                            } as any)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            marginLeft: '8px',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontFamily: 'Comic Sans MS, cursive, sans-serif',
                            fontSize: '15px',
                            color: '#111',
                            width: `calc(100% - ${textOffset}px)`
                        }}
                    />
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredCheckboxShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }

    override getIndicatorPath(shape: WiredCheckboxShape) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }
}
