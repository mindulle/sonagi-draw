import { useSync } from '@tldraw/sync'
import { Tldraw, TLAssetStore, uniqueId, useEditor, TLContent, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { insertLayoutComponent, insertUXPatternComponent, insertDiagramComponent, insertAnnotationComponent, toRichText } from './libraryTemplates'

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
        <button
            onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }}
            style={{ background: '#ffffff', color: '#1d1d1d', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', pointerEvents: 'all', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}
            onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
        >
            {copied ? '복사됨' : '링크 복사'}
        </button>
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

    const loadLibrary = () => {
        try {
            const saved = window.localStorage.getItem('sonagi_library_v2')
            if (saved) {
                let parsed = JSON.parse(JSON.stringify(DEFAULT_LIBRARY))
                try {
                    const temp = JSON.parse(saved)
                    if (typeof temp === 'object' && temp !== null) parsed = temp
                } catch (e) { console.warn("Failed to parse library, using default", e) }

                // Migrate old emoji keys if needed
                if (parsed["📦 내 커스텀 에셋"]) {
                    parsed["내 커스텀 에셋"] = parsed["📦 내 커스텀 에셋"]
                    delete parsed["📦 내 커스텀 에셋"]
                    try { window.localStorage.setItem('sonagi_library_v2', JSON.stringify(parsed)) } catch (e) {}
                }
                setLibraryData(parsed)
            } else { 
                setLibraryData(DEFAULT_LIBRARY)
                try { window.localStorage.setItem('sonagi_library_v2', JSON.stringify(DEFAULT_LIBRARY)) } catch (e) {}
            }
        } catch (e) { console.error("Local storage access failed", e) }
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

            let currentLib = JSON.parse(JSON.stringify(DEFAULT_LIBRARY))
            try {
                const stored = window.localStorage.getItem('sonagi_library_v2')
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (typeof parsed === 'object' && parsed !== null) {
                        currentLib = parsed
                    }
                }
            } catch (e) { console.warn("Failed to parse library, using default", e) }

            if (!currentLib["내 커스텀 에셋"] || !Array.isArray(currentLib["내 커스텀 에셋"])) currentLib["내 커스텀 에셋"] = []
            
            currentLib["내 커스텀 에셋"].push({ name: name, content: content, svgString: svgString })
            
            try {
                window.localStorage.setItem('sonagi_library_v2', JSON.stringify(currentLib))
                setLibraryData(currentLib)
                setOpenCategories(prev => ({ ...prev, "내 커스텀 에셋": true }))
            } catch (storageError: any) {
                if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
                    alert("로컬 스토리지 용량이 가득 찼습니다. 기존 에셋을 삭제한 후 다시 시도해주세요.")
                } else {
                    alert("에셋 저장 중 오류가 발생했습니다.")
                }
                console.error("Storage error:", storageError)
            }
        } catch (e) { alert("저장에 실패했습니다."); console.error(e) }
    }

    const deleteAsset = (category: string, index: number) => {
        if (!confirm('이 에셋을 삭제하시겠습니까?')) return
        
        let currentLib = JSON.parse(JSON.stringify(DEFAULT_LIBRARY))
        try {
            const stored = window.localStorage.getItem('sonagi_library_v2')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (typeof parsed === 'object' && parsed !== null) {
                    currentLib = parsed
                }
            }
        } catch (e) { console.warn("Failed to parse library during delete", e) }

        if (currentLib[category] && Array.isArray(currentLib[category])) {
            currentLib[category].splice(index, 1)
            try {
                window.localStorage.setItem('sonagi_library_v2', JSON.stringify(currentLib))
                setLibraryData(currentLib)
            } catch (e) { console.error("Failed to save after deletion", e) }
        }
    }

    const safeGroup = (ids: any[]) => {
        if (ids.length > 1) {
            try { editor.groupShapes(ids) } catch (e) { console.error(e) }
        }
    }

    const insertDefaultComponent = (editor: any, type: string) => {
        const center = editor.getViewportPageBounds().center
        const bgId = createShapeId()
        
        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 140, h: 48, size: 'm', richText: toRichText('Button') } },
            ] as any)
            safeGroup([bgId])
        } else if (type === 'card') {
            const imgId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 300, h: 250 } },
                { id: imgId, type: 'geo', x: center.x + 10, y: center.y + 10, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 280, h: 140 } },
            ] as any)
            safeGroup([bgId, imgId])
        } else if (type === 'modal') {
            const overlayId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 500, h: 300 } },
                { id: overlayId, type: 'geo', x: center.x + 20, y: center.y + 220, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 460, h: 60 } },
            ] as any)
            safeGroup([bgId, overlayId])
        }
    }

    const BUILTIN_CATEGORIES = [
        {
            category: "기본 UI 컴포넌트",
            items: [
                { label: "Primary Button", type: "button", insert: insertDefaultComponent },
                { label: "Content Card", type: "card", insert: insertDefaultComponent },
                { label: "Modal Window", type: "modal", insert: insertDefaultComponent }
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
            category: "유저 여정 & 다이어그램",
            items: [
                { label: "유저 플로우 노드", type: "user-flow", insert: insertDiagramComponent },
                { label: "사이트맵 뼈대", type: "sitemap", insert: insertDiagramComponent },
                { label: "아이디어 보드 (포스트잇)", type: "sticky-cluster", insert: insertDiagramComponent }
            ]
        },
        {
            category: "어노테이션 & 마커",
            items: [
                { label: "마우스 커서 / 포인터", type: "cursor-pointer", insert: insertAnnotationComponent },
                { label: "코멘트 핀 (숫자 뱃지)", type: "comment-pin", insert: insertAnnotationComponent },
                { label: "측정선 (Redlines)", type: "measurement-line", insert: insertAnnotationComponent }
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
                            {openCategories[category] && items.map((item, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        item.insert(editor, item.type)
                                        if (isMobile) setIsOpen(false)
                                    }} 
                                    style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                >
                                    {item.label}
                                </button>
                            ))}
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

function InFrontWrapper() {
    const isMobile = useIsMobile()
    return (
        <div style={{ position: 'absolute', bottom: isMobile ? 'auto' : 16, top: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : 'auto', right: 16, zIndex: 9999, display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: 'column', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                <ShareButton />
                <LibrarySidebar />
            </div>
        </div>
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
	const [roomId, setRoomId] = useState<string | null>(null)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        let room = urlParams.get('room')
        if (!room) {
            room = generateRoomId()
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.set('room', room)
            window.history.replaceState({}, '', newUrl.toString())
        }
        setRoomId(room)
    }, [])

    if (!roomId) return <div>Loading...</div>

	return (
        <div style={{ position: 'fixed', inset: 0 }}>
            <TldrawWrapper roomId={roomId} />
        </div>
    )
}

function TldrawWrapper({ roomId }: { roomId: string }) {
    const storeSync = useSync({
		uri: `${WORKER_URL}/connect/${roomId}`,
        assets: multiplayerAssets
	})

    const customAssetUrls = {
        fonts: {
            draw: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumPen.woff',
            sans: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/woff2/Pretendard-Regular.woff2',
            serif: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2111@1.0/GowunBatang-Regular.woff',
            mono: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202@1.0/D2Coding.woff'
        }
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Tldraw 
                store={storeSync} 
                components={{ SharePanel: () => null, InFrontOfTheCanvas: InFrontWrapper }} 
                assetUrls={customAssetUrls}
            />
        </div>
    )
}

export default App
