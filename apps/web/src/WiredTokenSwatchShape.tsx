import { WiredTokenSwatchProps, WiredTokenSwatchMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredTokenSwatchShape = TLBaseShape<'wired-token-swatch', { w: number, h: number, colorHex: string, tokenName: string, role: string }>

// @ts-expect-error
export class WiredTokenSwatchShapeUtil extends ShapeUtil<WiredTokenSwatchShape> {
    static override type = 'wired-token-swatch' as const
    static override props: RecordProps<any> = WiredTokenSwatchProps as any
    static override migrations = WiredTokenSwatchMigrations

    override getDefaultProps(): WiredTokenSwatchShape['props'] {
        return { w: 160, h: 200, colorHex: '#1c2c4d', tokenName: '--sng-color-primary', role: 'Main Background' }
    }

    override getGeometry(shape: WiredTokenSwatchShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override component(shape: WiredTokenSwatchShape) {
        const { w, h, colorHex, tokenName, role } = shape.props
        
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: colorHex, flex: 1, width: '100%' }} />
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{colorHex}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280' }}>{tokenName}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{role}</div>
                    </div>
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: WiredTokenSwatchShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={8} ry={8} />
    }
}
