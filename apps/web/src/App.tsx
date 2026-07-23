import { useSync } from '@tldraw/sync'
import { Tldraw, TLAssetStore, uniqueId, useEditor, createShapeId, TLContent } from 'tldraw'
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
            style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
            {copied ? '✅ 링크 복사 완료!' : '🔗 초대 링크 복사'}
        </button>
    )
}

interface CustomLibraryItem {
    id: string;
    name: string;
    content: TLContent;
}

function LibraryPanel() {
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [customItems, setCustomItems] = useState<CustomLibraryItem[]>([])

    const fetchLibrary = async () => {
        try {
            const res = await fetch(`${WORKER_URL}/library`)
            if (res.ok) {
                const data = await res.json()
                setCustomItems(data)
            }
        } catch (e) {
            console.error('Failed to fetch custom library', e)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchLibrary()
        }
    }, [isOpen])

    const handleAddSelected = async () => {
        const selectedIds = editor.getSelectedShapeIds()
        if (selectedIds.length === 0) {
            alert('저장할 도형을 선택해주세요.')
            return
        }

        const name = prompt('라이브러리 아이템 이름을 입력해주세요:', `Custom Asset ${customItems.length + 1}`)
        if (!name) return

        const content = editor.getContentFromCurrentPage(selectedIds)
        if (!content) return

        const newItem: CustomLibraryItem = {
            id: uniqueId(),
            name,
            content
        }

        try {
            const res = await fetch(`${WORKER_URL}/library`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            })
            if (!res.ok) throw new Error('서버 응답 오류')
            
            setCustomItems(prev => [...prev, newItem])
            alert(`'${name}' 이(가) 라이브러리에 추가되었습니다.`)
        } catch (e) {
            alert('저장에 실패했습니다.')
        }
    }

    const insertCustomComponent = (item: CustomLibraryItem) => {
        editor.putContentOntoCurrentPage(item.content, {
            point: editor.getViewportPageBounds().center,
            select: true
        })
    }

    const removeCustomComponent = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm('이 에셋을 삭제하시겠습니까?')) {
            try {
                const res = await fetch(`${WORKER_URL}/library/${id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error('서버 응답 오류')
                setCustomItems(prev => prev.filter(item => item.id !== id))
            } catch (e) {
                alert('삭제에 실패했습니다.')
            }
        }
    }

    const insertComponent = (type: string) => {
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
                📚 UI Library {isOpen ? '▼' : '▶'}
            </button>
            {isOpen && (
                <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <button 
                        onClick={handleAddSelected}
                        style={{ padding: '8px', background: '#e0f2fe', color: '#1e40af', border: '1px dashed #7dd3fc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '4px' }}
                    >
                        ➕ 선택 항목 저장
                    </button>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>Defaults</div>
                    <button onClick={() => insertComponent('button')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>✨ Primary Button</button>
                    <button onClick={() => insertComponent('card')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>🖼️ Content Card</button>
                    <button onClick={() => insertComponent('modal')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>🪟 Modal Window</button>
                    
                    {customItems.length > 0 && (
                        <>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginTop: '8px', marginBottom: '4px' }}>My Library</div>
                            {customItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                        onClick={() => insertCustomComponent(item)} 
                                        style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        ⭐ {item.name}
                                    </button>
                                    <button 
                                        onClick={(e) => removeCustomComponent(e, item.id)}
                                        style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                                        title="삭제"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}


function CustomTopPanel() {
    return (
        <div style={{ pointerEvents: 'all', display: 'flex', gap: '8px', padding: '4px', alignItems: 'flex-start' }}>
            <ShareButton />
            <LibraryPanel />
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
