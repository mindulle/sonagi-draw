import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredToggleShape = TLBaseShape<
    'wired-toggle',
    {
        w: number
        h: number
        isOn: boolean
    }
>

// @ts-expect-error
export class WiredToggleShapeUtil extends ShapeUtil<WiredToggleShape> {
    static override type = 'wired-toggle' as const
    static override props: RecordProps<WiredToggleShape> = {
        w: T.number,
        h: T.number,
        isOn: T.boolean
    }

    override getDefaultProps(): WiredToggleShape['props'] {
        return {
            w: 60,
            h: 30,
            isOn: false
        }
    }

    override getGeometry(shape: WiredToggleShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredToggleShape) {
        const { w, h, isOn } = shape.props
        
        // Calculate rough paths for the toggle outline
        // We draw an oval (capsule) by doing lines and arcs
        const r = h / 2
        
        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: w,
                    height: h,
                    pointerEvents: 'all',
                    cursor: 'pointer'
                }}
                onPointerDown={(e) => {
                    // Toggle state on click
                    if (this.editor.getOnlySelectedShape()?.id === shape.id || true) {
                        e.stopPropagation()
                        this.editor.updateShape({
                            id: shape.id,
                            type: shape.type as any,
                            props: { isOn: !isOn }
                        } as any)
                    }
                }}
            >
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                        {/* Background track */}
                        <path
                            d={`M ${r} 2 L ${w - r} 4 A ${r} ${r} 0 0 1 ${w - 2} ${r} A ${r} ${r} 0 0 1 ${w - r} ${h - 2} L ${r} ${h - 4} A ${r} ${r} 0 0 1 2 ${r} A ${r} ${r} 0 0 1 ${r} 2 Z`}
                            fill={isOn ? '#a7f3d0' : '#f3f4f6'}
                            stroke="#111"
                            strokeWidth={2}
                            style={{ transition: 'fill 0.2s ease-in-out' }}
                        />
                        {/* Second rough stroke for hand-drawn feel */}
                        <path
                            d={`M ${r} 4 L ${w - r} 2 A ${r} ${r} 0 0 1 ${w - 4} ${r} A ${r} ${r} 0 0 1 ${w - r} ${h - 4} L ${r} ${h - 2} A ${r} ${r} 0 0 1 4 ${r} A ${r} ${r} 0 0 1 ${r} 4 Z`}
                            fill="none"
                            stroke="#111"
                            strokeWidth={1}
                            opacity={0.5}
                        />
                        
                        {/* Thumb (the circle that moves) */}
                        <g style={{ transform: `translateX(${isOn ? w - h : 0}px)`, transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            <circle cx={r} cy={r} r={r - 4} fill="#fff" stroke="#111" strokeWidth={2} />
                            {/* Inner rough lines for thumb */}
                            <path d={`M ${r - 2} ${r - 2} L ${r + 2} ${r + 2} M ${r + 2} ${r - 2} L ${r - 2} ${r + 2}`} stroke="#111" strokeWidth={1} opacity={0.5} />
                        </g>
                    </svg>
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredToggleShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={shape.props.h/2} ry={shape.props.h/2} />
    }

    override getIndicatorPath(shape: WiredToggleShape) {
        const w = shape.props.w
        const h = shape.props.h
        const r = h / 2
        return new Path2D(`M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`)
    }
}
