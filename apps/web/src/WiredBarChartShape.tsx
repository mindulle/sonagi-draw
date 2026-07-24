import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredBarChartShape = TLBaseShape<
    'wired-bar-chart',
    {
        w: number
        h: number
        color: string
        values: string // comma separated numbers, e.g., "30, 70, 45, 90, 60"
    }
>

// @ts-expect-error
export class WiredBarChartShapeUtil extends ShapeUtil<WiredBarChartShape> {
    static override type = 'wired-bar-chart' as const
    static override props: RecordProps<WiredBarChartShape> = {
        w: T.number,
        h: T.number,
        color: T.string,
        values: T.string
    }

    override getDefaultProps(): WiredBarChartShape['props'] {
        return {
            w: 300,
            h: 200,
            color: '#3b82f6',
            values: "40, 80, 55, 90, 30"
        }
    }

    override getGeometry(shape: WiredBarChartShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredBarChartShape) {
        try {
            const { w, h, color, values } = shape.props
            
            // Parse values
            const dataPts = values.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
            if (dataPts.length === 0) dataPts.push(50) // fallback
            
            const maxVal = Math.max(...dataPts, 100) // minimum scale of 100
            
            // Layout calculations
            const padding = 20
            const chartW = w - padding * 2
            const chartH = h - padding * 2
            const barWidth = Math.max(10, (chartW / dataPts.length) * 0.6)
            const gap = (chartW - (barWidth * dataPts.length)) / (dataPts.length + 1)
            
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
                            {/* Y Axis */}
                            <path 
                                d={`M ${padding} ${padding} L ${padding - 2} ${h - padding + 2} L ${padding + 2} ${h - padding - 2} L ${w - padding} ${h - padding}`} 
                                fill="none" 
                                stroke="#111" 
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            
                            {/* Bars */}
                            {dataPts.map((val, i) => {
                                const barH = (val / maxVal) * chartH
                                const x = padding + gap + i * (barWidth + gap)
                                const y = h - padding - barH
                                
                                return (
                                    <g key={i}>
                                        {/* Bar Fill */}
                                        <path 
                                            d={`M ${x} ${h - padding} L ${x + 2} ${y + 2} L ${x + barWidth - 2} ${y - 1} L ${x + barWidth} ${h - padding}`}
                                            fill={color}
                                            stroke="none"
                                        />
                                        {/* Bar Outline (Wired style) */}
                                        <path 
                                            d={`M ${x - 1} ${h - padding} L ${x + 1} ${y} L ${x + barWidth - 1} ${y} L ${x + barWidth + 1} ${h - padding}`}
                                            fill="none"
                                            stroke="#111"
                                            strokeWidth={1.5}
                                        />
                                        <path 
                                            d={`M ${x + 2} ${h - padding} L ${x - 1} ${y + 2} L ${x + barWidth + 1} ${y + 2} L ${x + barWidth - 2} ${h - padding}`}
                                            fill="none"
                                            stroke="#111"
                                            strokeWidth={1}
                                            opacity={0.5}
                                        />
                                    </g>
                                )
                            })}
                        </svg>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredBarChartShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override indicator(shape: WiredBarChartShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
