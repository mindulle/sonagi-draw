import { useSync } from '@tldraw/sync'
import { Tldraw, TLAssetStore, uniqueId, useEditor, TLContent, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useState } from 'react'
import { insertLayoutComponent, insertUXPatternComponent, insertDiagramComponent, insertAnnotationComponent } from './libraryTemplates'

const WORKER_URL = window.location.origin

function generateRoomId() {
    return Math.random().toString(36).substring(2, 10)
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
            {copied ? '✅ 복사됨' : '🔗 링크 복사'}
        </button>
    )
}

type LibraryAsset = { name: string; content: TLContent; svgString?: string }
type LibraryData = Record<string, LibraryAsset[]>

const DEFAULT_LIBRARY: LibraryData = { "📦 내 커스텀 에셋": [] }

function LibrarySidebar() {
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [libraryData, setLibraryData] = useState<LibraryData>({})
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ "📦 내 커스텀 에셋": true })

    const loadLibrary = () => {
        try {
            const saved = window.localStorage.getItem('sonagi_library_v2')
            if (saved) setLibraryData(JSON.parse(saved))
            else { setLibraryData(DEFAULT_LIBRARY); window.localStorage.setItem('sonagi_library_v2', JSON.stringify(DEFAULT_LIBRARY)) }
        } catch (e) { console.error("Local storage access failed", e) }
    }

    useEffect(() => { loadLibrary() }, [])

    const insertAsset = (asset: LibraryAsset) => {
        try {
            editor.putContentOntoCurrentPage(asset.content, { point: editor.getViewportPageBounds().center, select: true })
        } catch (e) { console.error("Insert failed", e); alert("에셋 삽입 중 오류가 발생했습니다.") }
    }

    const addSelectedToLibrary = async () => {
        const selectedShapeIds = editor.getSelectedShapeIds()
        if (selectedShapeIds.length === 0) { alert("저장할 도형을 먼저 캔버스에서 선택해주세요!"); return }

        const name = window.prompt("저장할 에셋의 이름을 입력하세요:", "새로운 에셋")
        if (!name) return

        try {
            const content = editor.getContentFromCurrentPage(selectedShapeIds)
            if (!content) throw new Error("Failed to extract content")

            const result = await editor.getSvgString(selectedShapeIds, { background: false })
            const svgString = result?.svg || ""

            const currentLib = JSON.parse(window.localStorage.getItem('sonagi_library_v2') || JSON.stringify(DEFAULT_LIBRARY))
            if (!currentLib["📦 내 커스텀 에셋"]) currentLib["📦 내 커스텀 에셋"] = []
            
            currentLib["📦 내 커스텀 에셋"].push({ name: name, content: content, svgString: svgString })
            window.localStorage.setItem('sonagi_library_v2', JSON.stringify(currentLib))
            setLibraryData(currentLib)
            setOpenCategories(prev => ({ ...prev, "📦 내 커스텀 에셋": true }))
        } catch (e) { alert("저장에 실패했습니다."); console.error(e) }
    }

    const deleteAsset = (category: string, index: number) => {
        if (!confirm('이 에셋을 삭제하시겠습니까?')) return
        const currentLib = JSON.parse(window.localStorage.getItem('sonagi_library_v2') || JSON.stringify(DEFAULT_LIBRARY))
        if (currentLib[category]) {
            currentLib[category].splice(index, 1)
            window.localStorage.setItem('sonagi_library_v2', JSON.stringify(currentLib))
            setLibraryData(currentLib)
        }
    }

    const insertDefaultComponent = (type: string) => {
        const center = editor.getViewportPageBounds().center
        const bgId = createShapeId()
        
        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 140, h: 48, size: 'm' } },
            ] as any)
            editor.groupShapes([bgId])
        } else if (type === 'card') {
            const imgId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 300, h: 250 } },
                { id: imgId, type: 'geo', x: center.x + 10, y: center.y + 10, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 280, h: 140 } },
            ] as any)
            editor.groupShapes([bgId, imgId])
        } else if (type === 'modal') {
            const overlayId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 500, h: 300 } },
                { id: overlayId, type: 'geo', x: center.x + 20, y: center.y + 220, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 460, h: 60 } },
            ] as any)
            editor.groupShapes([bgId, overlayId])
        }
    }

    if (!isOpen) { 
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{ background: '#ffffff', color: '#1d1d1d', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s', pointerEvents: 'all', fontFamily: 'inherit', fontSize: '13px' }} 
                onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} 
                onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
            >
                📚 라이브러리
            </button> 
        )
    }

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'all' }}>
            <button 
                onClick={() => setIsOpen(false)}
                style={{ background: '#f3f4f6', color: '#1d1d1d', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s', pointerEvents: 'all', fontFamily: 'inherit', fontSize: '13px' }}
            >
                📚 라이브러리 ▼
            </button>
            <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px', width: '320px', maxHeight: 'calc(100vh - 100px)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 25px rgba(0,0,0,0.15)', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>📚 UI Library</h3>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>✖</button>
                </div>
                
                <div style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                    <button 
                        onClick={addSelectedToLibrary}
                        style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
                    >
                        ➕ 캔버스 선택 항목 추가
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fcfcfc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}>
                            ✨ 기본 UI 컴포넌트
                        </div>
                        <button onClick={() => insertDefaultComponent('button')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>✨ Primary Button</button>
                        <button onClick={() => insertDefaultComponent('card')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🖼️ Content Card</button>
                        <button onClick={() => insertDefaultComponent('modal')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🪟 Modal Window</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}>
                            📱 레이아웃 & 디바이스
                        </div>
                        <button onClick={() => insertLayoutComponent(editor, 'mobile-frame')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📱 모바일 프레임 (목업)</button>
                        <button onClick={() => insertLayoutComponent(editor, 'browser-window')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🌐 웹 브라우저 창</button>
                        <button onClick={() => insertLayoutComponent(editor, 'dashboard-skeleton')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📊 대시보드 뼈대</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}>
                            🧩 자주 쓰이는 UX 패턴
                        </div>
                        <button onClick={() => insertUXPatternComponent(editor, 'auth-form')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🔐 로그인 / 회원가입 폼</button>
                        <button onClick={() => insertUXPatternComponent(editor, 'pricing-table')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>💳 가격 정책 표 (3단)</button>
                        <button onClick={() => insertUXPatternComponent(editor, 'feed-list')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📋 피드 & 리스트 뷰</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}>
                            🗺️ 유저 여정 & 다이어그램
                        </div>
                        <button onClick={() => insertDiagramComponent(editor, 'user-flow')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>➡️ 유저 플로우 노드</button>
                        <button onClick={() => insertDiagramComponent(editor, 'sitemap')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🌳 사이트맵 뼈대</button>
                        <button onClick={() => insertDiagramComponent(editor, 'sticky-cluster')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📌 아이디어 보드 (포스트잇)</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}>
                            💬 어노테이션 & 마커
                        </div>
                        <button onClick={() => insertAnnotationComponent(editor, 'cursor-pointer')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>🖱️ 마우스 커서 / 포인터</button>
                        <button onClick={() => insertAnnotationComponent(editor, 'comment-pin')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📍 코멘트 핀 (숫자 뱃지)</button>
                        <button onClick={() => insertAnnotationComponent(editor, 'measurement-line')} style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>📏 측정선 (Redlines)</button>
                    </div>

                    {Object.entries(libraryData).map(([category, assets]) => (
                        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div 
                                onClick={() => setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                                style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '2px solid #e5e7eb' }}
                            >
                                <span>{category}</span>
                                <span style={{ color: '#9ca3af' }}>{openCategories[category] ? '▼' : '▶'}</span>
                            </div>
                            {openCategories[category] && assets.map((asset, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => insertAsset(asset)} 
                                    style={{ padding: '10px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#111', fontWeight: 500, transition: 'all 0.1s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🧩 {asset.name}</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteAsset(category, idx); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px', fontSize: '12px' }}
                                            title="삭제"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                    {asset.svgString && (
                                        <div 
                                            dangerouslySetInnerHTML={{ __html: asset.svgString }} 
                                            className="library-svg-preview"
                                            style={{ width: '100%', background: '#f3f4f6', borderRadius: '4px', padding: '4px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', maxHeight: '120px' }} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function InFrontWrapper() {
    return (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 9999, display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: 'column', pointerEvents: 'none' }}>
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

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Tldraw store={storeSync} components={{ SharePanel: () => null, InFrontOfTheCanvas: InFrontWrapper }} />
        </div>
    )
}

export default App
