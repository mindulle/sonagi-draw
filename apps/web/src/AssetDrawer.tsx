import { useState, useMemo } from 'react'
import { createShapeId } from 'tldraw'
import {
    insertLayoutComponent,
    insertUXPatternComponent,
    insertDiagramComponent,
    insertAnnotationComponent
} from './libraryTemplates'
import { tokens } from '@sonagi/tokens'

interface AssetDrawerProps {
    editor: any
    isOpen: boolean
    onClose: () => void
    isDiscord?: boolean
}

interface UIItem {
    id: string
    title: string
    desc: string
    category: 'layout' | 'form' | 'data' | 'diagram' | 'annotation'
    icon: string
    action: (editor: any) => void
}

export function AssetDrawer({ editor, isOpen, onClose, isDiscord = false }: AssetDrawerProps) {
    const [activeTab, setActiveTab] = useState<'ui' | 'tokens' | 'reference' | 'vector'>('ui')
    const [searchQuery, setSearchQuery] = useState('')
    const [svgCode, setSvgCode] = useState('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const showToast = (msg: string) => {
        setStatusMessage(msg)
        setTimeout(() => setStatusMessage(null), 2200)
    }

    // UI Kit items
    const uiItems: UIItem[] = useMemo(() => [
        // Layout
        {
            id: 'mobile-frame',
            title: '모바일 폰 프레임',
            desc: '320x680 규격 모바일 화면 뷰포트',
            category: 'layout',
            icon: '📱',
            action: (ed) => insertLayoutComponent(ed, 'mobile-frame')
        },
        {
            id: 'browser-window',
            title: '데스크탑 브라우저 창',
            desc: '800x600 웹 브라우저 와이어프레임',
            category: 'layout',
            icon: '💻',
            action: (ed) => insertLayoutComponent(ed, 'browser-window')
        },
        {
            id: 'dashboard-skeleton',
            title: '대시보드 스켈레톤 레이아웃',
            desc: '사이드바 + 헤더 + 콘텐츠 영역 3단 구성',
            category: 'layout',
            icon: '📊',
            action: (ed) => insertLayoutComponent(ed, 'dashboard-skeleton')
        },

        // Forms & Controls
        {
            id: 'auth-form',
            title: '로그인 / 회원가입 폼',
            desc: '이메일, 비밀번호, 로그인 버튼 세트',
            category: 'form',
            icon: '🔐',
            action: (ed) => insertUXPatternComponent(ed, 'auth-form')
        },
        {
            id: 'wired-button',
            title: '인터랙티브 와이어드 버튼',
            desc: '손그림 스타일의 토큰 테마 버튼',
            category: 'form',
            icon: '🔘',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-button', x: center.x, y: center.y, props: { w: 160, h: 48, text: '액션 버튼', color: tokens['--semantic-light-color-brand-primary'] || '#1c2c4d' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-input',
            title: '텍스트 인풋 필드',
            desc: '플레이스홀더가 포함된 입력창',
            category: 'form',
            icon: '✏️',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-input', x: center.x, y: center.y, props: { w: 280, h: 48, placeholder: '값을 입력하세요...' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-toggle',
            title: '토글 스위치',
            desc: 'On/Off 상태 변경 스위치',
            category: 'form',
            icon: '🎚️',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-toggle', x: center.x, y: center.y, props: { checked: true, label: '알림 받기' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-checkbox',
            title: '체크박스 옵션',
            desc: '다중 선택용 와이어드 체크박스',
            category: 'form',
            icon: '☑️',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-checkbox', x: center.x, y: center.y, props: { checked: true, label: '서비스 약관 동의' } }
                ])
                ed.select(id)
            }
        },

        // Data & Charts
        {
            id: 'pricing-table',
            title: '요금제 비교표 (3단)',
            desc: 'Basic / Pro / Enterprise 카드 세트',
            category: 'data',
            icon: '💳',
            action: (ed) => insertUXPatternComponent(ed, 'pricing-table')
        },
        {
            id: 'wired-data-table',
            title: '데이터 그리드 테이블',
            desc: '3x3 셀 단위의 표 데이터 도형',
            category: 'data',
            icon: '📋',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-data-table', x: center.x, y: center.y, props: { rows: 3, cols: 3, cellWidth: 120, cellHeight: 40, data: { '0,0': '구분', '0,1': '항목', '0,2': '수치', '1,0': '1', '1,1': '트래픽', '1,2': '99.9%', '2,0': '2', '2,1': '지연시간', '2,2': '12ms' } } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-bar-chart',
            title: '바 차트 (막대 그래프)',
            desc: '수치 데이터 시각화 막대 차트',
            category: 'data',
            icon: '📊',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-bar-chart', x: center.x, y: center.y, props: { w: 320, h: 200, values: '30, 85, 45, 95, 60', color: tokens['--semantic-light-color-accent-default'] || '#4A90E2' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-donut-chart',
            title: '도넛 차트 (점유율)',
            desc: '비율 및 점유율 파이 차트',
            category: 'data',
            icon: '🍩',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-donut-chart', x: center.x, y: center.y, props: { w: 220, h: 220, values: '40, 30, 20, 10' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'wired-progress',
            title: '진행률 프로그레스 바',
            desc: '진행 단계 및 퍼센티지 바',
            category: 'data',
            icon: '⏳',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-progress', x: center.x, y: center.y, props: { w: 280, h: 28, value: 75, max: 100 } }
                ])
                ed.select(id)
            }
        },

        // Diagrams & Planning
        {
            id: 'user-flow',
            title: '유저 플로우 다이어그램',
            desc: 'Action ➔ Decision ➔ Result 분기 흐름',
            category: 'diagram',
            icon: '🔀',
            action: (ed) => insertDiagramComponent(ed, 'user-flow')
        },
        {
            id: 'sitemap-tree',
            title: '사이트맵 구조도 (계층형)',
            desc: '홈 ➔ 하위 3개 페이지 연결 트리',
            category: 'diagram',
            icon: '🌳',
            action: (ed) => insertDiagramComponent(ed, 'sitemap')
        },
        {
            id: 'sticky-cluster',
            title: '아이디어 브레인스토밍 보드',
            desc: '스티키 노트 5종 클러스터 프리셋',
            category: 'diagram',
            icon: '📌',
            action: (ed) => insertDiagramComponent(ed, 'sticky-cluster')
        },
        {
            id: 'ia-screen-node',
            title: 'IA 정보구조 화면 노드',
            desc: '화면 번호와 명칭이 표기된 노드',
            category: 'diagram',
            icon: '📑',
            action: (ed) => insertDiagramComponent(ed, 'wired-ia-node')
        },
        {
            id: 'wired-copy-note',
            title: 'UX 마이크로카피 노트',
            desc: '카피라이팅 검토 및 주석용 카드',
            category: 'diagram',
            icon: '💬',
            action: (ed) => insertAnnotationComponent(ed, 'wired-copy-note')
        },

        // Annotation & Modals
        {
            id: 'wired-modal',
            title: '모달 대화상자 팝업',
            desc: '타이틀과 액션 버튼이 있는 팝업',
            category: 'annotation',
            icon: '🪟',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-modal', x: center.x, y: center.y, props: { w: 420, h: 260, title: '확인 대화상자' } }
                ])
                ed.select(id)
            }
        },
        {
            id: 'comment-pin',
            title: '번호 주석 핀 (Annotation)',
            desc: '화면 리뷰용 원형 번호 핀',
            category: 'annotation',
            icon: '📍',
            action: (ed) => insertAnnotationComponent(ed, 'comment-pin')
        },
        {
            id: 'measurement-line',
            title: '치수 측정선 (200px)',
            desc: '여백 및 간격 측정용 양방향 화살표',
            category: 'annotation',
            icon: '📏',
            action: (ed) => insertAnnotationComponent(ed, 'measurement-line')
        },
        {
            id: 'mcp-inbox',
            title: 'AI 에이전트 MCP 인박스',
            desc: '에이전트 변경사항 및 상태 브릿지 카드',
            category: 'annotation',
            icon: '🤖',
            action: (ed) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-mcp-inbox', x: center.x, y: center.y, props: { w: 500, h: 320, title: 'MCP Dispatcher Queue' } }
                ])
                ed.select(id)
            }
        }
    ], [])

    // Token Palette Swatches
    const tokenPresets = useMemo(() => [
        {
            category: '브랜드 핵심 (Brand Core)',
            items: [
                { hex: tokens['--semantic-light-color-brand-primary'] || '#1c2c4d', name: '--brand-primary', role: '주력 브랜드 다크 네이비' },
                { hex: tokens['--semantic-light-color-accent-default'] || '#4A90E2', name: '--accent-rain', role: '소나기 비 액센트 블루' },
                { hex: tokens['--primitive-brand-cyan'] || '#00E5FF', name: '--brand-cyan', role: '워드마크 시안 하이라이트' },
                { hex: tokens['--semantic-light-color-brand-logo'] || '#2B4A7F', name: '--brand-logo', role: '심볼 로고 블루' },
            ]
        },
        {
            category: '상태 피드백 (Status)',
            items: [
                { hex: tokens['--semantic-light-color-state-success'] || '#2ea043', name: '--state-success', role: '성공 및 완료 (포레스트)' },
                { hex: tokens['--semantic-light-color-state-warning'] || '#d29922', name: '--state-warning', role: '주의 및 대기 (앰버)' },
                { hex: tokens['--semantic-light-color-state-error'] || '#f85149', name: '--state-error', role: '에러 및 위험 (코랄 레드)' },
                { hex: tokens['--semantic-light-color-state-info'] || '#388bfd', name: '--state-info', role: '정보 및 가이드 (스카이)' },
            ]
        },
        {
            category: '서피스 & 배경 (Surfaces)',
            items: [
                { hex: tokens['--semantic-light-color-bg-base'] || '#fff8f2', name: '--bg-base', role: '따뜻한 종이 질감 라이트 베이스' },
                { hex: tokens['--semantic-light-color-bg-elevated'] || '#ffffff', name: '--bg-elevated', role: '카드 및 모달 플로팅 배경' },
                { hex: tokens['--semantic-dark-color-bg-surface'] || '#161b22', name: '--bg-surface-dark', role: '다크 서피스 배경' },
                { hex: tokens['--semantic-light-color-text-primary'] || '#0d1117', name: '--text-primary', role: '본문 고대비 텍스트' },
            ]
        }
    ], [])

    // Reference presets
    const referencePresets = useMemo(() => [
        {
            title: 'Karakeep 웹사이트 레퍼런스',
            desc: '북마크 썸네일과 URL이 연동된 카드',
            icon: '🔖',
            action: (ed: any) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-reference-card', x: center.x, y: center.y, props: { w: 320, h: 240, title: 'Tldraw 공식 문서', url: 'https://tldraw.dev', imageUrl: '' } }
                ])
                ed.select(id)
            }
        },
        {
            title: '비주얼 에셋 무드보드 카드',
            desc: 'SVG, WebP 등 그래픽 레퍼런스 태그 카드',
            icon: '🎨',
            action: (ed: any) => {
                const center = ed.getViewportPageBounds().center
                const id = createShapeId()
                ed.createShapes([
                    { id, type: 'wired-asset-card', x: center.x, y: center.y, props: { w: 260, h: 320, title: 'MinDulle Vector Visual', ext: 'svg', tags: '#brand #vector', imageUrl: '' } }
                ])
                ed.select(id)
            }
        },
        {
            title: '무드보드 2x2 갤러리 그리드',
            desc: '레퍼런스 이미지 4개를 모아보는 무드보드 그리드',
            icon: '🖼️',
            action: (ed: any) => {
                const center = ed.getViewportPageBounds().center
                const ids = [createShapeId(), createShapeId(), createShapeId(), createShapeId()]
                ed.createShapes([
                    { id: ids[0], type: 'wired-asset-card', x: center.x - 280, y: center.y - 170, props: { w: 260, h: 320, title: '레퍼런스 1', tags: '#mood' } },
                    { id: ids[1], type: 'wired-asset-card', x: center.x + 20, y: center.y - 170, props: { w: 260, h: 320, title: '레퍼런스 2', tags: '#color' } },
                    { id: ids[2], type: 'wired-asset-card', x: center.x - 280, y: center.y + 170, props: { w: 260, h: 320, title: '레퍼런스 3', tags: '#typography' } },
                    { id: ids[3], type: 'wired-asset-card', x: center.x + 20, y: center.y + 170, props: { w: 260, h: 320, title: '레퍼런스 4', tags: '#ui' } },
                ])
                ed.setSelectedShapes(ids)
            }
        }
    ], [])

    // VectorCraft / SVG Action
    const handleInsertSvg = () => {
        if (!editor) return
        const trimmed = svgCode.trim()
        if (!trimmed) {
            alert('SVG 코드를 입력해주세요.')
            return
        }

        try {
            const center = editor.getViewportPageBounds().center
            const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
            const assetId = `asset:${createShapeId().replace('shape:', '')}` as any
            const shapeId = createShapeId()

            editor.createAssets([
                {
                    id: assetId,
                    typeName: 'asset',
                    type: 'image',
                    meta: {},
                    props: {
                        name: 'vectorcraft-graphic.svg',
                        src: svgDataUrl,
                        w: 300,
                        h: 300,
                        mimeType: 'image/svg+xml',
                        isAnimated: false
                    }
                }
            ])

            editor.createShapes([
                {
                    id: shapeId,
                    type: 'image',
                    x: center.x - 150,
                    y: center.y - 150,
                    props: {
                        w: 300,
                        h: 300,
                        assetId: assetId
                    }
                }
            ])

            editor.select(shapeId)
            setSvgCode('')
            showToast('SVG 벡터 그래픽이 캔버스에 삽입되었습니다! 🎨')
        } catch (e: any) {
            alert('SVG 삽입 실패: ' + e.message)
        }
    }

    const filteredUI = useMemo(() => {
        if (!searchQuery) return uiItems
        return uiItems.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [uiItems, searchQuery])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop for closing */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 900
                }}
            />

            {/* Slide-in Drawer */}
            <div
                style={{
                    position: 'fixed',
                    top: isDiscord ? 48 : 0,
                    right: 0,
                    bottom: 0,
                    width: 'min(380px, calc(100vw - 24px))',
                    background: '#ffffff',
                    borderLeft: '1px solid #e5e7eb',
                    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'drawerSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fafafa'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🎨</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                에셋 & 템플릿 서랍
                            </h3>
                            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                                캔버스에 즉시 배치할 수 있는 자산
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: 18,
                            cursor: 'pointer',
                            color: '#9ca3af',
                            padding: '4px 8px',
                            borderRadius: 6
                        }}
                        title="서랍 닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* Toast Notification */}
                {statusMessage && (
                    <div
                        style={{
                            padding: '8px 14px',
                            background: '#ecfdf5',
                            color: '#065f46',
                            fontSize: 12,
                            fontWeight: 600,
                            borderBottom: '1px solid #a7f3d0',
                            textAlign: 'center'
                        }}
                    >
                        ✓ {statusMessage}
                    </div>
                )}

                {/* Tabs */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#f8fafc'
                    }}
                >
                    {(['ui', 'tokens', 'reference', 'vector'] as const).map(tab => {
                        const labels = {
                            ui: '🧩 UI 킷',
                            tokens: '🎨 토큰',
                            reference: '🔖 레퍼런스',
                            vector: '⚡ 벡터'
                        }
                        const isSelected = activeTab === tab
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    border: 'none',
                                    borderBottom: isSelected ? '2px solid #2563eb' : '2px solid transparent',
                                    background: isSelected ? '#ffffff' : 'transparent',
                                    color: isSelected ? '#2563eb' : '#64748b',
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: 12,
                                    padding: '10px 4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {labels[tab]}
                            </button>
                        )
                    })}
                </div>

                {/* Search Bar for UI Tab */}
                {activeTab === 'ui' && (
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                            type="text"
                            placeholder="컴포넌트 검색 (예: 버튼, 모바일, 테이블)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                fontSize: 13,
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                )}

                {/* Tab Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                    {/* Tab 1: UI Kit */}
                    {activeTab === 'ui' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filteredUI.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        if (editor) {
                                            item.action(editor)
                                            showToast(`'${item.title}' 캔버스에 추가됨!`)
                                        }
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        background: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#93c5fd')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                                >
                                    <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>+ 삽입</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 2: Tokens */}
                    {activeTab === 'tokens' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                                소나기 디자인 시스템(@sonagi/tokens) 색상 스와치를 클릭하면 캔버스에 토큰 카드가 스탬프됩니다.
                            </p>
                            {tokenPresets.map((section, idx) => (
                                <div key={idx}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                        {section.category}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                        {section.items.map((token, tIdx) => (
                                            <div
                                                key={tIdx}
                                                onClick={() => {
                                                    if (editor) {
                                                        const center = editor.getViewportPageBounds().center
                                                        const id = createShapeId()
                                                        editor.createShapes([
                                                            {
                                                                id,
                                                                type: 'wired-token-swatch',
                                                                x: center.x,
                                                                y: center.y,
                                                                props: {
                                                                    w: 160,
                                                                    h: 200,
                                                                    colorHex: token.hex,
                                                                    tokenName: token.name,
                                                                    role: token.role
                                                                }
                                                            }
                                                        ])
                                                        editor.select(id)
                                                        showToast(`'${token.name}' 스와치 카드 생성됨!`)
                                                    }
                                                }}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    background: '#ffffff',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#93c5fd')}
                                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                                            >
                                                <div style={{ height: 42, background: token.hex }} />
                                                <div style={{ padding: '6px 8px' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                                                        {token.hex}
                                                    </div>
                                                    <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b' }}>
                                                        {token.name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 3: Reference & Moodboard */}
                    {activeTab === 'reference' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                                Karakeep 북마크 및 비주얼 레퍼런스 카드를 캔버스에 배치합니다.
                            </p>
                            {referencePresets.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (editor) {
                                            item.action(editor)
                                            showToast(`'${item.title}' 캔버스에 추가됨!`)
                                        }
                                    }}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        background: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>+ 배치</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 4: VectorCraft & SVG Tools */}
                    {activeTab === 'vector' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ padding: '10px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 2 }}>
                                    ⚡ VectorCraft 정밀 벡터 연동
                                </div>
                                <div style={{ fontSize: 11, color: '#0c4a6e' }}>
                                    VectorCraft에서 생성한 SVG 코드를 붙여넣으면 캔버스에 무손실 벡터 에셋으로 즉시 변환되어 배치됩니다.
                                </div>
                            </div>

                            <textarea
                                placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...> SVG 코드를 여기에 붙여넣으세요"
                                value={svgCode}
                                onChange={(e) => setSvgCode(e.target.value)}
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <button
                                onClick={handleInsertSvg}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                }}
                            >
                                🎨 SVG 벡터 그래픽 캔버스에 삽입
                            </button>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                                    💡 빠른 벡터 아이콘 샘플
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {[
                                        { label: '⭐ 별표', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
                                        { label: '🛡️ 쉴드', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="#2563eb"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' },
                                        { label: '⚡ 번개', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="#eab308"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
                                        { label: '❤️ 하트', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
                                    ].map((sample, sIdx) => (
                                        <button
                                            key={sIdx}
                                            onClick={() => setSvgCode(sample.svg)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                border: '1px solid #cbd5e1',
                                                background: '#f8fafc',
                                                fontSize: 11,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {sample.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
