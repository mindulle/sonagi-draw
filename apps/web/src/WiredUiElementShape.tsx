import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredUiElementShape = TLBaseShape<
    'wired-ui-element',
    {
        w: number
        h: number
        title: string
        elementUrl: string
    }
>

// @ts-expect-error
export class WiredUiElementShapeUtil extends ShapeUtil<WiredUiElementShape> {
    static override type = 'wired-ui-element' as const
    static override props: RecordProps<WiredUiElementShape> = {
        w: T.number,
        h: T.number,
        title: T.string,
        elementUrl: T.string
    }

    override getDefaultProps(): WiredUiElementShape['props'] {
        return {
            w: 320,
            h: 180,
            title: 'UI Component',
            elementUrl: ''
        }
    }

    override getGeometry(shape: WiredUiElementShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(100, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredUiElementShape) {
        try {
            const { w, h, title, elementUrl } = shape.props
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: '#ffffff',
                        border: '2px dashed #6366f1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderBottom: '1px dashed #6366f1',
                        fontFamily: 'var(--tl-font-draw), sans-serif',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#4338ca',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{title}</span>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>UI Element</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {elementUrl ? (
                            <img src={elementUrl} alt={title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <svg width="60%" height="60%" viewBox="0 0 100 100" style={{ opacity: 0.2 }}>
                                <rect x="10" y="20" width="80" height="60" rx="4" fill="none" stroke="#6366f1" strokeWidth="4" />
                                <circle cx="30" cy="50" r="10" fill="#6366f1" />
                                <line x1="50" y1="45" x2="80" y2="45" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                                <line x1="50" y1="55" x2="70" y2="55" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        )}
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            return <HTMLContainer id={shape.id}>Error</HTMLContainer>
        }
    }

    override indicator(shape: WiredUiElementShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
