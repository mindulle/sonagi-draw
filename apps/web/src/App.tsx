import { useSync } from '@tldraw/sync'
import { Tldraw, TLAssetStore, uniqueId, useEditor, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useState } from 'react'

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
            style={{ background: '#000', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', pointerEvents: 'all', fontSize: '13px' }}
        >
            {copied ? '✅ 링크 복사 완료!' : '🔗 초대 링크 복사'}
        </button>
    )
}

type LibraryAsset = { name: string; shapes: any[] }
type LibraryData = Record<string, LibraryAsset[]>

function LibrarySidebar() {
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [libraryData, setLibraryData] = useState<LibraryData>({})
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})

    const fetchLibrary = () => {
        fetch(`/library-assets.json`)
            .then(res => res.json())
            .then(data => {
                setLibraryData(data)
                const initialCategories: Record<string, boolean> = {}
                Object.keys(data).forEach(k => initialCategories[k] = true)
                setOpenCategories(initialCategories)
            })
            .catch(err => console.error("Failed to load library assets:", err))
    }

    useEffect(() => {
        fetchLibrary()
    }, [])

    const insertAsset = (asset: LibraryAsset) => {
        const center = editor.getViewportPageBounds().center
        
        const idMap: Record<string, ReturnType<typeof createShapeId>> = {}
        const shapesToCreate = asset.shapes.map(s => {
            const newId = createShapeId()
            idMap[s.id] = newId
            return {
                ...s,
                id: newId,
                x: center.x + s.x,
                y: center.y + s.y,
                parentId: s.parentId && s.parentId.startsWith('shape:') ? idMap[s.parentId] || s.parentId : "page:wireframe"
            }
        })
        
        shapesToCreate.forEach(s => {
            if (s.parentId && s.parentId.startsWith('shape:') && idMap[s.parentId]) {
                s.parentId = idMap[s.parentId]
            }
        })

        editor.createShapes(shapesToCreate as any)
    }

    const addSelectedToLibrary = async () => {
        const selectedShapes = editor.getSelectedShapes()
        if (selectedShapes.length === 0) {
            alert("저장할 도형을 먼저 선택해주세요!")
            return
        }

        const name = window.prompt("저장할 에셋의 이름을 입력하세요:", "New Asset")
        if (!name) return


        alert(`백엔드 연동 테스트: ${name} 에셋이 성공적으로 캡처되었습니다!`)
    }

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: isOpen ? '#2563eb' : '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', pointerEvents: 'all', fontSize: '13px', transition: 'all 0.1s' }}
            >
                📚 Library {isOpen ? '▼' : '▶'}
            </button>

            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '300px', maxHeight: '500px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 999999, overflow: 'hidden' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#111' }}>📚 UI Library</h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✖</button>
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
                                        style={{ padding: '10px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#111', fontWeight: 500, transition: 'all 0.1s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                    >
                                        {asset.name}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function CustomTopPanel() {
    return (
        <div style={{ pointerEvents: 'all', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShareButton />
            <LibrarySidebar />
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
            <Tldraw store={storeSync} components={{ SharePanel: CustomTopPanel }} />
        </div>
    )
}

export default App
