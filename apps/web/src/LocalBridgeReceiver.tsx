import { useEffect, useRef } from 'react'
import { useEditor, createShapeId, Editor } from 'tldraw'
import { toRichText } from './libraryTemplates'

export function executeEditorAction(editor: Editor, action: string, params: any = {}): any {
	if (action === 'add_sticky_note') {
		const noteId = createShapeId()
		editor.createShapes([
			{
				id: noteId,
				type: 'note',
				x: Number(params.x) || 100,
				y: Number(params.y) || 100,
				props: {
					color: params.color || 'yellow',
					richText: toRichText(params.text || '')
				}
			}
		])
		return { shapeId: noteId, pageId: editor.getCurrentPageId() }
	}

	if (action === 'add_wireframe_box') {
		const shapeId = createShapeId()
		const w = Number(params.w) || 200
		const h = Number(params.h) || 100
		const shapesToCreate: any[] = [
			{
				id: shapeId,
				type: 'geo',
				x: Number(params.x) || 100,
				y: Number(params.y) || 100,
				props: { geo: 'rectangle', w, h, color: 'grey', fill: 'none' }
			}
		]

		let labelId: string | null = null
		if (params.text) {
			labelId = createShapeId()
			shapesToCreate.push({
				id: labelId,
				type: 'text',
				x: (Number(params.x) || 100) + w / 2 - 100,
				y: (Number(params.y) || 100) + h / 2 - 20,
				props: {
					color: 'black',
					size: 'm',
					w: 200,
					textAlign: 'middle',
					autoSize: true,
					richText: toRichText(params.text)
				}
			})
		}
		editor.createShapes(shapesToCreate)
		return { shapeId, labelId, pageId: editor.getCurrentPageId() }
	}

	if (action === 'create_shapes') {
		editor.createShapes(params.shapes || [])
		return { createdCount: params.shapes?.length || 0 }
	}

	if (action === 'get_shapes' || action === 'get_page_shapes') {
		const shapes = editor.getCurrentPageShapes()
		return { shapes, pageId: editor.getCurrentPageId() }
	}

	if (action === 'get_room_state') {
		const shapes = editor.getCurrentPageShapes()
		const pages = editor.getPages().map((p) => ({ id: p.id, name: p.name }))
		return { shapes, availablePages: pages }
	}

	if (action === 'push_to_inbox') {
		const items = params.items || []
		const shapes = editor.getCurrentPageShapes() as any[]
		const inbox = shapes.find((s) => s.type === 'wired-mcp-inbox')
		if (inbox) {
			let existing: any[] = []
			try {
				existing = JSON.parse(inbox.props?.payload || '[]')
			} catch (_) {}
			const merged = [...existing, ...items]
			editor.updateShapes([
				{
					id: inbox.id,
					type: 'wired-mcp-inbox',
					props: {
						...(params.title ? { title: params.title } : {}),
						payload: JSON.stringify(merged)
					}
				} as any
			])
			return { created: false, shapeId: inbox.id, itemCount: merged.length }
		} else {
			const inboxId = createShapeId()
			const bounds = editor.getViewportPageBounds()
			editor.createShapes([
				{
					id: inboxId,
					type: 'wired-mcp-inbox',
					x: bounds.center.x - 210,
					y: bounds.center.y - 160,
					props: {
						w: 420,
						h: 320,
						title: params.title || 'MCP Agent Inbox',
						payload: JSON.stringify(items)
					}
				} as any
			])
			return { created: true, shapeId: inboxId, itemCount: items.length }
		}
	}

	throw new Error(`Unsupported action: ${action}`)
}

export function LocalBridgeReceiver({ file, roomId }: { file?: string; roomId?: string }) {
	const editor = useEditor()
	const wsRef = useRef<WebSocket | null>(null)
	const isMountedRef = useRef(true)

	useEffect(() => {
		isMountedRef.current = true
		let reconnectTimer: any = null

		function connect() {
			if (!isMountedRef.current) return
			try {
				const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
				const proto = isHttps ? 'wss:' : 'ws:'
				const host = typeof window !== 'undefined' ? window.location.host : '127.0.0.1:5858'
				const query = new URLSearchParams()
				query.set('clientType', 'web')
				if (file) query.set('file', file)
				if (roomId) query.set('roomId', roomId)

				const url = `${proto}//${host}/api/bridge/ws?${query.toString()}`
				const ws = new WebSocket(url)
				wsRef.current = ws

				ws.onopen = () => {
					ws.send(
						JSON.stringify({
							type: 'status_update',
							currentFile: file,
							currentRoomId: roomId
						})
					)
				}

				ws.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data)
						if (data.type === 'execute') {
							const { id, action, params } = data
							try {
								const result = executeEditorAction(editor, action, params)
								ws.send(
									JSON.stringify({
										id,
										ok: true,
										result
									})
								)
							} catch (err: any) {
								ws.send(
									JSON.stringify({
										id,
										ok: false,
										error: err?.message || String(err)
									})
								)
							}
						}
					} catch (e) {
						console.error('[Bridge Receiver Parse Error]', e)
					}
				}

				ws.onclose = () => {
					wsRef.current = null
					if (isMountedRef.current) {
						reconnectTimer = setTimeout(connect, 3000)
					}
				}

				ws.onerror = () => {
					// Silent fallback to direct store
				}
			} catch (_) {
				if (isMountedRef.current) {
					reconnectTimer = setTimeout(connect, 5000)
				}
			}
		}

		connect()

		return () => {
			isMountedRef.current = false
			clearTimeout(reconnectTimer)
			wsRef.current?.close()
		}
	}, [editor, file, roomId])

	return null
}
