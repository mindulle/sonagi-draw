import { Editor, createShapeId } from 'tldraw'

const safeGroup = (editor: Editor, ids: any[]) => {
    if (ids.length > 1) {
        try {
            editor.groupShapes(ids)
        } catch (e) {
            console.error('Failed to group shapes', e)
        }
    }
}

export const toRichText = (text: string) => {
    return {
        type: 'doc',
        content: text.split('\n').map(line => line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph', content: [] })
    }
}

export const insertLayoutComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        const bgId = createShapeId()
        
        if (type === 'mobile-frame') {
            editor.createShapes([
                { id: bgId, type: 'wired-mobile-frame', x: center.x, y: center.y, props: { w: 320, h: 680 } }
            ] as any)
            editor.select(bgId)
        } 
        else if (type === 'browser-window') {
            editor.createShapes([
                { id: bgId, type: 'wired-browser-frame', x: center.x, y: center.y, props: { w: 800, h: 600 } }
            ] as any)
            editor.select(bgId)
        }
        else if (type === 'dashboard-skeleton') {
            const sidebarId = createShapeId()
            const headerId = createShapeId()
            const contentId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 900, h: 600 } },
                { id: sidebarId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'solid', w: 200, h: 600 } },
                { id: headerId, type: 'geo', x: center.x + 200, y: center.y, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 700, h: 60 } },
                { id: contentId, type: 'geo', x: center.x + 220, y: center.y + 80, props: { geo: 'rectangle', color: 'grey', fill: 'none', w: 660, h: 500, richText: toRichText('Main Content') } },
            ] as any)
            safeGroup(editor, [bgId, sidebarId, headerId, contentId])
        }
    } catch (e: any) {
        console.error("Error in insertLayoutComponent", e)
    }
}

export const insertUXPatternComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        
        if (type === 'auth-form') {
            const bgId = createShapeId()
            const titleId = createShapeId()
            const loginBtnId = createShapeId()
            const emailLabelId = createShapeId()
            const pwLabelId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'wired-card', x: center.x, y: center.y, props: { w: 400, h: 450, title: '로그인 / 회원가입' } },
                { id: emailLabelId, type: 'geo', x: center.x + 40, y: center.y + 120, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 320, h: 48, richText: toRichText('이메일 주소') } },
                { id: pwLabelId, type: 'geo', x: center.x + 40, y: center.y + 180, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 320, h: 48, richText: toRichText('비밀번호') } },
                { id: loginBtnId, type: 'wired-button', x: center.x + 40, y: center.y + 260, props: { w: 320, h: 56, text: '로그인', color: '#3b82f6' } },
            ] as any)
            safeGroup(editor, [bgId, titleId, emailLabelId, pwLabelId, loginBtnId])
        } 
        else if (type === 'pricing-table') {
            const basicCardId = createShapeId()
            const proCardId = createShapeId()
            const entCardId = createShapeId()
            const proBtnId = createShapeId()
            
            editor.createShapes([
                { id: basicCardId, type: 'wired-card', x: center.x, y: center.y, props: { w: 240, h: 360, title: 'Basic ($0)' } },
                { id: proCardId, type: 'wired-card', x: center.x + 280, y: center.y - 20, props: { w: 260, h: 400, title: 'Pro ($19)' } },
                { id: proBtnId, type: 'wired-button', x: center.x + 280 + 70, y: center.y + 320, props: { w: 120, h: 48, text: '선택하기', color: '#10b981' } },
                { id: entCardId, type: 'wired-card', x: center.x + 580, y: center.y, props: { w: 240, h: 360, title: 'Enterprise' } },
            ] as any)
            safeGroup(editor, [basicCardId, proCardId, proBtnId, entCardId])
        }
        else if (type === 'feed-list') {
            const bgId = createShapeId()
            const item1BgId = createShapeId()
            const item2BgId = createShapeId()
            const item3BgId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 600, h: 500 } },
                { id: item1BgId, type: 'wired-card', x: center.x + 20, y: center.y + 20, props: { w: 560, h: 120, title: '콘텐츠 제목 1' } },
                { id: item2BgId, type: 'wired-card', x: center.x + 20, y: center.y + 160, props: { w: 560, h: 120, title: '콘텐츠 제목 2' } },
                { id: item3BgId, type: 'wired-card', x: center.x + 20, y: center.y + 300, props: { w: 560, h: 120, title: '콘텐츠 제목 3' } },
            ] as any)
            safeGroup(editor, [bgId, item1BgId, item2BgId, item3BgId])
        }
    } catch (e: any) {
        console.error("Error in insertUXPatternComponent", e)
    }
}

