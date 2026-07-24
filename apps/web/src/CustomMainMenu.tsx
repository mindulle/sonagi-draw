import { DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuItem, TldrawUiMenuGroup, useEditor, createShapeId, PageRecordType } from 'tldraw'

export function CustomMainMenu() {
    const editor = useEditor()

    const apply4TabsTemplate = () => {
        // First, rename the current page to "📌 Requirements"
        const currentPage = editor.getCurrentPage()
        editor.updatePage({ id: currentPage.id, name: "📌 Requirements" })
        
        // Add the 2x2 Matrix to Requirements
        editor.createShapes([
            { id: createShapeId(), type: 'geo', x: 100, y: 100, props: { geo: 'rectangle', w: 400, h: 400, text: 'High Impact / Low Effort (가장 먼저)' } },
            { id: createShapeId(), type: 'geo', x: 500, y: 100, props: { geo: 'rectangle', w: 400, h: 400, text: 'High Impact / High Effort (메인 플젝)' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 500, props: { geo: 'rectangle', w: 400, h: 400, text: 'Low Impact / Low Effort (시간 남을 때)' } },
            { id: createShapeId(), type: 'geo', x: 500, y: 500, props: { geo: 'rectangle', w: 400, h: 400, text: 'Low Impact / High Effort (안 해도 됨)' } }
        ] as any[])
        
        // Create User Journey Page
        const journeyPageId = PageRecordType.createId()
        editor.createPage({ name: "🗺️ User Journey", id: journeyPageId })
        editor.setCurrentPage(journeyPageId)
        editor.createShapes([
            { id: createShapeId(), type: 'note', x: 100, y: 100, props: { text: '1. 앱 실행', color: 'blue' } },
            { id: createShapeId(), type: 'note', x: 300, y: 100, props: { text: '2. 로그인', color: 'blue' } },
            { id: createShapeId(), type: 'note', x: 100, y: 300, props: { text: '긍정적 감정 😄', color: 'green' } }
        ] as any[])

        // Create Wireframe Page
        const wireframePageId = PageRecordType.createId()
        editor.createPage({ name: "📐 Wireframe & UI Kit", id: wireframePageId })
        editor.setCurrentPage(wireframePageId)
        editor.createShapes([
            { id: createShapeId(), type: 'geo', x: 100, y: 100, props: { geo: 'rectangle', w: 375, h: 812, text: 'Mobile App Frame' } },
            { id: createShapeId(), type: 'geo', x: 500, y: 100, props: { geo: 'rectangle', w: 1280, h: 800, text: 'Web Desktop Frame' } }
        ] as any[])

        // Create Moodboard Page
        const moodboardPageId = PageRecordType.createId()
        editor.createPage({ name: "🎨 Moodboard", id: moodboardPageId })
        editor.setCurrentPage(moodboardPageId)
        editor.createShapes([
            { id: createShapeId(), type: 'text', x: 100, y: 100, props: { text: '1. Clean & Minimal UI\n2. Bold Typography\n3. High Contrast', size: 'l' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 300, props: { geo: 'rectangle', w: 100, h: 100, color: 'black', fill: 'solid' } },
            { id: createShapeId(), type: 'geo', x: 220, y: 300, props: { geo: 'rectangle', w: 100, h: 100, color: 'blue', fill: 'solid' } },
            { id: createShapeId(), type: 'geo', x: 340, y: 300, props: { geo: 'rectangle', w: 100, h: 100, color: 'green', fill: 'solid' } }
        ] as any[])

        // Go back to requirements
        editor.setCurrentPage(currentPage.id)
    }

    return (
        <DefaultMainMenu>
            <TldrawUiMenuGroup id="custom-templates">
                <TldrawUiMenuItem
                    id="apply-4tabs"
                    label="4-Tabs 템플릿 뼈대 세팅"
                    icon="layout"
                    readonlyOk={false}
                    onSelect={apply4TabsTemplate}
                />
            </TldrawUiMenuGroup>
            <DefaultMainMenuContent />
        </DefaultMainMenu>
    )
}