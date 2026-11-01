import { describe, it, expect, beforeEach } from 'vitest'
import {
	recordDiagnosticLog,
	recordDiagnosticLogsBatch,
	getDiagnosticLogs,
	clearDiagnosticLogs,
	getDiagnosticsHealth
} from './diagnostics'

describe('Diagnostics & Error Tracking System (DRAW-7)', () => {
	beforeEach(() => {
		clearDiagnosticLogs()
	})

	it('records and retrieves single diagnostic log', () => {
		const log = recordDiagnosticLog({
			level: 'error',
			type: 'WINDOW_ERROR',
			message: 'Uncaught TypeError: cannot read property of undefined',
			file: 'App.tsx',
			line: 42
		})

		expect(log.id).toBeDefined()
		expect(log.timestamp).toBeGreaterThan(0)

		const logs = getDiagnosticLogs()
		expect(logs).toHaveLength(1)
		expect(logs[0].message).toContain('Uncaught TypeError')
	})

	it('records batches of logs', () => {
		const count = recordDiagnosticLogsBatch([
			{ level: 'warn', type: 'CONSOLE_WARN', message: 'Warning 1' },
			{ level: 'error', type: 'UNHANDLED_REJECTION', message: 'Rejected promise' },
			{ level: 'info', type: 'CUSTOM', message: 'User action' }
		])

		expect(count).toBe(3)
		const logs = getDiagnosticLogs()
		expect(logs).toHaveLength(3)
	})

	it('filters logs by level and fileOrRoom', () => {
		recordDiagnosticLogsBatch([
			{ level: 'error', type: 'WINDOW_ERROR', message: 'Crash in file A', fileOrRoom: 'Drawing_A' },
			{ level: 'warn', type: 'CONSOLE_WARN', message: 'Warning in file B', fileOrRoom: 'Drawing_B' },
			{ level: 'error', type: 'FETCH_FAIL', message: 'Asset 404 in file B', fileOrRoom: 'Drawing_B' }
		])

		const errorsOnly = getDiagnosticLogs({ level: 'error' })
		expect(errorsOnly).toHaveLength(2)

		const fileBOnly = getDiagnosticLogs({ fileOrRoom: 'Drawing_B' })
		expect(fileBOnly).toHaveLength(2)

		const fileBErrors = getDiagnosticLogs({ level: 'error', fileOrRoom: 'Drawing_B' })
		expect(fileBErrors).toHaveLength(1)
		expect(fileBErrors[0].type).toBe('FETCH_FAIL')
	})

	it('computes health status correctly', () => {
		expect(getDiagnosticsHealth(2).status).toBe('healthy')
		expect(getDiagnosticsHealth(2).activeClients).toBe(2)

		// Add 1 error -> degraded
		recordDiagnosticLog({ level: 'error', type: 'WINDOW_ERROR', message: 'Crash 1' })
		const degraded = getDiagnosticsHealth(1)
		expect(degraded.status).toBe('degraded')
		expect(degraded.recentErrorCount).toBe(1)
		expect(degraded.latestError?.message).toBe('Crash 1')

		// Add 10 errors -> critical
		for (let i = 0; i < 10; i++) {
			recordDiagnosticLog({ level: 'error', type: 'WINDOW_ERROR', message: `Crash ${i + 2}` })
		}
		const critical = getDiagnosticsHealth(1)
		expect(critical.status).toBe('critical')
		expect(critical.ok).toBe(false)
	})
})