export const insertDiagramComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        
        if (type === 'user-flow') {
            const actionId = createShapeId()
            const decisionId = createShapeId()
            const resultId = createShapeId()
            const arrow1Id = createShapeId()
            const arrow2Id = createShapeId()
            
            editor.createShapes([
                { id: actionId, type: 'wired-user-flow-node', x: center.x, y: center.y, props: { w: 160, h: 80, title: 'Action', color: '#3b82f6' } },
                { id: decisionId, type: 'wired-user-flow-node', x: center.x + 240, y: center.y, props: { w: 160, h: 80, title: 'Decision', color: '#f59e0b' } },
                { id: resultId, type: 'wired-user-flow-node', x: center.x + 480, y: center.y, props: { w: 160, h: 80, title: 'Result', color: '#10b981' } },
                { id: arrow1Id, type: 'arrow', x: center.x + 160, y: center.y + 40, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, color: 'black' } },
                { id: arrow2Id, type: 'arrow', x: center.x + 400, y: center.y + 40, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, color: 'black', richText: toRichText('Yes') } },
            ] as any)
            safeGroup(editor, [actionId, decisionId, resultId, arrow1Id, arrow2Id])
        } 
        else if (type === 'sitemap') {
            const rootId = createShapeId()
            const child1Id = createShapeId()
            const child2Id = createShapeId()
            const child3Id = createShapeId()
            const arrow1Id = createShapeId()
            const arrow2Id = createShapeId()
            const arrow3Id = createShapeId()
            
            editor.createShapes([
                { id: rootId, type: 'wired-user-flow-node', x: center.x + 200, y: center.y, props: { w: 160, h: 60, title: 'Home', color: '#111' } },
                { id: child1Id, type: 'wired-user-flow-node', x: center.x, y: center.y + 120, props: { w: 160, h: 60, title: 'About', color: '#6b7280' } },
                { id: child2Id, type: 'wired-user-flow-node', x: center.x + 200, y: center.y + 120, props: { w: 160, h: 60, title: 'Products', color: '#6b7280' } },
                { id: child3Id, type: 'wired-user-flow-node', x: center.x + 400, y: center.y + 120, props: { w: 160, h: 60, title: 'Contact', color: '#6b7280' } },
                { id: arrow1Id, type: 'arrow', x: center.x + 280, y: center.y + 60, props: { start: { x: 0, y: 0 }, end: { x: -200, y: 60 } } },
                { id: arrow2Id, type: 'arrow', x: center.x + 280, y: center.y + 60, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 } } },
                { id: arrow3Id, type: 'arrow', x: center.x + 280, y: center.y + 60, props: { start: { x: 0, y: 0 }, end: { x: 200, y: 60 } } },
            ] as any)
            safeGroup(editor, [rootId, child1Id, child2Id, child3Id, arrow1Id, arrow2Id, arrow3Id])
        }
        else if (type === 'sticky-cluster') {
            const bgId = createShapeId()
            const s1 = createShapeId()
            const s2 = createShapeId()
            const s3 = createShapeId()
            const s4 = createShapeId()
            const s5 = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'grey', fill: 'none', w: 500, h: 400, richText: toRichText('Idea Board'), align: 'start', verticalAlign: 'start' } },
                { id: s1, type: 'note', x: center.x + 40, y: center.y + 60, rotation: -0.1, props: { color: 'yellow', text: 'Idea 1' } },
                { id: s2, type: 'note', x: center.x + 200, y: center.y + 40, rotation: 0.05, props: { color: 'green', text: 'Idea 2' } },
                { id: s3, type: 'note', x: center.x + 340, y: center.y + 80, rotation: -0.05, props: { color: 'blue', text: 'Idea 3' } },
                { id: s4, type: 'note', x: center.x + 80, y: center.y + 220, rotation: 0.1, props: { color: 'red', text: 'Idea 4' } },
                { id: s5, type: 'note', x: center.x + 260, y: center.y + 200, rotation: -0.15, props: { color: 'yellow', text: 'Idea 5' } },
            ] as any)
            safeGroup(editor, [bgId, s1, s2, s3, s4, s5])
        }
    } catch (e: any) {
        console.error("Error in insertDiagramComponent", e)
    }
}

export const insertAnnotationComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        
        if (type === 'cursor-pointer') {
            const cursorId = createShapeId()
            
            editor.createShapes([
                { id: cursorId, type: 'arrow', x: center.x, y: center.y, props: { start: { x: 0, y: 0 }, end: { x: 20, y: 30 }, arrowheadStart: 'none', arrowheadEnd: 'arrow', color: 'black', size: 's' } },
            ] as any)
        } 
        else if (type === 'comment-pin') {
            const pinId = createShapeId()
            
            editor.createShapes([
                { id: pinId, type: 'wired-annotation-pin', x: center.x, y: center.y, props: { r: 20, label: '1', color: '#ef4444' } }
            ] as any)
            editor.select(pinId)
        }
        else if (type === 'measurement-line') {
            const arrowId = createShapeId()
            
            editor.createShapes([
                { id: arrowId, type: 'arrow', x: center.x, y: center.y, props: { start: { x: 0, y: 0 }, end: { x: 200, y: 0 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'red', size: 's', richText: toRichText('200px') } },
            ] as any)
        }
    } catch (e: any) {
        console.error("Error in insertAnnotationComponent", e)
    }
}
