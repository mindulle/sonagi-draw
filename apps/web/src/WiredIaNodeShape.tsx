import { WiredIaNodeProps, WiredIaNodeMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredIaNodeShape = TLBaseShape<'wired-ia-node', { w: number, h: number, title: string, index: string, color: string }>

// @ts-expect-error
export class WiredIaNodeShapeUtil extends ShapeUtil<WiredIaNodeShape> {
    static override type = 'wired-ia-node' as const
    static override props: RecordProps<any> = WiredIaNodeProps as any
    static override migrations = WiredIaNodeMigrations

    override getDefaultProps(): WiredIaNodeShape['props'] {
        return { w: 180, h: 60, title: 'Screen Name', index: '1.0', color: '#6366f1' }
    }

    override getGeometry(shape: WiredIaNodeShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return { props: { w: Math.max(120, info.initialBounds.w * info.scaleX), h: Math.max(40, info.initialBounds.h * info.scaleY) } } as any
    }

    override component(shape: WiredIaNodeShape) {
        const { w, h, title, index, color } = shape.props
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff', borderRadius: '6px', border: `2px solid ${color}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', fontSize: '12px' }}>
                        {index}
                    </div>
                    <div style={{ position: 'absolute', left: '50px', top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#111', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {title}
                    </div>
                </div>
            </HTMLContainer>
        )
    }

    override getIndicatorPath(shape: any) {
        return new Path2D(`M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`)
    }
    override indicator(shape: any) { return <rect width={shape.props.w} height={shape.props.h} /> }
}
