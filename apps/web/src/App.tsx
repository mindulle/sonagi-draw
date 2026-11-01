import { useSync } from '@tldraw/sync'
import { Tldraw, TLAssetStore, uniqueId, useEditor, TLContent, createShapeId, TLAnyShapeUtilConstructor, defaultShapeUtils } from 'tldraw'
import 'tldraw/tldraw.css'
import '@sonagi/tokens/css'

import { Button, SonagiLogo } from '@mindulle/ui'

import { WiredMeasurementShapeUtil } from './WiredMeasurementShape'
import { WiredTokenSwatchShapeUtil } from './WiredTokenSwatchShape'
import { WiredStatusBadgeShapeUtil } from './WiredStatusBadgeShape'
import { WiredMcpInboxShapeUtil } from './WiredMcpInboxShape'

import { CustomMainMenu } from "./CustomMainMenu"
import { AssetDrawer } from "./AssetDrawer"
import { JambotQuickGestures } from "./JambotQuickGestures"
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import DOMPurify from 'dompurify'
import { WiredProgressShapeUtil } from './WiredProgressShape'
import { WiredDataTableShapeUtil } from './WiredDataTableShape'
import { WiredToggleShapeUtil } from './WiredToggleShape'
import { WiredCheckboxShapeUtil } from './WiredCheckboxShape'
import { WiredBarChartShapeUtil } from './WiredBarChartShape'
import { WiredDonutChartShapeUtil } from './WiredDonutChartShape'
import { WiredButtonShapeUtil } from './WiredButtonShape'

import { WiredAssetCardShapeUtil } from './WiredAssetCardShape'
import { WiredReferenceCardShapeUtil } from './WiredReferenceCardShape'

import { WiredCardShapeUtil } from './WiredCardShape'
import { WiredModalShapeUtil } from './WiredModalShape'
import { WiredContainerShapeUtil } from './WiredContainerShape'
import { WiredInputShapeUtil } from './WiredInputShape'
import { WiredMobileFrameShapeUtil } from './WiredMobileFrameShape'
import { WiredBrowserFrameShapeUtil } from './WiredBrowserFrameShape'
import { WiredUserFlowNodeShapeUtil } from './WiredUserFlowNodeShape'
import { WiredAnnotationPinShapeUtil } from './WiredAnnotationPinShape'
import { WiredIaNodeShapeUtil } from './WiredIaNodeShape'
import { WiredUiElementShapeUtil } from './WiredUiElementShape'
import { WiredCopyNoteShapeUtil } from './WiredCopyNoteShape'
import { getLibraryIcon } from './libraryIcons'
import { insertLayoutComponent, insertUXPatternComponent, insertDiagramComponent, insertAnnotationComponent } from './libraryTemplates'




const customShapeUtils = [WiredMeasurementShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredTokenSwatchShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredStatusBadgeShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredMcpInboxShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredProgressShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredDataTableShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredToggleShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredCheckboxShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredBarChartShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredDonutChartShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredButtonShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredCardShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredContainerShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredInputShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredMobileFrameShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredBrowserFrameShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredUserFlowNodeShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredAnnotationPinShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredAssetCardShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredReferenceCardShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredIaNodeShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredUiElementShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredCopyNoteShapeUtil as unknown as TLAnyShapeUtilConstructor]

const allShapeUtils = [...defaultShapeUtils, ...customShapeUtils]

const WORKER_URL = window.location.origin

function generateRoomId() {
    return Math.random().toString(36).substring(2, 10)
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 768px)')
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        
        mql.addEventListener('change', handleChange)
        return () => mql.removeEventListener('change', handleChange)
    }, [])
    return isMobile
}

function ShareButton() {
    const [copied, setCopied] = useState(false)
    return (
        <Button
            variant="secondary"
            onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }}
            style={{ pointerEvents: 'all' }}
        >
            {copied ? '복사됨!' : '링크 공유'}
        </Button>
    )
}

type LibraryAsset = { name: string; content: TLContent; svgString?: string }
type LibraryData = Record<string, LibraryAsset[]>

const DEFAULT_LIBRARY: LibraryData = { "내 커스텀 에셋": [] }

