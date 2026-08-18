import { WiredStatusBadgeProps, WiredStatusBadgeMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredStatusBadgeShape = TLBaseShape<'wired-status-badge', { w: number, h: number, status: string, label: string }>

// @ts-expect-error
export class WiredStatusBadgeShapeUtil extends ShapeUtil<WiredStatusBadgeShape> {
    static override type = 'wired-status-badge' as const
    static override props: RecordProps<any> = WiredStatusBadgeProps as any
    static override migrations = WiredStatusBadgeMigrations

    override getDefaultProps(): WiredStatusBadgeShape['props'] {
        return { w: 120, h: 32, status: 'Draft', label: '✏️ Draft' }
    }

    override getGeometry(shape: WiredStatusBadgeShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredStatusBadgeShape) {
        const { w, h, status, label } = shape.props
        
        let bg = '#fef3c7'; let color = '#d97706'; let border = '#fde68a';
        if (status === 'Review') { bg = '#dbeafe'; color = '#2563eb'; border = '#bfdbfe'; }
        else if (status === 'Ready') { bg = '#dcfce3'; color = '#059669'; border = '#bbf7d0'; }
        
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', background: bg, color: color, border: `1px solid ${border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {label}
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredStatusBadgeShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />
    }
}
