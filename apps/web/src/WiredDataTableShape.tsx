import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredDataTableShape = TLBaseShape<
    'wired-data-table',
    {
        rows: number
        cols: number
        cellWidth: number
        cellHeight: number
        data: Record<string, string>
    }
>

// @ts-expect-error TLShape is a closed union of built-in shapes, so we bypass constraint for custom shapes
export class WiredDataTableShapeUtil extends ShapeUtil<WiredDataTableShape> {
    static override type = 'wired-data-table' as const
    static override props: RecordProps<WiredDataTableShape> = {
        rows: T.number,
        cols: T.number,
        cellWidth: T.number,
        cellHeight: T.number,
        data: T.dict(T.string, T.string)
    }

    override getDefaultProps(): WiredDataTableShape['props'] {
        return {
            rows: 3,
            cols: 3,
            cellWidth: 120,
            cellHeight: 40,
            data: {}
        }
    }

    override getGeometry(shape: WiredDataTableShape) {
        const w = shape.props.cols * shape.props.cellWidth
        const h = shape.props.rows * shape.props.cellHeight
        return new Rectangle2d({ width: w, height: h, isFilled: true })
    }

    override component(shape: WiredDataTableShape) {
        const { rows, cols, cellWidth, cellHeight, data } = shape.props
        const w = cols * cellWidth
        const h = rows * cellHeight

        // Generate rough SVG lines for the grid
        const paths = []
        
        // Outer border
        paths.push(`M 2 2 L ${w-2} 4 L ${w-4} ${h-2} L 4 ${h-4} Z`)
        paths.push(`M 4 4 L ${w-4} 2 L ${w-2} ${h-4} L 2 ${h-2} Z`)

        // Horizontal lines
        for (let r = 1; r < rows; r++) {
            const y = r * cellHeight
            paths.push(`M 2 ${y-1} L ${w-2} ${y+1}`)
            paths.push(`M 4 ${y+1} L ${w-4} ${y-1}`)
        }

        // Vertical lines
        for (let c = 1; c < cols; c++) {
            const x = c * cellWidth
            paths.push(`M ${x-1} 2 L ${x+1} ${h-2}`)
            paths.push(`M ${x+1} 4 L ${x-1} ${h-4}`)
        }

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
                    <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        {paths.map((d, i) => (
                            <path key={i} d={d} fill="none" stroke="#000" strokeWidth={1} opacity={0.7} />
                        ))}
                    </svg>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
                        gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0, left: 0
                    }}>
                        {Array.from({ length: rows }).map((_, r) => (
                            Array.from({ length: cols }).map((_, c) => {
                                const key = `${r},${c}`
                                const isHeader = r === 0
                                return (
                                    <input
                                        key={key}
                                        type="text"
                                        value={data[key] || ''}
                                        placeholder={isHeader ? 'Header' : '...'}
                                        onChange={(e) => {
                                            const newData = { ...data, [key]: e.target.value }
                                            this.editor.updateShape({
                                                id: shape.id,
                                                type: shape.type as any,
                                                props: { data: newData }
                                            } as any)
                                        }}
                                        onPointerDown={(e) => {
                                            if (this.editor.getOnlySelectedShape()?.id === shape.id) {
                                                e.stopPropagation()
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            padding: '8px',
                                            fontFamily: 'Comic Sans MS, cursive, sans-serif',
                                            fontSize: isHeader ? '14px' : '13px',
                                            fontWeight: isHeader ? 'bold' : 'normal',
                                            textAlign: 'center',
                                            color: '#111'
                                        }}
                                    />
                                )
                            })
                        ))}
                    </div>

                    {/* Controls to add/remove rows and cols - only visible when selected */}
                    {this.editor.getOnlySelectedShape()?.id === shape.id && (
                        <>
                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation()
                                    this.editor.updateShape({ id: shape.id, type: shape.type as any, props: { cols: cols + 1 } } as any)
                                }}
                                style={{ position: 'absolute', top: '50%', right: -30, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '1px solid #000', cursor: 'pointer', fontWeight: 'bold' }}
                            >+</button>
                            {cols > 1 && (
                                <button
                                    onPointerDown={(e) => {
                                        e.stopPropagation()
                                        this.editor.updateShape({ id: shape.id, type: shape.type as any, props: { cols: cols - 1 } } as any)
                                    }}
                                    style={{ position: 'absolute', top: '50%', right: -60, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '1px solid #000', cursor: 'pointer', fontWeight: 'bold' }}
                                >-</button>
                            )}

                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation()
                                    this.editor.updateShape({ id: shape.id, type: shape.type as any, props: { rows: rows + 1 } } as any)
                                }}
                                style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '1px solid #000', cursor: 'pointer', fontWeight: 'bold' }}
                            >+</button>
                            {rows > 1 && (
                                <button
                                    onPointerDown={(e) => {
                                        e.stopPropagation()
                                        this.editor.updateShape({ id: shape.id, type: shape.type as any, props: { rows: rows - 1 } } as any)
                                    }}
                                    style={{ position: 'absolute', bottom: -30, left: 'calc(50% + 30px)', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '1px solid #000', cursor: 'pointer', fontWeight: 'bold' }}
                                >-</button>
                            )}
                        </>
                    )}
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredDataTableShape) {
        const w = shape.props.cols * shape.props.cellWidth
        const h = shape.props.rows * shape.props.cellHeight
        return <rect width={w} height={h} />
    }

    override getIndicatorPath(shape: WiredDataTableShape) {
        const w = shape.props.cols * shape.props.cellWidth
        const h = shape.props.rows * shape.props.cellHeight
        return new Path2D(`M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`)
    }
}
