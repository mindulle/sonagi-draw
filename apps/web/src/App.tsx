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
            style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
            {copied ? '✅ 링크 복사 완료!' : '🔗 초대 링크 복사'}
        </button>
    )
}

function LibraryPanel() {
    const editor = useEditor()
    const [isOpen, setIsOpen] = useState(false)

    const insertComponent = (type: string) => {
        const center = editor.getViewportPageBounds().center
        const bgId = createShapeId()
        
        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 140, h: 48, size: 'm' } },
                { id: groupId, type: 'group', x: center.x, y: center.y, props: {} }
            ] as any)
            editor.groupShapes([bgId])
        } else if (type === 'card') {
            const imgId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 300, h: 250 } },
                { id: imgId, type: 'geo', x: center.x + 10, y: center.y + 10, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 280, h: 140 } },
                { id: groupId, type: 'group', x: center.x, y: center.y, props: {} }
            ] as any)
            editor.groupShapes([bgId, imgId])
        } else if (type === 'modal') {
            const overlayId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 500, h: 300 } },
                { id: overlayId, type: 'geo', x: center.x + 20, y: center.y + 220, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 460, h: 60 } },
                { id: groupId, type: 'group', x: center.x, y: center.y, props: {} }
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
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>Components</div>
                    <button onClick={() => insertComponent('button')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>✨ Primary Button</button>
                    <button onClick={() => insertComponent('card')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>🖼️ Content Card</button>
                    <button onClick={() => insertComponent('modal')} style={{ padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>🪟 Modal Window</button>
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
