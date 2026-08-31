import { WiredCopyNoteProps, WiredCopyNoteMigrations } from '@sonagi-draw/schema'
import { HTMLContainer, ShapeUtil, TLBaseShape, Rectangle2d, RecordProps } from 'tldraw'
import { tokens } from '@sonagi/tokens'

export type WiredCopyNoteShape = TLBaseShape<'wired-copy-note', { w: number, h: number, text: string, noteType: string }>

// @ts-expect-error
export class WiredCopyNoteShapeUtil extends ShapeUtil<WiredCopyNoteShape> {
    static override type = 'wired-copy-note' as const
    static override props: RecordProps<any> = WiredCopyNoteProps as any
    static override migrations = WiredCopyNoteMigrations

    override getDefaultProps(): WiredCopyNoteShape['props'] {
        return { w: 200, h: 120, text: '여기에 마이크로카피나 텍스트를 입력하세요.', noteType: 'UX Copy' }
    }

    override getGeometry(shape: WiredCopyNoteShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    override onResize(_shape: any, info: any) {
        return { props: { w: Math.max(100, info.initialBounds.w * info.scaleX), h: Math.max(50, info.initialBounds.h * info.scaleY) } } as any
    }

    override component(shape: WiredCopyNoteShape) {
        const { w, h, text, noteType } = shape.props
        return (
            <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: 'all' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fef08a', borderRadius: '4px', border: '1px solid #facc15', boxShadow: '2px 4px 10px rgba(0,0,0,0.1)', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '10px', color: '#ca8a04', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                        ✍️ {noteType}
                    </div>
                    <div style={{ fontSize: '15px', color: tokens["--semantic-light-color-text-primary"] || '#111', lineHeight: '1.5', fontFamily: 'var(--tl-font-draw), Comic Sans MS, cursive, sans-serif', flex: 1, overflow: 'hidden' }}>
                        "{text}"
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
