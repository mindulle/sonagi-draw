import { describe, it, expect, beforeEach } from 'vitest'
import {
	recordClientDiagnostic,
	clientDiagnosticsBuffer,
	getClientType,
	getCurrentFileOrRoom
} from './diagnostics'

describe('Client Diagnostics Collector (DRAW-7)', () => {
	beforeEach(() => {
		clientDiagnosticsBuffer.length = 0
	})

	it('records and stores diagnostic logs in local ring buffer', () => {
		const entry = recordClientDiagnostic({
			level: 'error',
			type: 'WINDOW_ERROR',
			message: 'Test exception in canvas component',
			file: 'Canvas.tsx',
			line: 10,
			col: 5
		})

		expect(entry.timestamp).toBeGreaterThan(0)
		expect(entry.message).toBe('Test exception in canvas component')
		expect(clientDiagnosticsBuffer).toHaveLength(1)
		expect(clientDiagnosticsBuffer[0].type).toBe('WINDOW_ERROR')
	})

	it('enforces maximum ring buffer capacity', () => {
		for (let i = 0; i < 110; i++) {
			recordClientDiagnostic({
				level: 'info',
				type: 'CUSTOM',
				message: `Log entry ${i}`
			})
		}

		// Buffer capped at MAX_LOCAL_BUFFER (100)
		expect(clientDiagnosticsBuffer).toHaveLength(100)
		// Oldest logs shifted out, newest kept
		expect(clientDiagnosticsBuffer[99].message).toBe('Log entry 109')
	})

	it('identifies client type and file/room context safely', () => {
		const clientType = getClientType()
		expect(['web', 'discord-activity', 'obsidian']).toContain(clientType)

		const context = getCurrentFileOrRoom()
		expect(typeof context).toBe('string')
	})
})
