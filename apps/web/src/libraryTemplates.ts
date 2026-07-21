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
        content: text.split('\n').map(line => line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })
    }
}

export const insertLayoutComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        
        if (type === 'mobile-frame') {
            const bgId = createShapeId()
            const islandId = createShapeId()
            const homeBarId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 320, h: 680, size: 'm' } },
                { id: islandId, type: 'geo', x: center.x + 100, y: center.y + 12, props: { geo: 'rectangle', color: 'black', fill: 'solid', w: 120, h: 24, size: 's' } },
                { id: homeBarId, type: 'geo', x: center.x + 90, y: center.y + 650, props: { geo: 'rectangle', color: 'black', fill: 'solid', w: 140, h: 4, size: 's' } },
            ] as any)
            safeGroup(editor, [bgId, islandId, homeBarId])
        } 
        else if (type === 'browser-window') {
            const bgId = createShapeId()
            const topBarId = createShapeId()
            const redBtnId = createShapeId()
            const yellowBtnId = createShapeId()
            const greenBtnId = createShapeId()
            const searchBarId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 800, h: 600 } },
                { id: topBarId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 800, h: 48 } },
                { id: redBtnId, type: 'geo', x: center.x + 16, y: center.y + 16, props: { geo: 'ellipse', color: 'red', fill: 'solid', w: 16, h: 16 } },
                { id: yellowBtnId, type: 'geo', x: center.x + 40, y: center.y + 16, props: { geo: 'ellipse', color: 'yellow', fill: 'solid', w: 16, h: 16 } },
                { id: greenBtnId, type: 'geo', x: center.x + 64, y: center.y + 16, props: { geo: 'ellipse', color: 'green', fill: 'solid', w: 16, h: 16 } },
                { id: searchBarId, type: 'geo', x: center.x + 200, y: center.y + 8, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 400, h: 32 } },
            ] as any)
            safeGroup(editor, [bgId, topBarId, redBtnId, yellowBtnId, greenBtnId, searchBarId])
        }
        else if (type === 'dashboard-skeleton') {
            const bgId = createShapeId()
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
        alert("에러 발생: " + e.message)
    }
}

