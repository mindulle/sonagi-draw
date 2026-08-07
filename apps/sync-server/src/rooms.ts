import { mkdirSync } from 'fs'
import { join } from 'path'
import { NodeSqliteWrapper, SQLiteSyncStorage, TLSocketRoom } from '@tldraw/sync-core'
import Database from 'better-sqlite3'
import { createTLSchema, defaultShapeSchemas } from '@tldraw/tlschema'
import { customShapeSchemas } from '@sonagi-draw/schema'

// For this example we're saving data to a SQLite database on the local filesystem
const DIR = './.rooms'
mkdirSync(DIR, { recursive: true })

const schema = createTLSchema({
	shapes: { ...defaultShapeSchemas, ...customShapeSchemas }
})

// Sanitize roomId to prevent path traversal attacks
function sanitizeRoomId(roomId: string): string {
	return roomId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// We'll keep an in-memory map of active rooms
const rooms = new Map<string, TLSocketRoom<any, void>>()
const closeTimeouts = new Map<string, NodeJS.Timeout>()

export function makeOrLoadRoom(roomId: string): TLSocketRoom<any, void> {
	roomId = sanitizeRoomId(roomId)

	const existing = rooms.get(roomId)
	if (existing && !existing.isClosed()) {
		const timeout = closeTimeouts.get(roomId)
		if (timeout) {
			clearTimeout(timeout)
			closeTimeouts.delete(roomId)
		}
		return existing
	}

	console.log('loading room', roomId)
	// Open the database - file is created if it doesn't exist
	const db = new Database(join(DIR, `${roomId}.db`))
	const sql = new NodeSqliteWrapper(db)
	const storage = new SQLiteSyncStorage({ sql })

	const room = new TLSocketRoom({
		storage,
		schema,
		onSessionRemoved(room, args) {
			console.log('client disconnected', args.sessionId, roomId)
			if (args.numSessionsRemaining === 0) {
				const timeout = setTimeout(() => {
					console.log('closing room', roomId)
					room.close()
					db.close()
					rooms.delete(roomId)
					closeTimeouts.delete(roomId)
				}, 5000)
				closeTimeouts.set(roomId, timeout)
			}
		},
	})

	rooms.set(roomId, room)
	return room
}
