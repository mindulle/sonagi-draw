import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, T, RecordProps } from 'tldraw'

export type WiredCopyNodeShape = TLBaseShape<
    'wired-copy-node',
    {
        w: number
        h: number
        copyText: string
        category: string
    }
>

// @ts-expect-error
export class WiredCopyNodeShapeUtil extends ShapeUtil<WiredCopyNodeShape> {
    static override type = 'wired-copy-node' as const
    static override props: RecordProps<WiredCopyNodeShape> = {
        w: T.number,
        h: T.number,
        copyText: T.string,
        category: T.string
    }

    override getDefaultProps(): WiredCopyNodeShape['props'] {
        return {
            w: 260,
            h: 120,
            copyText: 'UX Writing snippet goes here...',
            category: 'Empty State'
        }
    }

    override getGeometry(shape: WiredCopyNodeShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return {
            props: {
                w: Math.max(150, info.initialBounds.w * info.scaleX),
                h: Math.max(80, info.initialBounds.h * info.scaleY),
            }
        } as any
    }

    override component(shape: WiredCopyNodeShape) {
        try {
            const { w, h, copyText, category } = shape.props
            
            return (
                <HTMLContainer
                    id={shape.id}
                    style={{
                        width: w,
                        height: h,
                        pointerEvents: 'all',
                        background: '#fef3c7', // warm yellow like a sticky note
                        border: '1px solid #f59e0b',
                        boxShadow: '2px 4px 12px rgba(0,0,0,0.1)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'var(--tl-font-draw), "Comic Sans MS", cursive, sans-serif'
                    }}
                >
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#d97706',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '0.05em'
                    }}>
                        {category} Copy
                    </div>
                    <div style={{
                        fontSize: '16px',
                        color: '#451a03',
                        lineHeight: 1.4,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        "{copyText}"
                    </div>
                </HTMLContainer>
            )
        } catch (e: any) {
            return <HTMLContainer id={shape.id}>Error</HTMLContainer>
        }
    }

    override indicator(shape: WiredCopyNodeShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