export const insertUXPatternComponent = (editor: Editor, type: string) => {
    try {
        const center = editor.getViewportPageBounds().center
        
        if (type === 'auth-form') {
            const bgId = createShapeId()
            const titleId = createShapeId()
            const emailInputId = createShapeId()
            const pwInputId = createShapeId()
            const loginBtnId = createShapeId()
            const linkId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 400, h: 450, size: 'm' } },
                { id: titleId, type: 'geo', x: center.x + 140, y: center.y + 20, props: { geo: 'rectangle', fill: 'none', w: 120, h: 50, richText: toRichText('로그인'), size: 'l', color: 'black' } },
                { id: emailInputId, type: 'geo', x: center.x + 40, y: center.y + 120, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 320, h: 48, richText: toRichText('이메일 주소') } },
                { id: pwInputId, type: 'geo', x: center.x + 40, y: center.y + 180, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 320, h: 48, richText: toRichText('비밀번호') } },
                { id: loginBtnId, type: 'geo', x: center.x + 40, y: center.y + 260, props: { geo: 'rectangle', color: 'blue', fill: 'solid', w: 320, h: 56, richText: toRichText('로그인'), size: 'm' } },
                { id: linkId, type: 'geo', x: center.x + 80, y: center.y + 340, props: { geo: 'rectangle', fill: 'none', w: 240, h: 40, richText: toRichText('비밀번호를 잊으셨나요?'), size: 's', color: 'blue' } },
            ] as any)
            safeGroup(editor, [bgId, titleId, emailInputId, pwInputId, loginBtnId, linkId])
        } 
        else if (type === 'pricing-table') {
            const bgId = createShapeId()
            const basicCardId = createShapeId()
            const proCardId = createShapeId()
            const entCardId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 900, h: 500, size: 'm' } },
                { id: basicCardId, type: 'geo', x: center.x + 40, y: center.y + 40, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 240, h: 420, richText: toRichText('Basic\n\n$0/mo\n\n- 기능 A\n- 기능 B') } },
                { id: proCardId, type: 'geo', x: center.x + 320, y: center.y + 20, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 260, h: 460, richText: toRichText('Pro\n\n$19/mo\n\n- 기능 A\n- 기능 B\n- 기능 C\n- 24/7 지원') } },
                { id: entCardId, type: 'geo', x: center.x + 620, y: center.y + 40, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 240, h: 420, richText: toRichText('Enterprise\n\nContact Us\n\n- 무제한 기능\n- 전담 매니저') } },
            ] as any)
            safeGroup(editor, [bgId, basicCardId, proCardId, entCardId])
        }
        else if (type === 'feed-list') {
            const bgId = createShapeId()
            const item1BgId = createShapeId()
            const item1ImgId = createShapeId()
            const item2BgId = createShapeId()
            const item2ImgId = createShapeId()
            const item3BgId = createShapeId()
            const item3ImgId = createShapeId()
            
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 600, h: 500 } },
                
                { id: item1BgId, type: 'geo', x: center.x + 20, y: center.y + 20, props: { geo: 'rectangle', color: 'grey', fill: 'none', w: 560, h: 120, align: 'start', richText: toRichText('                콘텐츠 제목 1\n                여기에 설명이 들어갑니다...') } },
                { id: item1ImgId, type: 'geo', x: center.x + 40, y: center.y + 40, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 80, h: 80 } },
                
                { id: item2BgId, type: 'geo', x: center.x + 20, y: center.y + 160, props: { geo: 'rectangle', color: 'grey', fill: 'none', w: 560, h: 120, align: 'start', richText: toRichText('                콘텐츠 제목 2\n                여기에 설명이 들어갑니다...') } },
                { id: item2ImgId, type: 'geo', x: center.x + 40, y: center.y + 180, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 80, h: 80 } },
                
                { id: item3BgId, type: 'geo', x: center.x + 20, y: center.y + 300, props: { geo: 'rectangle', color: 'grey', fill: 'none', w: 560, h: 120, align: 'start', richText: toRichText('                콘텐츠 제목 3\n                여기에 설명이 들어갑니다...') } },
                { id: item3ImgId, type: 'geo', x: center.x + 40, y: center.y + 320, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 80, h: 80 } },
            ] as any)
            safeGroup(editor, [bgId, item1BgId, item1ImgId, item2BgId, item2ImgId, item3BgId, item3ImgId])
        }
    } catch (e: any) {
        console.error("Error in insertUXPatternComponent", e)
        alert("에러 발생: " + e.message)
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
                { id: actionId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'blue', fill: 'solid', w: 160, h: 60, richText: toRichText('Action\n(e.g., Click Login)') } },
                { id: decisionId, type: 'geo', x: center.x + 240, y: center.y - 20, props: { geo: 'diamond', color: 'yellow', fill: 'solid', w: 160, h: 100, richText: toRichText('Decision\n(Valid?)') } },
                { id: resultId, type: 'geo', x: center.x + 480, y: center.y, props: { geo: 'rectangle', color: 'green', fill: 'solid', w: 160, h: 60, richText: toRichText('Result\n(Success)') } },
                { id: arrow1Id, type: 'arrow', x: center.x + 160, y: center.y + 30, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, color: 'black' } },
                { id: arrow2Id, type: 'arrow', x: center.x + 400, y: center.y + 30, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, color: 'black', richText: toRichText('Yes') } },
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
                { id: rootId, type: 'geo', x: center.x + 200, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'solid', w: 160, h: 60, richText: toRichText('Home') } },
                { id: child1Id, type: 'geo', x: center.x, y: center.y + 120, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 160, h: 60, richText: toRichText('About') } },
                { id: child2Id, type: 'geo', x: center.x + 200, y: center.y + 120, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 160, h: 60, richText: toRichText('Products') } },
                { id: child3Id, type: 'geo', x: center.x + 400, y: center.y + 120, props: { geo: 'rectangle', color: 'grey', fill: 'semi', w: 160, h: 60, richText: toRichText('Contact') } },
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
                { id: s1, type: 'geo', x: center.x + 40, y: center.y + 60, rotation: -0.1, props: { geo: 'rectangle', color: 'yellow', fill: 'solid', w: 120, h: 120, richText: toRichText('Idea 1') } },
                { id: s2, type: 'geo', x: center.x + 200, y: center.y + 40, rotation: 0.05, props: { geo: 'rectangle', color: 'green', fill: 'solid', w: 120, h: 120, richText: toRichText('Idea 2') } },
                { id: s3, type: 'geo', x: center.x + 340, y: center.y + 80, rotation: -0.05, props: { geo: 'rectangle', color: 'blue', fill: 'solid', w: 120, h: 120, richText: toRichText('Idea 3') } },
                { id: s4, type: 'geo', x: center.x + 80, y: center.y + 220, rotation: 0.1, props: { geo: 'rectangle', color: 'red', fill: 'solid', w: 120, h: 120, richText: toRichText('Idea 4') } },
                { id: s5, type: 'geo', x: center.x + 260, y: center.y + 200, rotation: -0.15, props: { geo: 'rectangle', color: 'yellow', fill: 'solid', w: 120, h: 120, richText: toRichText('Idea 5') } },
            ] as any)
            safeGroup(editor, [bgId, s1, s2, s3, s4, s5])
        }
    } catch (e: any) {
        console.error("Error in insertDiagramComponent", e)
        alert("에러 발생: " + e.message)
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
            const textId = createShapeId()
            
            editor.createShapes([
                { id: pinId, type: 'geo', x: center.x, y: center.y, props: { geo: 'ellipse', color: 'red', fill: 'solid', w: 32, h: 32, richText: toRichText('1'), size: 's' } },
                { id: textId, type: 'geo', x: center.x + 40, y: center.y - 10, props: { geo: 'rectangle', fill: 'none', w: 260, h: 50, richText: toRichText('여기에 코멘트를 작성하세요'), align: 'start', size: 's', color: 'red' } },
            ] as any)
            safeGroup(editor, [pinId, textId])
        }
        else if (type === 'measurement-line') {
            const arrowId = createShapeId()
            
            editor.createShapes([
                { id: arrowId, type: 'arrow', x: center.x, y: center.y, props: { start: { x: 0, y: 0 }, end: { x: 200, y: 0 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'red', size: 's', richText: toRichText('200px') } },
            ] as any)
        }
    } catch (e: any) {
        console.error("Error in insertAnnotationComponent", e)
        alert("에러 발생: " + e.message)
    }
}
