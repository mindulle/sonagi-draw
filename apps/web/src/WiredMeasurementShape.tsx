import { WiredMeasurementProps, WiredMeasurementMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredMeasurementShape = TLBaseShape<'wired-measurement', { w: number, h: number, axis: string, value: string, color: string }>

// @ts-expect-error
export class WiredMeasurementShapeUtil extends ShapeUtil<WiredMeasurementShape> {
    static override type = 'wired-measurement' as const
    static override props: RecordProps<any> = WiredMeasurementProps as any
    static override migrations = WiredMeasurementMigrations

    override getDefaultProps(): WiredMeasurementShape['props'] {
        return { w: 200, h: 24, axis: 'x', value: '24px', color: '#ef4444' }
    }

    override getGeometry(shape: WiredMeasurementShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredMeasurementShape) {
        const { w, h, axis, value, color } = shape.props
        const isX = axis === 'x'
        
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Line */}
                    <div style={{ 
                        position: 'absolute', 
                        background: color, 
                        width: isX ? '100%' : '2px', 
                        height: isX ? '2px' : '100%' 
                    }} />
                    {/* Arrows */}
                    <div style={{ position: 'absolute', left: isX ? 0 : 'calc(50% - 4px)', top: isX ? 'calc(50% - 4px)' : 0, width: 8, height: 8, borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}`, transform: isX ? 'rotate(-45deg)' : 'rotate(45deg)' }} />
                    <div style={{ position: 'absolute', right: isX ? 0 : 'calc(50% - 4px)', bottom: isX ? 'calc(50% - 4px)' : 0, width: 8, height: 8, borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}`, transform: isX ? 'rotate(-45deg)' : 'rotate(45deg)' }} />
                    {/* Text Label */}
                    <div style={{ background: color, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', zIndex: 1 }}>
                        {value}
                    </div>
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredMeasurementShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
