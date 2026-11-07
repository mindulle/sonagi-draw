import { Editor, createShapeId, PageRecordType } from 'tldraw'

export const toRichText = (text: string) => {
    return {
        type: 'doc',
        content: text.split('\n').map(line => 
            line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' }
        )
    }
}

/**
 * 1. 계층형 아키텍처 (Tiered Topology)
 * Client Tier ➔ API & Gateway Tier ➔ Data & Storage Tier 3계층 단일 캔버스
 */
export function applyTieredTopologyTemplate(editor: Editor) {
    const currentPage = editor.getCurrentPage()
    editor.updatePage({ id: currentPage.id, name: '🏗️ Tiered Topology' })

    const shapes: any[] = [
        // Title Header
        { id: createShapeId(), type: 'text', x: 60, y: 40, props: { richText: toRichText('🏗️ 3-Tier System Architecture'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 60, y: 100, props: { richText: toRichText('Client ➔ Gateway & Services ➔ Storage & Data Lake'), size: 'm', color: 'grey' } },

        // Tier 1: Client Tier
        { id: createShapeId(), type: 'geo', x: 60, y: 160, props: { geo: 'rectangle', w: 1080, h: 140, fill: 'semi', color: 'blue', richText: toRichText('Tier 1: Client / Interface Tier'), align: 'start', verticalAlign: 'start', size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 210, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'light-blue', richText: toRichText('Web App (Next.js / Vite)\nhttps://...'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 460, y: 210, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'light-blue', richText: toRichText('Mobile App / Discord WebView\nEmbedded Activity'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 820, y: 210, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'light-blue', richText: toRichText('CLI & Automation Agents\nOpenCode / FastMCP'), size: 's' } },

        // Connector Arrows Tier 1 ➔ Tier 2
        { id: createShapeId(), type: 'arrow', x: 240, y: 300, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },
        { id: createShapeId(), type: 'arrow', x: 600, y: 300, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },
        { id: createShapeId(), type: 'arrow', x: 960, y: 300, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },

        // Tier 2: Gateway & Service Tier
        { id: createShapeId(), type: 'geo', x: 60, y: 360, props: { geo: 'rectangle', w: 1080, h: 150, fill: 'semi', color: 'green', richText: toRichText('Tier 2: API Gateway & Orchestration Services'), align: 'start', verticalAlign: 'start', size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 415, props: { geo: 'rectangle', w: 320, h: 70, fill: 'solid', color: 'light-green', richText: toRichText('Edge Reverse Proxy / Tunnel\nNginx / Cloudflared (Zero Trust)'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 460, y: 415, props: { geo: 'rectangle', w: 320, h: 70, fill: 'solid', color: 'light-green', richText: toRichText('Core API Service / Sync Server\nWebSocket & REST API'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 820, y: 415, props: { geo: 'rectangle', w: 280, h: 70, fill: 'solid', color: 'light-green', richText: toRichText('Background Worker & Queue\nCron Jobs / Event Consumer'), size: 's' } },

        // Connector Arrows Tier 2 ➔ Tier 3
        { id: createShapeId(), type: 'arrow', x: 260, y: 510, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },
        { id: createShapeId(), type: 'arrow', x: 620, y: 510, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },
        { id: createShapeId(), type: 'arrow', x: 960, y: 510, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 60 }, arrowheadEnd: 'arrow', color: 'grey' } },

        // Tier 3: Storage & Database Tier
        { id: createShapeId(), type: 'geo', x: 60, y: 570, props: { geo: 'rectangle', w: 1080, h: 140, fill: 'semi', color: 'yellow', richText: toRichText('Tier 3: Persistence & Storage Tier'), align: 'start', verticalAlign: 'start', size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 620, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'orange', richText: toRichText('Relational DB (PostgreSQL / SQLite)\nACID State & Business Tables'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 460, y: 620, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'orange', richText: toRichText('Cache & Queue (Redis / KV)\nPubSub & In-Memory Sessions'), size: 's' } },
        { id: createShapeId(), type: 'geo', x: 820, y: 620, props: { geo: 'rectangle', w: 280, h: 65, fill: 'solid', color: 'orange', richText: toRichText('Object Storage & Vector Vault\nR2 / FAISS Vector Embeddings'), size: 's' } },
    ]

    editor.createShapes(shapes)
    editor.centerOnPoint({ x: 600, y: 400 })
}

/**
 * 2. 선형 파이프라인 (Linear Pipeline)
 * 단계별 데이터 처리 & 이벤트 순차 처리 흐름
 */
export function applyLinearPipelineTemplate(editor: Editor) {
    const currentPage = editor.getCurrentPage()
    editor.updatePage({ id: currentPage.id, name: '🔄 Linear Pipeline' })

    const shapes: any[] = [
        { id: createShapeId(), type: 'text', x: 60, y: 40, props: { richText: toRichText('🔄 Linear Processing Pipeline'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 60, y: 100, props: { richText: toRichText('Sequential Step-by-Step Flow with Error / Rollback Boundaries'), size: 'm', color: 'grey' } },

        // Step 1: Ingest
        { id: createShapeId(), type: 'geo', x: 60, y: 180, props: { geo: 'rectangle', w: 240, h: 120, fill: 'solid', color: 'blue', richText: toRichText('1. Ingestion\n\n• Webhook / Raw Input\n• Schema Validation\n• Auth Verification'), size: 's' } },

        // Arrow 1 ➔ 2
        { id: createShapeId(), type: 'arrow', x: 300, y: 240, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, arrowheadEnd: 'arrow', color: 'black', richText: toRichText('Payload') } },

        // Step 2: Transform
        { id: createShapeId(), type: 'geo', x: 380, y: 180, props: { geo: 'rectangle', w: 240, h: 120, fill: 'solid', color: 'green', richText: toRichText('2. Transformation\n\n• Data Parsing / Clean\n• Enrich with Context\n• LLM / Embedding Run'), size: 's' } },

        // Arrow 2 ➔ 3
        { id: createShapeId(), type: 'arrow', x: 620, y: 240, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, arrowheadEnd: 'arrow', color: 'black', richText: toRichText('Enriched') } },

        // Step 3: Action / Execute
        { id: createShapeId(), type: 'geo', x: 700, y: 180, props: { geo: 'rectangle', w: 240, h: 120, fill: 'solid', color: 'yellow', richText: toRichText('3. Execution\n\n• DB Transaction Commit\n• Trigger Downstream API\n• State Change Event'), size: 's' } },

        // Arrow 3 ➔ 4
        { id: createShapeId(), type: 'arrow', x: 940, y: 240, props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, arrowheadEnd: 'arrow', color: 'black', richText: toRichText('Done') } },

        // Step 4: Notify / Feedback
        { id: createShapeId(), type: 'geo', x: 1020, y: 180, props: { geo: 'rectangle', w: 240, h: 120, fill: 'solid', color: 'orange', richText: toRichText('4. Delivery & Log\n\n• Discord / Slack Ping\n• Observability Audit\n• Metric Increment'), size: 's' } },

        // Feedback / Error Loop (Bottom)
        { id: createShapeId(), type: 'arrow', x: 1140, y: 300, props: { start: { x: 0, y: 0 }, end: { x: -960, y: 0 }, arrowheadEnd: 'arrow', dash: 'dashed', color: 'red', richText: toRichText('Retry Queue / DLQ on Failure') } }
    ]

    editor.createShapes(shapes)
    editor.centerOnPoint({ x: 660, y: 260 })
}

/**
 * 3. 허브 앤 스포크 (Hub & Spoke Topology)
 * 중앙 코어 오케스트레이터와 방사형 분배 노드
 */
export function applyHubAndSpokeTemplate(editor: Editor) {
    const currentPage = editor.getCurrentPage()
    editor.updatePage({ id: currentPage.id, name: '🌐 Hub & Spoke' })

    const cx = 500
    const cy = 380

    const shapes: any[] = [
        { id: createShapeId(), type: 'text', x: 60, y: 40, props: { richText: toRichText('🌐 Hub & Spoke Orchestration Topology'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 60, y: 100, props: { richText: toRichText('Central Core Dispatcher with Radiating Specialized Nodes'), size: 'm', color: 'grey' } },

        // Center Hub
        { id: createShapeId(), type: 'geo', x: cx - 120, y: cy - 70, props: { geo: 'ellipse', w: 240, h: 140, fill: 'solid', color: 'blue', richText: toRichText('⚡ Central Core Hub\n(Orchestrator / Dispatcher)'), size: 'm' } },

        // Node Top: Admin & Console
        { id: createShapeId(), type: 'geo', x: cx - 100, y: cy - 230, props: { geo: 'rectangle', w: 200, h: 70, fill: 'solid', color: 'green', richText: toRichText('Admin & Dashboard\nControl Panel'), size: 's' } },
        { id: createShapeId(), type: 'arrow', x: cx, y: cy - 70, props: { start: { x: 0, y: 0 }, end: { x: 0, y: -90 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'black' } },

        // Node Left: Integration Gateway
        { id: createShapeId(), type: 'geo', x: cx - 360, y: cy - 35, props: { geo: 'rectangle', w: 200, h: 70, fill: 'solid', color: 'yellow', richText: toRichText('Discord / ChatOps\nWebhook Inbound'), size: 's' } },
        { id: createShapeId(), type: 'arrow', x: cx - 120, y: cy, props: { start: { x: 0, y: 0 }, end: { x: -40, y: 0 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'black' } },

        // Node Right: AI Agent & MCP
        { id: createShapeId(), type: 'geo', x: cx + 160, y: cy - 35, props: { geo: 'rectangle', w: 200, h: 70, fill: 'solid', color: 'orange', richText: toRichText('Agent / FastMCP\nAutonomous Tool Execution'), size: 's' } },
        { id: createShapeId(), type: 'arrow', x: cx + 120, y: cy, props: { start: { x: 0, y: 0 }, end: { x: 40, y: 0 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'black' } },

        // Node Bottom: Storage & Log
        { id: createShapeId(), type: 'geo', x: cx - 100, y: cy + 160, props: { geo: 'rectangle', w: 200, h: 70, fill: 'solid', color: 'grey', richText: toRichText('Storage & Telemetry\nSQLite / Sentry'), size: 's' } },
        { id: createShapeId(), type: 'arrow', x: cx, y: cy + 70, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 90 }, arrowheadStart: 'arrow', arrowheadEnd: 'arrow', color: 'black' } },
    ]

    editor.createShapes(shapes)
    editor.centerOnPoint({ x: cx, y: cy })
}

/**
 * 4. 앱 신규 기획 풀세트 (4-Tabs Full Set)
 * 요구사항 ➔ 유저 저니 ➔ 와이어프레임 ➔ 무드보드 (신규 앱 전체 기획용)
 */
export function apply4TabsTemplate(editor: Editor) {
    const currentPage = editor.getCurrentPage()
    editor.updatePage({ id: currentPage.id, name: '📌 Requirements' })
    
    // --- 1. Requirements (Feature Ideation & Prioritization) ---
    const reqShapes: any[] = [
        { id: createShapeId(), type: 'text', x: -400, y: -150, props: { richText: toRichText('💡 Feature Ideation & Prioritization'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'text', x: -400, y: -80, props: { richText: toRichText('1. 좌측 보드에서 아이디어를 발산합니다.\n2. 우측 매트릭스로 드래그하여 우선순위를 결정하세요.'), size: 'm', color: 'grey' } },
        
        // Brainstorming Area (Left)
        { id: createShapeId(), type: 'geo', x: -400, y: 0, props: { geo: 'rectangle', w: 450, h: 800, fill: 'none', color: 'grey', dash: 'dashed' } },
        { id: createShapeId(), type: 'text', x: -380, y: 20, props: { richText: toRichText('Brainstorming Pool'), size: 'l', color: 'grey' } },
    ]
    
    const colors = ['yellow', 'green', 'blue', 'red', 'yellow', 'green']
    for (let i = 0; i < 8; i++) {
        reqShapes.push({
            id: createShapeId(), type: 'note',
            x: -360 + (i % 2) * 200, y: 100 + Math.floor(i / 2) * 130,
            props: { color: colors[i % 6], richText: toRichText(`아이디어 #${i + 1}`) }
        })
    }

    // The 2x2 Matrix (Right)
    reqShapes.push(
        { id: createShapeId(), type: 'geo', x: 200, y: 0, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'green', richText: toRichText('Quick Wins\n(Do First)'), size: 'xl' } },
        { id: createShapeId(), type: 'geo', x: 600, y: 0, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'blue', richText: toRichText('Major Projects\n(Do Next)'), size: 'xl' } },
        { id: createShapeId(), type: 'geo', x: 200, y: 400, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'yellow', richText: toRichText('Fill Ins\n(Do Later)'), size: 'xl' } },
        { id: createShapeId(), type: 'geo', x: 600, y: 400, props: { geo: 'rectangle', w: 400, h: 400, fill: 'semi', color: 'red', richText: toRichText('Thankless Tasks\n(Don\'t Do)'), size: 'xl' } },
        { id: createShapeId(), type: 'arrow', x: 200, y: 400, props: { start: { x: 0, y: 0 }, end: { x: 850, y: 0 }, arrowheadEnd: 'arrow', color: 'black' } },
        { id: createShapeId(), type: 'arrow', x: 600, y: 800, props: { start: { x: 0, y: 0 }, end: { x: 0, y: -850 }, arrowheadEnd: 'arrow', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 1000, y: 420, props: { richText: toRichText('Effort ➔'), size: 'm', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 580, y: -90, props: { richText: toRichText('Impact ➔'), size: 'm', color: 'black' } }
    )
    editor.createShapes(reqShapes)
    
    // --- 2. User Journey Map ---
    const journeyPageId = PageRecordType.createId()
    editor.createPage({ name: '🗺️ User Journey', id: journeyPageId })
    editor.setCurrentPage(journeyPageId)
    
    const journeyShapes: any[] = [
        { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('🗺️ User Journey Map'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 120, props: { geo: 'rectangle', w: 1000, h: 500, fill: 'none', color: 'black' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 120, props: { geo: 'rectangle', w: 200, h: 80, fill: 'semi', color: 'grey', richText: toRichText('단계 / 액션'), size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 300, y: 120, props: { geo: 'rectangle', w: 250, h: 80, fill: 'semi', color: 'blue', richText: toRichText('1. 인지 (Awareness)'), size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 550, y: 120, props: { geo: 'rectangle', w: 250, h: 80, fill: 'semi', color: 'blue', richText: toRichText('2. 탐색 (Consideration)'), size: 'm' } },
        { id: createShapeId(), type: 'geo', x: 800, y: 120, props: { geo: 'rectangle', w: 300, h: 80, fill: 'semi', color: 'green', richText: toRichText('3. 전환 (Conversion)'), size: 'm' } },
        { id: createShapeId(), type: 'note', x: 320, y: 240, props: { color: 'yellow', richText: toRichText('랜딩 페이지 방문') } },
        { id: createShapeId(), type: 'note', x: 570, y: 240, props: { color: 'yellow', richText: toRichText('핵심 기능 체험') } },
        { id: createShapeId(), type: 'note', x: 820, y: 240, props: { color: 'green', richText: toRichText('가입 및 구매 완료') } },
    ]
    editor.createShapes(journeyShapes)

    // --- 3. Wireframe & UI Kit ---
    const wireframePageId = PageRecordType.createId()
    editor.createPage({ name: '📐 Wireframe & UI Kit', id: wireframePageId })
    editor.setCurrentPage(wireframePageId)
    
    editor.createShapes([
        { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('📐 Wireframe Canvas'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'text', x: 100, y: 130, props: { richText: toRichText('Mobile App Mockup'), size: 'l', color: 'black' } },
        { id: createShapeId(), type: 'wired-mobile-frame', x: 100, y: 180, props: { w: 375, h: 812 } },
        { id: createShapeId(), type: 'text', x: 600, y: 130, props: { richText: toRichText('Web App Mockup'), size: 'l', color: 'black' } },
        { id: createShapeId(), type: 'wired-browser-frame', x: 600, y: 180, props: { w: 900, h: 600 } },
    ] as any[])

    // --- 4. Moodboard ---
    const moodboardPageId = PageRecordType.createId()
    editor.createPage({ name: '🎨 Moodboard', id: moodboardPageId })
    editor.setCurrentPage(moodboardPageId)
    
    editor.createShapes([
        { id: createShapeId(), type: 'text', x: 100, y: 50, props: { richText: toRichText('🎨 Brand Identity & Moodboard'), size: 'xl', color: 'black' } },
        { id: createShapeId(), type: 'geo', x: 100, y: 150, props: { geo: 'rectangle', w: 140, h: 140, color: 'black', fill: 'solid' } },
        { id: createShapeId(), type: 'geo', x: 280, y: 150, props: { geo: 'rectangle', w: 140, h: 140, color: 'blue', fill: 'solid' } },
        { id: createShapeId(), type: 'geo', x: 460, y: 150, props: { geo: 'rectangle', w: 140, h: 140, color: 'green', fill: 'solid' } },
    ] as any[])

    // Return to Requirements page and center
    editor.setCurrentPage(currentPage.id)
    editor.centerOnPoint({ x: 400, y: 400 })
}

/**
 * 5. AI 시네마틱 스토리보드 (Cinematic Storyboard 3-Act SSOT)
 * [DRAW-20] 16:9 뷰파인더, 프롬프트 슬롯, 1클릭 비디오/스틸 생성 내장 템플릿
 */
export function applyCinematicStoryboardTemplate(editor: Editor) {
    const currentPage = editor.getCurrentPage()
    editor.updatePage({ id: currentPage.id, name: '🎬 Cinematic Storyboard' })

    const shapes: any[] = [
        // 1. Director's Top HUD
        {
            id: createShapeId(),
            type: 'geo',
            x: 60,
            y: 40,
            props: { geo: 'rectangle', w: 2240, h: 90, color: 'black', fill: 'semi', size: 'm' }
        },
        {
            id: createShapeId(),
            type: 'text',
            x: 90,
            y: 55,
            props: {
                w: 1800,
                size: 'l',
                color: 'yellow',
                font: 'mono',
                richText: toRichText('🎬 [PORT-5] Mindulle Atelier 3-Act Cinematic Storyboard Pipeline (SSOT)')
            }
        },
        {
            id: createShapeId(),
            type: 'text',
            x: 90,
            y: 95,
            props: {
                w: 1800,
                size: 's',
                color: 'grey',
                font: 'mono',
                richText: toRichText('DIRECTOR HUD • RULE: sonagi-cinematic-ops 4대 헌법 • 24FPS H.264 • EBU R128 -14LUFS • 85% GOLDEN SNAP')
            }
        },

        // Act 1: [ELS] The Lone Silhouette
        {
            id: createShapeId(),
            type: 'wired-video-card',
            x: 60,
            y: 160,
            props: {
                w: 480,
                h: 380,
                title: 'Scene 01: [ELS] The Lone Silhouette in Blizzard',
                prompt: '24mm Wide Angle | Blizzard Tundra | Backlight & Amber Rimlight',
                aspect: '16:9',
                videoUrl: '/assets/storyboard/scene_01_veo_clip.mp4',
                posterUrl: '/assets/storyboard/scene_01_els.jpg',
                status: 'ready'
            }
        },

        // Motion Arc Arrow 1 -> 2
        {
            id: createShapeId(),
            type: 'arrow',
            x: 550,
            y: 340,
            props: {
                start: { x: 0, y: 0 },
                end: { x: 80, y: 0 },
                arrowheadEnd: 'arrow',
                color: 'violet',
                richText: toRichText('Eye-line Match')
            }
        },

        // Act 2: [MS] Kneeling by Obsidian Altar
        {
            id: createShapeId(),
            type: 'wired-video-card',
            x: 640,
            y: 160,
            props: {
                w: 480,
                h: 380,
                title: 'Scene 02: [MS] Kneeling by Obsidian Altar',
                prompt: '50mm Anamorphic | Kneeling by Rock | Eye-line & Vector Match Cut',
                aspect: '16:9',
                videoUrl: '',
                posterUrl: '/assets/storyboard/scene_02_ms.jpg',
                status: 'idle'
            }
        },

        // Motion Arc Arrow 2 -> 3
        {
            id: createShapeId(),
            type: 'arrow',
            x: 1130,
            y: 340,
            props: {
                start: { x: 0, y: 0 },
                end: { x: 80, y: 0 },
                arrowheadEnd: 'arrow',
                color: 'violet',
                richText: toRichText('Light Punch')
            }
        },

        // Act 3: [ECU] Awakening of Brass Glyph
        {
            id: createShapeId(),
            type: 'wired-video-card',
            x: 1220,
            y: 160,
            props: {
                w: 480,
                h: 380,
                title: 'Scene 03: [ECU] Awakening of Brass Glyph',
                prompt: '100mm Macro | Touching Frost Glass | Golden Brass Glow & Caustics',
                aspect: '16:9',
                videoUrl: '',
                posterUrl: '/assets/storyboard/scene_03_ecu.jpg',
                status: 'idle'
            }
        },

        // Master Reference: Monolith Turnaround
        {
            id: createShapeId(),
            type: 'wired-video-card',
            x: 1800,
            y: 160,
            props: {
                w: 480,
                h: 380,
                title: 'Master: 4-View Obsidian Seal Monolith',
                prompt: '8-Sided Obsidian (#12151d) | Borosilicate Frosted Glass | 2px True Stem',
                aspect: '16:9',
                videoUrl: '/assets/storyboard/blender_3d_orbit_seal.mp4',
                posterUrl: '/assets/storyboard/master_obsidian_seal_turnaround.jpg',
                status: 'ready'
            }
        }
    ]

    editor.createShapes(shapes)
    editor.centerOnPoint({ x: 1180, y: 350 })
}