function LibrarySidebar() {
    const isMobile = useIsMobile()
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [libraryData, setLibraryData] = useState<LibraryData>({})
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ "내 커스텀 에셋": true, "기본 UI 컴포넌트": true })

    const loadLibrary = async () => {
        if (window.location.origin.includes('discordsays.com') || window.location.pathname.startsWith('/draw')) {
            setLibraryData(DEFAULT_LIBRARY)
            return
        }
        try {
            const res = await fetch(`${WORKER_URL}/library`)
            if (res.ok) {
                const data = await res.json()
                setLibraryData({ "내 커스텀 에셋": data })
            } else {
                setLibraryData(DEFAULT_LIBRARY)
            }
        } catch (e) {
            setLibraryData(DEFAULT_LIBRARY)
        }
    }

    useEffect(() => { loadLibrary() }, [])

    const insertAsset = (asset: LibraryAsset) => {
        try {
            editor.putContentOntoCurrentPage(asset.content, { point: editor.getViewportPageBounds().center, select: true })
            if (isMobile) setIsOpen(false)
        } catch (e) { console.error("Insert failed", e); alert("에셋 삽입 중 오류가 발생했습니다.") }
    }

    const addSelectedToLibrary = async () => {
        const selectedShapeIds = editor.getSelectedShapeIds()
        if (selectedShapeIds.length === 0) { alert("저장할 도형을 먼저 캔버스에서 선택해주세요!"); return }

        let name = window.prompt("저장할 에셋의 이름을 입력하세요:", "새로운 에셋")
        if (!name) return
        name = name.trim()
        if (!name) { alert("에셋 이름을 입력해주세요."); return }

        try {
            const content = editor.getContentFromCurrentPage(selectedShapeIds)
            if (!content) throw new Error("Failed to extract content")

            const result = await editor.getSvgString(selectedShapeIds, { background: false })
            const svgString = result?.svg || ""

            const newItem = { id: uniqueId(), name, content, svgString }

            const res = await fetch(`${WORKER_URL}/library`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            })
            if (!res.ok) throw new Error('서버 응답 오류')

            setLibraryData(prev => ({
                ...prev,
                "내 커스텀 에셋": [...(prev["내 커스텀 에셋"] || []), newItem]
            }))
            setOpenCategories(prev => ({ ...prev, "내 커스텀 에셋": true }))
        } catch (e) { alert("저장에 실패했습니다."); console.error(e) }
    }

    const deleteAsset = async (category: string, index: number) => {
        if (!confirm('이 에셋을 삭제하시겠습니까?')) return
        
        const asset = libraryData[category]?.[index] as any
        if (asset && asset.id) {
            try {
                const res = await fetch(`${WORKER_URL}/library/${asset.id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error('서버 응답 오류')
            } catch (e) {
                alert('삭제에 실패했습니다.')
                return
            }
        }

        setLibraryData(prev => {
            const updated = prev[category] ? [...prev[category]] : []
            updated.splice(index, 1)
            return { ...prev, [category]: updated }
        })
    }


    const insertDefaultComponent = (editor: any, type: string) => {
        const center = editor.getViewportPageBounds().center
        const bgId = createShapeId()
        
        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'wired-button', x: center.x, y: center.y, props: { w: 120, h: 48, text: 'Button', color: '#3b82f6' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'card') {
            editor.createShapes([
                { id: bgId, type: 'wired-card', x: center.x, y: center.y, props: { w: 240, h: 300, title: 'Card Title' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'modal') {
            editor.createShapes([
                { id: bgId, type: 'wired-modal', x: center.x, y: center.y, props: { w: 400, h: 250, title: 'Modal Window' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-progress') {
            editor.createShapes([
                { id: bgId, type: 'wired-progress', x: center.x, y: center.y, props: { w: 300, h: 40, progress: 60, color: '#3b82f6' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-bar-chart') {
            editor.createShapes([
                { id: bgId, type: 'wired-bar-chart', x: center.x, y: center.y, props: { w: 300, h: 200, color: '#3b82f6', values: "40, 80, 55, 90, 30" } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-donut-chart') {
            editor.createShapes([
                { id: bgId, type: 'wired-donut-chart', x: center.x, y: center.y, props: { w: 200, h: 200, color: '#10b981', values: "30, 40, 20, 10" } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-data-table') {
            editor.createShapes([
                { id: bgId, type: 'wired-data-table', x: center.x, y: center.y, props: { rows: 3, cols: 3, cellWidth: 120, cellHeight: 40, data: {} } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-toggle') {
            editor.createShapes([
                { id: bgId, type: 'wired-toggle', x: center.x, y: center.y, props: { w: 60, h: 30, isOn: false } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-checkbox') {
            editor.createShapes([
                { id: bgId, type: 'wired-checkbox', x: center.x, y: center.y, props: { w: 120, h: 30, isChecked: false, label: "Check me" } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-ui-element') {
            editor.createShapes([
                { id: bgId, type: 'wired-ui-element', x: center.x, y: center.y, props: { w: 300, h: 200, title: 'Component Name', pattern: 'Bottom Sheet', imageUrl: '' } }
            ] as any)
            editor.select(bgId)
        }
    }

    const BUILTIN_CATEGORIES = [
        {
            category: "기본 UI 키트",
            items: [
                { label: "Button", type: "button", insert: insertDefaultComponent },
                { label: "Card", type: "card", insert: insertDefaultComponent },
                { label: "Modal Window", type: "modal", insert: insertDefaultComponent },
                { label: "Progress Bar", type: "wired-progress", insert: insertDefaultComponent },
                { label: "Data Table", type: "wired-data-table", insert: insertDefaultComponent },
                { label: "Toggle", type: "wired-toggle", insert: insertDefaultComponent },
                { label: "Checkbox", type: "wired-checkbox", insert: insertDefaultComponent },
                { label: "UI 패턴", type: "wired-ui-element", insert: insertDefaultComponent }
            ]
        },
        {
            category: "데이터 시각화 (차트)",
            items: [
                { label: "Bar Chart", type: "wired-bar-chart", insert: insertDefaultComponent },
                { label: "Donut Chart", type: "wired-donut-chart", insert: insertDefaultComponent }
            ]
        },
        {
            category: "레이아웃 & 디바이스",
            items: [
                { label: "모바일 프레임 (목업)", type: "mobile-frame", insert: insertLayoutComponent },
                { label: "웹 브라우저 창", type: "browser-window", insert: insertLayoutComponent },
                { label: "대시보드 뼈대", type: "dashboard-skeleton", insert: insertLayoutComponent }
            ]
        },
        {
            category: "자주 쓰이는 UX 패턴",
            items: [
                { label: "로그인 / 회원가입 폼", type: "auth-form", insert: insertUXPatternComponent },
                { label: "가격 정책 표 (3단)", type: "pricing-table", insert: insertUXPatternComponent },
                { label: "피드 & 리스트 뷰", type: "feed-list", insert: insertUXPatternComponent }
            ]
        },
        {
            category: "다이어그램 & 유저 여정",
            items: [
                { label: "유저 플로우 노드", type: "user-flow", insert: insertDiagramComponent },
                { label: "사이트맵 뼈대", type: "sitemap", insert: insertDiagramComponent },
                { label: "아이디어 보드 (포스트잇)", type: "sticky-cluster", insert: insertDiagramComponent },
                { label: "IA 노드", type: "wired-ia-node", insert: insertDiagramComponent }
            ]
        },
        {
            category: "어노테이션 & 마커",
            items: [
                { label: "마우스 커서 / 포인터", type: "cursor-pointer", insert: insertAnnotationComponent },
                { label: "코멘트 핀 (숫자 뱃지)", type: "comment-pin", insert: insertAnnotationComponent },
                { label: "측정선 (Redlines)", type: "measurement-line", insert: insertAnnotationComponent },
                { label: "카피 노트", type: "wired-copy-note", insert: insertAnnotationComponent }
            ]
        }
    ]

    if (!isOpen) { 
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{ background: '#ffffff', color: '#1d1d1d', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s', pointerEvents: 'all', fontFamily: 'inherit', fontSize: '13px' }} 
                onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} 
                onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
            >
                라이브러리
            </button> 
        )
    }

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'all' }}>
            <button 
                onClick={() => setIsOpen(false)}
                style={{ background: '#f3f4f6', color: '#1d1d1d', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s', pointerEvents: 'all', fontFamily: 'inherit', fontSize: '13px' }}
            >
                라이브러리 ▼
            </button>
            <div style={isMobile ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                maxHeight: '60vh',
                background: 'white',
                borderTop: '1px solid #e5e7eb',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -10px 25px rgba(0,0,0,0.2)',
                zIndex: 99999,
                overflow: 'hidden',
                boxSizing: 'border-box',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            } : { position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px', width: '320px', maxHeight: 'calc(100vh - 100px)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 25px rgba(0,0,0,0.15)', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>UI Library</h3>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>✕</button>
                </div>
                
                <div style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                    <button 
                        onClick={addSelectedToLibrary}
                        style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
                    >
                        캔버스 선택 항목 추가
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fcfcfc' }}>
                    
                    {/* Built-in Categories */}
                    {BUILTIN_CATEGORIES.map(({ category, items }) => (
                        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div 
                                onClick={() => setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                                style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}
                            >
                                <span>{category}</span>
                                <span style={{ color: '#9ca3af', fontSize: '10px' }}>{openCategories[category] ? '▼' : '▶'}</span>
                            </div>
                            {openCategories[category] && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                                    {items.map((item, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => {
                                                item.insert(editor, item.type)
                                                if (isMobile) setIsOpen(false)
                                            }} 
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.1s' }}
                                            onMouseOver={e => Object.assign(e.currentTarget.style, { background: '#f9fafb', borderColor: '#9ca3af', transform: 'translateY(-1px)' })}
                                            onMouseOut={e => Object.assign(e.currentTarget.style, { background: 'white', borderColor: '#d1d5db', transform: 'none' })}
                                            title={item.label}
                                        >
                                            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {getLibraryIcon(item.type)}
                                            </div>
                                            <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.2', color: '#4b5563', fontWeight: 500, fontFamily: 'inherit' }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Custom Assets Library */}
                    {Object.entries(libraryData).map(([category, assets]) => {
                        const cleanCategory = category.replace('📦 ', '');
                        return (
                        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div 
                                onClick={() => setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                                style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}
                            >
                                <span>{cleanCategory}</span>
                                <span style={{ color: '#9ca3af', fontSize: '10px' }}>{openCategories[category] ? '▼' : '▶'}</span>
                            </div>
                            {openCategories[category] && assets.map((asset, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => insertAsset(asset)} 
                                    style={{ padding: '10px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#111', fontWeight: 500, transition: 'all 0.1s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{asset.name}</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteAsset(category, idx); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold' }}
                                            title="삭제"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                    {asset.svgString && (
                                        <div 
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(asset.svgString) }} 
                                            className="library-svg-preview"
                                            style={{ width: '100%', background: '#f3f4f6', borderRadius: '4px', padding: '4px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', maxHeight: '120px' }} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )})}
                </div>
            </div>
        </div>
    )
}

export function AgentReceiver({ roomId }: { roomId: string }) {
    const editor = useEditor();

    useEffect(() => {
        const eventSource = new EventSource(`https://assets.sonagi.space/canvas-stream?room_id=${roomId}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.ping) return;

                if (data.shapes && Array.isArray(data.shapes)) {
                    if (data.assets && Array.isArray(data.assets)) {
                        try {
                            editor.createAssets(data.assets);
                        } catch (err) {
                            console.error("AgentReceiver error creating assets:", err);
                        }
                    }
                    // 하나씩 개별 생성하여 오류 발생 시 전체 크래시를 방지
                    for (const shape of data.shapes) {
                        try {
                            editor.createShape(shape);
                        } catch (err) {
                            console.error("AgentReceiver error creating shape:", shape, err);
                        }
                    }
                }
            } catch (e) {
                console.error("AgentReceiver error parsing event:", e);
            }
        };

        eventSource.onerror = () => {
            // Keep silent or log minimally to avoid spam on disconnects
            // console.error("AgentReceiver SSE error:", e);
        };

        return () => {
            eventSource.close();
        };
    }, [editor]);

    return null;
}


