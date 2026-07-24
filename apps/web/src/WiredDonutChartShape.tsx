import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredDonutChartShape = TLBaseShape<
    'wired-donut-chart',
    {
        w: number
        h: number
        color: string
        values: string // comma separated numbers
    }
>

// @ts-expect-error
export class WiredDonutChartShapeUtil extends ShapeUtil<WiredDonutChartShape> {
    static override type = 'wired-donut-chart' as const
    static override props: RecordProps<WiredDonutChartShape> = {
        w: T.number,
        h: T.number,
        color: T.string,
        values: T.string
    }

    override getDefaultProps(): WiredDonutChartShape['props'] {
        return {
            w: 200,
            h: 200,
            color: '#10b981',
            values: "30, 40, 20, 10"
        }
    }

    override getGeometry(shape: WiredDonutChartShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredDonutChartShape) {
        try {
            const { w, h, color, values } = shape.props
            
            const dataPts = values.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
            if (dataPts.length === 0) dataPts.push(100)
            
            const total = dataPts.reduce((a, b) => a + b, 0)
            const cx = w / 2
            const cy = h / 2
            const r = Math.min(w, h) / 2 - 10
            const innerR = r * 0.5
            
            let currentAngle = -Math.PI / 2 // Start at top
            
            // Colors for slices if we want variation, but we'll use opacity variations of the main color
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{ width: w, height: h, pointerEvents: 'all' }}
                >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
                            {dataPts.map((val, i) => {
                                const sliceAngle = (val / total) * Math.PI * 2
                                const endAngle = currentAngle + sliceAngle
                                
                                // Calculate points
                                const x1 = cx + r * Math.cos(currentAngle)
                                const y1 = cy + r * Math.sin(currentAngle)
                                const x2 = cx + r * Math.cos(endAngle)
                                const y2 = cy + r * Math.sin(endAngle)
                                
                                const ix1 = cx + innerR * Math.cos(currentAngle)
                                const iy1 = cy + innerR * Math.sin(currentAngle)
                                const ix2 = cx + innerR * Math.cos(endAngle)
                                const iy2 = cy + innerR * Math.sin(endAngle)
                                
                                const largeArc = sliceAngle > Math.PI ? 1 : 0
                                
                                // SVG Path for the donut slice
                                const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
                                
                                // Rough outline path (slightly offset for hand-drawn feel)
                                const outlineData = `M ${x1-1} ${y1+1} A ${r+1} ${r-1} 0 ${largeArc} 1 ${x2+1} ${y2-1} L ${ix2-1} ${iy2+1} A ${innerR-1} ${innerR+1} 0 ${largeArc} 0 ${ix1+1} ${iy1-1} Z`
                                
                                const res = (
                                    <g key={i}>
                                        <path 
                                            d={pathData} 
                                            fill={color} 
                                            opacity={1 - (i * 0.15)} // Varies opacity to distinguish slices
                                        />
                                        <path 
                                            d={outlineData} 
                                            fill="none" 
                                            stroke="#111" 
                                            strokeWidth={1.5}
                                        />
                                    </g>
                                )
                                
                                currentAngle = endAngle
                                return res
                            })}
                        </svg>
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            console.error("WiredDonutChartShape render error:", e)
            return <HTMLContainer id={shape.id}>Error: {e.message}</HTMLContainer>
        }
    }

    override indicator(shape: WiredDonutChartShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
