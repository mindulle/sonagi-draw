import { WiredMcpInboxProps, WiredMcpInboxMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredMcpInboxShape = TLBaseShape<'wired-mcp-inbox', { w: number, h: number, title: string, payload: string }>

// @ts-expect-error
export class WiredMcpInboxShapeUtil extends ShapeUtil<WiredMcpInboxShape> {
    static override type = 'wired-mcp-inbox' as const
    static override props: RecordProps<any> = WiredMcpInboxProps as any
    static override migrations = WiredMcpInboxMigrations

    override getDefaultProps(): WiredMcpInboxShape['props'] {
        return { w: 600, h: 400, title: 'MCP Inbox', payload: '[]' }
    }

    override getGeometry(shape: WiredMcpInboxShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return { props: { w: Math.max(200, info.initialBounds.w * info.scaleX), h: Math.max(100, info.initialBounds.h * info.scaleY) } } as any
    }

    override component(shape: WiredMcpInboxShape) {
        const { w, h, title, payload } = shape.props
        
        let parsed = []
        try { parsed = JSON.parse(payload || '[]') } catch(e) {}
        
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: '12px', border: '3px dashed #94a3b8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ background: '#94a3b8', color: '#fff', padding: '8px 12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🤖 {title}
                    </div>
                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Array.isArray(parsed) && parsed.length === 0 && (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                                Agent payload is empty. Waiting for MCP injection...
                            </div>
                        )}
                        {Array.isArray(parsed) && parsed.map((item: any, i: number) => (
                            <div key={i} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {item.imageUrl && <img src={item.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '8px' }} />}
                                {item.text && <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap' }}>{item.text}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </HTMLContainer>
        )
    }

    override getIndicatorPath(shape: WiredMcpInboxShape) {
        const path = new Path2D()
        path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
        return path
    }

    override indicator(shape: WiredMcpInboxShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
    }
}