function ResourceHubSidebar() {
    const isMobile = useIsMobile()
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<'assets'|'refs'>('assets')

    const searchResources = async () => {
        if (!query.trim()) return
        setLoading(true)
        try {
            if (tab === 'assets') {
                const res = await fetch(`https://assets.sonagi.space/api/items?search=${encodeURIComponent(query)}&limit=10`)
                if (res.ok) {
                    const data = await res.json()
                    // GET /api/items returns { total, items: [...] }, not a bare array.
                    // Setting `results` to the whole object here used to crash the
                    // sidebar with "results.map is not a function" as soon as a search
                    // actually returned a hit (empty results masked it, since the
                    // initial state is already []).
                    setResults(Array.isArray(data) ? data : (data.items || []))
                } else {
                    setResults([])
                }
            } else {
                // Placeholder for ref.sonagi.space search
                // You can link this to a real API once ready
                setResults([
                    { id: 'mock1', title: 'Reference Mock', url: 'https://example.com', imageUrl: '' }
                ])
            }
        } catch (e) {
            console.error(e)
            alert("검색 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const insertAsset = (item: any) => {
        const bounds = editor.getViewportPageBounds()
        const center = bounds.center

        if (tab === 'assets') {
            editor.createShape({
                type: 'wired-asset-card',
                x: center.x,
                y: center.y,
                props: {
                    w: 240,
                    h: 300,
                    title: item.name || item.title,
                    ext: item.ext || 'svg',
                    tags: (item.tags || []).join(', '),
                    imageUrl: item.id ? `https://assets.sonagi.space/api/image/${item.id}/original` : ''
                }
            } as any)
        } else {
            editor.createShape({
                type: 'wired-reference-card',
                x: center.x,
                y: center.y,
                props: {
                    w: 320,
                    h: 240,
                    title: item.title,
                    url: item.url || '',
                    imageUrl: item.imageUrl || ''
                }
            } as any)
        }
        if (isMobile) setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    pointerEvents: 'all'
                }}
            >
                🔍 에셋 검색
            </button>
        )
    }

    return (
        <div style={{
            width: isMobile ? '100%' : '320px',
            height: isMobile ? '50vh' : '400px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'all',
            border: '1px solid #e5e7eb'
        }}>
            <div style={{ background: '#f3f4f6', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setTab('assets')}
                        style={{ background: tab === 'assets' ? '#3b82f6' : '#e5e7eb', color: tab === 'assets' ? '#fff' : '#4b5563', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >Assets</button>
                    <button 
                        onClick={() => setTab('refs')}
                        style={{ background: tab === 'refs' ? '#3b82f6' : '#e5e7eb', color: tab === 'refs' ? '#fff' : '#4b5563', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >References</button>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ padding: '12px', display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchResources()}
                    placeholder="검색어 입력..."
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                />
                <button 
                    onClick={searchResources}
                    disabled={loading}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >{loading ? '...' : '검색'}</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((item, i) => (
                    <div 
                        key={i} 
                        onClick={() => insertAsset(item)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', 
                            background: '#f9fafb', borderRadius: '8px', cursor: 'pointer',
                            border: '1px solid #e5e7eb', transition: 'background 0.2s'
                        }}
                    >
                        <div style={{ width: '40px', height: '40px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                            {(item.id || item.imageUrl) ? (
                                <img src={item.imageUrl || `https://assets.sonagi.space/api/image/${item.id}/original`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name || item.title}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{tab === 'assets' ? item.ext : 'Reference'}</span>
                        </div>
                    </div>
                ))}
                {results.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20px', fontSize: '14px' }}>검색 결과가 없습니다.</div>
                )}
            </div>
        </div>
    )
}

function InFrontWrapper({ roomId }: { roomId: string }) {
    const isMobile = useIsMobile()
    return (
        <>
            <JambotQuickGestures />
            <div style={{ position: 'absolute', top: 16, left: 60, zIndex: 9999, pointerEvents: 'none' }}>
                <SonagiLogo height={24} variant="full" />
            </div>
            <div style={{ position: 'absolute', bottom: isMobile ? 'auto' : 16, top: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : 'auto', right: 16, zIndex: 9999, display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: 'column', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    <AgentReceiver roomId={roomId} />
                    <ShareButton />
                    <ResourceHubSidebar />
                    <LibrarySidebar />
                </div>
            </div>
        </>
    )
}

const multiplayerAssets: TLAssetStore = {
	async upload(_asset, file) {
		const id = uniqueId()
		const objectName = `${id}-${file.name}`
		const url = `${WORKER_URL}/uploads/${encodeURIComponent(objectName)}`
		const response = await fetch(url, { method: 'PUT', body: file })
		if (!response.ok) throw new Error(`Failed to upload asset: ${response.statusText}`)
		return { src: url }
	},
	resolve(asset) {
		return asset.props.src
	},
}

function App() {
	const [mode, setMode] = useState<'room' | 'file'>('file')
	const [targetRoom, setTargetRoom] = useState<string | null>(null)
	const [initialFile, setInitialFile] = useState<string | null>(null)
	const [isDiscord, setIsDiscord] = useState(false)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const room = urlParams.get('room')
        const file = urlParams.get('file')
        const instanceId = urlParams.get('instance_id')

        if (instanceId || window.location.pathname.startsWith('/draw')) {
            setIsDiscord(true)
        }

        if (room !== null) {
            setMode('room')
            setTargetRoom(room || generateRoomId())
        } else {
            setMode('file')
            setInitialFile(file)
        }
    }, [])

	return (
        <ErrorBoundary>
            <div style={{ position: 'fixed', top: isDiscord ? 48 : 0, left: 0, right: 0, bottom: 0 }}>
                {mode === 'room' && targetRoom ? (
                    <TldrawWrapper roomId={targetRoom} />
                ) : (
                    <TldrawFileWrapper initialFile={initialFile || undefined} />
                )}
            </div>
        </ErrorBoundary>
    )
}

function TldrawFileWrapper({ initialFile }: { initialFile?: string }) {
    const [fileList, setFileList] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isNewModalOpen, setIsNewModalOpen] = useState(false)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeFileName, setActiveFileName] = useState<string>(initialFile || '')

    // New drawing modal state
    const [newDrawingName, setNewDrawingName] = useState('')
    const [newTemplate, setNewTemplate] = useState<'blank' | '4tabs' | 'moodboard'>('blank')
    const [isCreating, setIsCreating] = useState(false)

    // Rename state
    const [renamingFile, setRenamingFile] = useState<string | null>(null)
    const [renameInput, setRenameInput] = useState('')

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const currentFileRef = useRef<string>(initialFile || '')
    const editorRef = useRef<any>(null)
    const isLoadingRef = useRef<boolean>(false)
    const autoSaveTimerRef = useRef<any>(null)

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 2500)
    }, [])

    const loadFile = useCallback((fileName: string) => {
        if (!fileName || !editorRef.current) return
        currentFileRef.current = fileName
        setActiveFileName(fileName)
        isLoadingRef.current = true

        fetch(`/api/drawings?file=${encodeURIComponent(fileName)}`)
            .then(res => {
                if (!res.ok) throw new Error('File not found')
                return res.json()
            })
            .then(snapshot => {
                // Load document store (excluding stale session camera state if present)
                const docSnapshot = snapshot.document ? { store: snapshot.document.store, schema: snapshot.document.schema } : snapshot
                editorRef.current.loadSnapshot(docSnapshot)

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        isLoadingRef.current = false
                        try {
                            const bounds = editorRef.current.getViewportScreenBounds()
                            if (bounds && bounds.width > 50 && bounds.height > 50) {
                                editorRef.current.zoomToFit({ animation: { duration: 250 } })
                            }
                        } catch (_) {}
                    }, 300)
                })
            })
            .catch(err => {
                console.error('Failed to load drawing snapshot:', err)
                isLoadingRef.current = false
            })
    }, [])

    // 1. Fetch file list from /api/drawings once
    useEffect(() => {
        fetch('/api/drawings')
            .then(res => res.json())
            .then(data => {
                if (data.files && data.files.length > 0) {
                    const names = data.files.map((f: any) => f.name)
                    setFileList(names)
                    if (!currentFileRef.current && names.length > 0) {
                        currentFileRef.current = names[0]
                        setActiveFileName(names[0])
                        if (editorRef.current) {
                            loadFile(names[0])
                        }
                    }
                }
            })
            .catch(console.error)
    }, [loadFile])

    const openNewModal = useCallback(() => {
        const todayStr = new Date().toISOString().slice(0, 10)
        setNewDrawingName(`Drawing_${todayStr}`)
        setNewTemplate('blank')
        setIsNewModalOpen(true)
    }, [])

    const handleCreateDrawing = useCallback(async () => {
        const rawName = (newDrawingName || `Drawing_${Date.now()}`).trim()
        if (!rawName) return
        setIsCreating(true)
        try {
            const res = await fetch('/api/drawings/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: rawName })
            })
            const data = await res.json()
            if (data.name) {
                setFileList(prev => [data.name, ...prev.filter(f => f !== data.name)])
                loadFile(data.name)
                setIsNewModalOpen(false)
                setIsModalOpen(false)
                showToast(`✨ 새 도면 '${data.name}'이(가) 생성되었습니다!`)

                if (newTemplate === '4tabs') {
                    setTimeout(() => {
                        (window as any).__APPLY_4TABS_TEMPLATE__?.()
                    }, 400)
                }
            } else if (data.error) {
                alert(data.error)
            }
        } catch (e: any) {
            alert('새 도면 생성 실패: ' + e.message)
        } finally {
            setIsCreating(false)
        }
    }, [newDrawingName, newTemplate, loadFile, showToast])

    const handleDuplicate = useCallback(async (name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const res = await fetch('/api/drawings/duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            const data = await res.json()
            if (data.name) {
                setFileList(prev => [data.name, ...prev])
                showToast(`📑 '${name}'이(가) '${data.name}'(으)로 복제되었습니다!`)
            }
        } catch (e: any) {
            alert('도면 복제 실패: ' + e.message)
        }
    }, [showToast])

    const handleStartRename = useCallback((name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setRenamingFile(name)
        setRenameInput(name)
    }, [])

    const handleConfirmRename = useCallback(async (fromName: string, e?: React.MouseEvent | React.FormEvent) => {
        if (e) e.stopPropagation()
        const target = renameInput.trim()
        if (!target || target === fromName) {
            setRenamingFile(null)
            return
        }
        try {
            const res = await fetch('/api/drawings/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: fromName, to: target })
            })
            const data = await res.json()
            if (data.name) {
                setFileList(prev => prev.map(f => f === fromName ? data.name : f))
                if (currentFileRef.current === fromName) {
                    currentFileRef.current = data.name
                    setActiveFileName(data.name)
                }
                showToast(`✏️ 도면 이름이 '${data.name}'(으)로 변경되었습니다!`)
            } else if (data.error) {
                alert(data.error)
            }
        } catch (e: any) {
            alert('이름 변경 실패: ' + e.message)
        } finally {
            setRenamingFile(null)
        }
    }, [renameInput, showToast])

    const handleDelete = useCallback(async (name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm(`'${name}' 도면을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
        try {
            const res = await fetch('/api/drawings/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            const data = await res.json()
            if (data.success) {
                setFileList(prev => {
                    const next = prev.filter(f => f !== name)
                    if (currentFileRef.current === name && next.length > 0) {
                        loadFile(next[0])
                    }
                    return next
                })
                showToast(`🗑️ '${name}' 도면이 삭제되었습니다.`)
            }
        } catch (e: any) {
            alert('도면 삭제 실패: ' + e.message)
        }
    }, [loadFile, showToast])

    // Register window actions for CustomMainMenu
    useEffect(() => {
        ;(window as any).__OPEN_DRAWING_MODAL__ = () => setIsModalOpen(true)
        ;(window as any).__NEW_DRAWING_PROMPT__ = openNewModal
        ;(window as any).__OPEN_ASSET_DRAWER__ = () => setIsDrawerOpen(true)
        return () => {
            delete (window as any).__OPEN_DRAWING_MODAL__
            delete (window as any).__NEW_DRAWING_PROMPT__
            delete (window as any).__OPEN_ASSET_DRAWER__
        }
    }, [openNewModal])

    // Memoize components and assetUrls so <Tldraw> NEVER re-mounts
    const components = useMemo(() => ({
        MainMenu: CustomMainMenu,
        SharePanel: () => null,
        InFrontOfTheCanvas: () => <JambotQuickGestures />
    }), [])

    const handleMount = useCallback((ed: any) => {
        editorRef.current = ed
        ;(window as any).editor = ed

        // Ensure canvas stays in light colorScheme even under Discord dark mode
        try {
            ed.user.updateUserPreferences({ colorScheme: 'light' })
        } catch (_) {}

        if (currentFileRef.current) {
            loadFile(currentFileRef.current)
        }

        ed.store.listen((entry: any) => {
            if (isLoadingRef.current) return
            if (entry && entry.source === 'remote') return

            clearTimeout(autoSaveTimerRef.current)
            autoSaveTimerRef.current = setTimeout(() => {
                if (isLoadingRef.current || !currentFileRef.current) return
                const snapshot = ed.getSnapshot()
                fetch('/api/drawings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: currentFileRef.current, data: snapshot })
                }).catch(console.error)
            }, 2000)
        })
    }, [loadFile])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Global Toast Notification */}
            {toastMessage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 999999,
                        background: '#0f172a',
                        color: '#f8fafc',
                        padding: '10px 18px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    <span>✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Modal Dialog for Opening & Managing Drawings */}
            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                    onClick={() => {
                        setIsModalOpen(false)
                        setRenamingFile(null)
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            width: '100%',
                            maxWidth: 520,
                            maxHeight: '82vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                    📄 도면 보관함 (llm-wiki)
                                </h3>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                                    총 {fileList.length}개의 도면 저장됨
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    onClick={openNewModal}
                                    style={{
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <span>➕</span>
                                    <span>새 도면</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setRenamingFile(null)
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        padding: '4px 8px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <input
                                type="text"
                                placeholder="도면 검색 (이름)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #cbd5e1',
                                    fontSize: 13,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* File List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {fileList
                                .filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(name => {
                                    const isCurrent = activeFileName === name
                                    const isEditing = renamingFile === name

                                    return (
                                        <div
                                            key={name}
                                            onClick={() => {
                                                if (!isEditing) {
                                                    loadFile(name)
                                                    setIsModalOpen(false)
                                                }
                                            }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                cursor: isEditing ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: isCurrent ? '#eff6ff' : '#ffffff',
                                                border: isCurrent ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => handleConfirmRename(name, e)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}
                                                >
                                                    <input
                                                        type="text"
                                                        value={renameInput}
                                                        onChange={(e) => setRenameInput(e.target.value)}
                                                        autoFocus
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px 10px',
                                                            borderRadius: 6,
                                                            border: '1px solid #3b82f6',
                                                            fontSize: 13,
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <button
                                                        type="submit"
                                                        style={{
                                                            padding: '6px 10px',
                                                            background: '#2563eb',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setRenamingFile(null)
                                                        }}
                                                        style={{
                                                            padding: '6px 8px',
                                                            background: '#f1f5f9',
                                                            color: '#64748b',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        취소
                                                    </button>
                                                </form>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                                        <span style={{ fontSize: 16 }}>📄</span>
                                                        <span style={{
                                                            fontSize: 13,
                                                            fontWeight: isCurrent ? 700 : 500,
                                                            color: isCurrent ? '#1d4ed8' : '#1e293b',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {name}
                                                        </span>
                                                        {isCurrent && (
                                                            <span style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: '#15803d',
                                                                background: '#dcfce7',
                                                                padding: '2px 6px',
                                                                borderRadius: 4,
                                                                flexShrink: 0
                                                            }}>
                                                                열림 ✓
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleDuplicate(name, e)}
                                                            style={{
                                                                padding: '5px 8px',
                                                                background: '#f8fafc',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: 6,
                                                                fontSize: 11,
                                                                cursor: 'pointer',
                                                                color: '#475569'
                                                            }}
                                                            title="도면 복제"
                                                        >
                                                            📑 복제
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleStartRename(name, e)}
                                                            style={{
                                                                padding: '5px 8px',
                                                                background: '#f8fafc',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: 6,
                                                                fontSize: 11,
                                                                cursor: 'pointer',
                                                                color: '#475569'
                                                            }}
                                                            title="이름 변경"
                                                        >
                                                            ✏️ 수정
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(name, e)}
                                                            style={{
                                                                padding: '5px 8px',
                                                                background: '#fff1f2',
                                                                border: '1px solid #fecdd3',
                                                                borderRadius: 6,
                                                                fontSize: 11,
                                                                cursor: 'pointer',
                                                                color: '#e11d48'
                                                            }}
                                                            title="도면 삭제"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal for Creating a New Drawing */}
            {isNewModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100000,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                    onClick={() => !isCreating && setIsNewModalOpen(false)}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            width: '100%',
                            maxWidth: 460,
                            boxShadow: '0 25px 40px -5px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>✨</span>
                                <span>새 도면 만들기</span>
                            </h3>
                            <button
                                onClick={() => !isCreating && setIsNewModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 18,
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: '4px 8px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Input Field */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    도면 이름
                                </label>
                                <input
                                    type="text"
                                    value={newDrawingName}
                                    onChange={(e) => setNewDrawingName(e.target.value)}
                                    placeholder="예: 신규_프로젝트_기획안"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateDrawing()
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #cbd5e1',
                                        fontSize: 14,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Template Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                    스타팅 템플릿 선택
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        {
                                            id: 'blank',
                                            icon: '📄',
                                            title: '빈 캔버스 (Blank Canvas)',
                                            desc: '백지 상태에서 자유롭게 기획하고 그립니다.'
                                        },
                                        {
                                            id: '4tabs',
                                            icon: '📌',
                                            title: '4-Tabs 기획 템플릿 (Full Set)',
                                            desc: '요구사항, 유저 저니, 와이어프레임, 무드보드 4개 페이지 세팅.'
                                        }
                                    ].map(tmpl => {
                                        const isSelected = newTemplate === tmpl.id
                                        return (
                                            <div
                                                key={tmpl.id}
                                                onClick={() => setNewTemplate(tmpl.id as any)}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: 8,
                                                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    background: isSelected ? '#eff6ff' : '#ffffff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span style={{ fontSize: 22 }}>{tmpl.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#1d4ed8' : '#1e293b' }}>
                                                        {tmpl.title}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                                        {tmpl.desc}
                                                    </div>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '14px 20px',
                            background: '#f8fafc',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 8
                        }}>
                            <button
                                onClick={() => setIsNewModalOpen(false)}
                                disabled={isCreating}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 6,
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateDrawing}
                                disabled={isCreating}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                }}
                            >
                                {isCreating ? '생성 중...' : '✨ 생성 및 열기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle Collapsible Edge Trigger Handle for Asset Drawer */}
            <button
                onClick={() => setIsDrawerOpen(true)}
                style={{
                    position: 'fixed',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 250,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #d1d5db',
                    borderRight: 'none',
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    boxShadow: '-2px 2px 8px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease'
                }}
                title="에셋 & 템플릿 서랍 열기"
            >
                <span style={{ fontSize: 16 }}>🎨</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', writingMode: 'vertical-rl' }}>에셋</span>
            </button>

            {/* Asset Drawer */}
            <AssetDrawer
                editor={editorRef.current}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                isDiscord={window.location.pathname.startsWith('/draw')}
            />

            <Tldraw
                colorScheme="light"
                components={components}
                assetUrls={customAssetUrls}
                shapeUtils={allShapeUtils}
                licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
                onMount={handleMount}
            />
        </div>
    )
}

const baseUrl = window.location.pathname.startsWith('/draw') ? `${window.location.origin}/draw` : window.location.origin;

const defaultAssets = getAssetUrls({ baseUrl: `${baseUrl}/tldraw-assets/` });

const customAssetUrls = {
    ...defaultAssets,
    fonts: {
        ...defaultAssets.fonts,
        tldraw_draw: `${baseUrl}/fonts/KyoboHandwriting2023.woff`,
        tldraw_sans: `${baseUrl}/fonts/Pretendard.woff2`,
        tldraw_serif: `${baseUrl}/fonts/GowunBatang.woff2`,
        tldraw_mono: `${baseUrl}/fonts/D2Coding.woff2`
    }
}

function TldrawWrapper({ roomId }: { roomId: string }) {
     const storeSync = useSync({
		uri: `${WORKER_URL}/connect/${roomId}`,
        assets: multiplayerAssets,
        shapeUtils: allShapeUtils as any
	})

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Tldraw
                colorScheme="light"
                store={storeSync as any}
                components={{ MainMenu: CustomMainMenu, SharePanel: () => null, InFrontOfTheCanvas: () => <InFrontWrapper roomId={roomId} /> }} 
                assetUrls={customAssetUrls}
                shapeUtils={allShapeUtils}
                licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
                onMount={(editor) => {
                    // [Agentic Access] Expose the official Tldraw Editor instance on window
                    // so MCP/agent automation (e.g. Playwright) can safely call editor.createShapes()
                    // etc. through the validated in-memory store instead of touching SQLite directly.
                    ;(window as any).editor = editor
                    try {
                        editor.user.updateUserPreferences({ colorScheme: 'light' })
                    } catch (_) {}
                }}
            />
        </div>
    )
}

export default App
