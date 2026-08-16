import { WiredUiElementProps, WiredUiElementMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'

export type WiredUiElementShape = TLBaseShape<'wired-ui-element', { w: number, h: number, title: string, pattern: string, imageUrl: string }>

// @ts-expect-error
export class WiredUiElementShapeUtil extends ShapeUtil<WiredUiElementShape> {
    static override type = 'wired-ui-element' as const
    static override props: RecordProps<any> = WiredUiElementProps as any
    static override migrations = WiredUiElementMigrations

    override getDefaultProps(): WiredUiElementShape['props'] {
        return { w: 300, h: 200, title: 'Component Name', pattern: 'Bottom Sheet', imageUrl: '' }
    }

    override getGeometry(shape: WiredUiElementShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return { props: { w: Math.max(100, info.initialBounds.w * info.scaleX), h: Math.max(100, info.initialBounds.h * info.scaleY) } } as any
    }

    override component(shape: WiredUiElementShape) {
        const { w, h, title, pattern, imageUrl } = shape.props
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff', borderRadius: '8px', border: '2px dashed #10b981', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ background: '#10b981', color: '#fff', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🧩 {pattern}</span>
                        <span style={{opacity: 0.8}}>{title}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', overflow: 'hidden', padding: '8px' }}>
                        {imageUrl ? (
                            <a href={imageUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
                                <img src={imageUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} draggable={false} />
                            </a>
                        ) : <span style={{ color: '#ccc' }}>No Image</span>}
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
