import { DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuItem, TldrawUiMenuGroup, useEditor, createShapeId, PageRecordType } from 'tldraw'

export function CustomMainMenu() {
    const editor = useEditor()

    
const toRichText = (text: string) => {
    return {
        type: 'doc',
        content: text.split('\n').map(line => line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph', content: [] })
    }
}

    const apply4TabsTemplate = () => {
        const currentPage = editor.getCurrentPage()
        editor.updatePage({ id: currentPage.id, name: "📌 Requirements" })
        
        // --- 1. Requirements (Feature Ideation & Prioritization) ---
        // Rich 2x2 Matrix with axes and a brainstorming pool
        const reqShapes: any[] = [
            { id: createShapeId(), type: 'text', x: -400, y: -150, props: { richText: toRichText('💡 Feature Ideation & Prioritization'), size: 'xl', color: 'black' } },
            { id: createShapeId(), type: 'text', x: -400, y: -80, props: { richText: toRichText('1. 좌측 보드에서 아이디어를 발산합니다.\n2. 우측 매트릭스로 드래그하여 우선순위를 결정하세요.'), size: 'm', color: 'grey' } },
            
            // Brainstorming Area (Left)
            { id: createShapeId(), type: 'geo', x: -400, y: 0, props: { geo: 'rectangle', w: 450, h: 800, fill: 'none', color: 'grey', dash: 'dashed' } },
            { id: createShapeId(), type: 'text', x: -380, y: 20, props: { richText: toRichText('Brainstorming Pool'), size: 'l', color: 'grey' } },
        ]
        
        // Add 12 sticky notes in a grid to the pool
        const colors = ['yellow', 'green', 'blue', 'red', 'yellow', 'green']
        for(let i=0; i<12; i++) {
            reqShapes.push({
                id: createShapeId(), type: 'note',
                x: -360 + (i % 2) * 200, y: 100 + Math.floor(i / 2) * 110,
                props: { color: colors[i % 6] }
            })
        }

        // The 2x2 Matrix (Right)
        reqShapes.push(
            // Background quadrant highlights
            { id: createShapeId(), type: 'geo', x: 200, y: 0, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'green', richText: toRichText('Quick Wins\n(Do First)'), size: 'xl' } },
            { id: createShapeId(), type: 'geo', x: 600, y: 0, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'blue', richText: toRichText('Major Projects\n(Do Next)'), size: 'xl' } },
            { id: createShapeId(), type: 'geo', x: 200, y: 400, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'yellow', richText: toRichText('Fill Ins\n(Do Later)'), size: 'xl' } },
            { id: createShapeId(), type: 'geo', x: 600, y: 400, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'red', richText: toRichText('Thankless Tasks\n(Don\'t Do)'), size: 'xl' } },
            
            // Axes Lines
            { id: createShapeId(), type: 'arrow', x: 200, y: 400, props: { start: { x: 0, y: 0 }, end: { x: 850, y: 0 }, arrowheadEnd: 'arrow', color: 'black' } },
            { id: createShapeId(), type: 'arrow', x: 600, y: 800, props: { start: { x: 0, y: 0 }, end: { x: 0, y: -850 }, arrowheadEnd: 'arrow', color: 'black' } },
            
            // Axes Labels
            { id: createShapeId(), type: 'text', x: 1000, y: 420, props: { richText: toRichText('Effort ➔'), size: 'm', color: 'black' } },
            { id: createShapeId(), type: 'text', x: 580, y: -90, props: { richText: toRichText('Impact ➔'), size: 'm', color: 'black' } }
        )
        editor.createShapes(reqShapes)
        
        // --- 2. User Journey Map ---
        const journeyPageId = PageRecordType.createId()
        editor.createPage({ name: "🗺️ User Journey", id: journeyPageId })
        editor.setCurrentPage(journeyPageId)
        
        const journeyShapes: any[] = [
            { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('🗺️ User Journey Map'), size: 'xl', color: 'black' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 120, props: { geo: 'rectangle', w: 1200, h: 700, fill: 'none', color: 'black' } },
            
            // Row Headers
            { id: createShapeId(), type: 'geo', x: 100, y: 120, props: { geo: 'rectangle', w: 200, h: 100, fill: 'semi', color: 'grey', richText: toRichText('Phases'), size: 'm' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 220, props: { geo: 'rectangle', w: 200, h: 200, fill: 'none', color: 'grey', richText: toRichText('Actions\n& Touchpoints'), size: 'm' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 420, props: { geo: 'rectangle', w: 200, h: 200, fill: 'none', color: 'grey', richText: toRichText('Emotional\nCurve'), size: 'm' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 620, props: { geo: 'rectangle', w: 200, h: 200, fill: 'none', color: 'grey', richText: toRichText('Opportunities'), size: 'm' } },
        ]

        // Columns
        const phases = ['Awareness', 'Consideration', 'Decision', 'Retention']
        const emotions = [500, 450, 580, 480] // Y coordinates for the emotion curve
        
        phases.forEach((phase, i) => {
            const cx = 300 + i * 250
            journeyShapes.push(
                // Phase Header
                { id: createShapeId(), type: 'geo', x: cx, y: 120, props: { geo: 'rectangle', w: 250, h: 100, fill: 'semi', color: 'blue', richText: toRichText(phase), size: 'm' } },
                // Columns dividers
                { id: createShapeId(), type: 'geo', x: cx, y: 220, props: { geo: 'rectangle', w: 250, h: 600, fill: 'none', color: 'grey', dash: 'dashed' } },
                // Action Notes
                { id: createShapeId(), type: 'note', x: cx + 25, y: 250, props: { color: 'yellow', richText: toRichText('User Action ' + (i+1)) } },
                // Opportunity Notes
                { id: createShapeId(), type: 'note', x: cx + 25, y: 650, props: { color: 'green', richText: toRichText('Idea ' + (i+1)) } },
                // Emotion Dots
                { id: createShapeId(), type: 'geo', x: cx + 115, y: emotions[i], props: { geo: 'ellipse', w: 20, h: 20, fill: 'solid', color: emotions[i] > 500 ? 'red' : 'green' } }
            )
        })

        // Draw emotion curve line connecting the dots
        journeyShapes.push({
            id: createShapeId(), type: 'draw', x: 425, y: emotions[0] + 10,
            props: {
                color: 'black', size: 'm',
                segments: [{ type: 'free', points: [
                    { x: 0, y: 0, z: 0.5 },
                    { x: 250, y: emotions[1] - emotions[0], z: 0.5 },
                    { x: 500, y: emotions[2] - emotions[0], z: 0.5 },
                    { x: 750, y: emotions[3] - emotions[0], z: 0.5 }
                ]}]
            }
        })
        editor.createShapes(journeyShapes)

        // --- 3. Wireframe & UI Kit ---
        const wireframePageId = PageRecordType.createId()
        editor.createPage({ name: "📐 Wireframe & UI Kit", id: wireframePageId })
        editor.setCurrentPage(wireframePageId)
        
        editor.createShapes([
            { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('📐 Wireframe Canvas'), size: 'xl', color: 'black' } },
            // Mobile App
            { id: createShapeId(), type: 'text', x: 100, y: 150, props: { richText: toRichText('Mobile App'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'wired-mobile-frame', x: 100, y: 200, props: { w: 375, h: 812 } },
            // Browser
            { id: createShapeId(), type: 'text', x: 600, y: 150, props: { richText: toRichText('Web Application'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'wired-browser-frame', x: 600, y: 200, props: { w: 1024, h: 768 } },
            // Components Area
            { id: createShapeId(), type: 'text', x: 1700, y: 150, props: { richText: toRichText('Component Library'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'geo', x: 1700, y: 200, props: { geo: 'rectangle', w: 400, h: 812, fill: 'none', color: 'grey', dash: 'dashed' } },
            { id: createShapeId(), type: 'wired-button', x: 1750, y: 250, props: { w: 150, h: 50, text: 'Primary Button', color: '#3b82f6' } },
            { id: createShapeId(), type: 'wired-button', x: 1750, y: 320, props: { w: 150, h: 50, text: 'Secondary', color: '#6b7280' } },
            { id: createShapeId(), type: 'wired-input', x: 1750, y: 400, props: { w: 300, h: 50, placeholder: 'Email Address' } },
            { id: createShapeId(), type: 'wired-toggle', x: 1750, y: 480, props: { w: 60, h: 30, isOn: true } },
            { id: createShapeId(), type: 'wired-checkbox', x: 1750, y: 540, props: { w: 20, h: 20 } },
            { id: createShapeId(), type: 'text', x: 1780, y: 535, props: { richText: toRichText('Remember me'), size: 'm' } },
        ] as any[])

        // --- 4. Moodboard ---
        const moodboardPageId = PageRecordType.createId()
        editor.createPage({ name: "🎨 Moodboard", id: moodboardPageId })
        editor.setCurrentPage(moodboardPageId)
        
        editor.createShapes([
            { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('🎨 Brand Identity & Moodboard'), size: 'xl', color: 'black' } },
            
            // Core Colors
            { id: createShapeId(), type: 'text', x: 100, y: 150, props: { richText: toRichText('Color Palette'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'geo', x: 100, y: 200, props: { geo: 'rectangle', w: 150, h: 150, color: 'black', fill: 'solid' } },
            { id: createShapeId(), type: 'text', x: 100, y: 360, props: { richText: toRichText('Primary (Black)'), size: 'm' } },
            
            { id: createShapeId(), type: 'geo', x: 300, y: 200, props: { geo: 'rectangle', w: 150, h: 150, color: 'blue', fill: 'solid' } },
            { id: createShapeId(), type: 'text', x: 300, y: 360, props: { richText: toRichText('Accent (Blue)'), size: 'm' } },
            
            { id: createShapeId(), type: 'geo', x: 500, y: 200, props: { geo: 'rectangle', w: 150, h: 150, color: 'green', fill: 'solid' } },
            { id: createShapeId(), type: 'text', x: 500, y: 360, props: { richText: toRichText('Success (Green)'), size: 'm' } },
            
            // Typography Rules
            { id: createShapeId(), type: 'text', x: 100, y: 450, props: { richText: toRichText('Typography'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'text', x: 100, y: 500, props: { richText: toRichText('Heading 1 - 48px Bold (Nanum Pen)'), size: 'xl', color: 'black' } },
            { id: createShapeId(), type: 'text', x: 100, y: 570, props: { richText: toRichText('Heading 2 - 32px Medium (Nanum Pen)'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'text', x: 100, y: 630, props: { richText: toRichText('Body Text - 16px Regular. The quick brown fox jumps over the lazy dog.'), size: 'm', color: 'black' } },
            
            // Inspiration
            { id: createShapeId(), type: 'text', x: 800, y: 150, props: { richText: toRichText('Inspiration / References'), size: 'l', color: 'black' } },
            { id: createShapeId(), type: 'geo', x: 800, y: 200, props: { geo: 'rectangle', w: 400, h: 300, fill: 'semi', color: 'grey', richText: toRichText('[ Image Placeholder 1 ]'), size: 'm' } },
            { id: createShapeId(), type: 'geo', x: 800, y: 550, props: { geo: 'rectangle', w: 400, h: 300, fill: 'semi', color: 'grey', richText: toRichText('[ Image Placeholder 2 ]'), size: 'm' } },
            { id: createShapeId(), type: 'geo', x: 1250, y: 200, props: { geo: 'rectangle', w: 400, h: 650, fill: 'semi', color: 'grey', richText: toRichText('[ Image Placeholder 3 ]'), size: 'm' } },
        ] as any[])

        // Go back to requirements
        editor.setCurrentPage(currentPage.id)
        editor.centerOnPoint({x: 400, y: 400})
    }

    return (
        <DefaultMainMenu>
            {/* @ts-expect-error React 18 type mismatch */}
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