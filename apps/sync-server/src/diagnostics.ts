export interface DiagnosticLogEntry {
	id: string
	timestamp: number
	level: 'error' | 'warn' | 'info' | 'debug'
	type: 'WINDOW_ERROR' | 'UNHANDLED_REJECTION' | 'CONSOLE_ERROR' | 'CONSOLE_WARN' | 'FETCH_FAIL' | 'CUSTOM'
	message: string
	file?: string
	line?: number
	col?: number
	stack?: string
	clientType?: string
	fileOrRoom?: string
	meta?: Record<string, any>
}

export interface DiagnosticsHealthReport {
	ok: boolean
	status: 'healthy' | 'degraded' | 'critical'
	uptimeSeconds: number
	totalLogsStored: number
	recentErrorCount: number
	activeClients: number
	latestError?: DiagnosticLogEntry
}

const MAX_STORED_LOGS = 500
const logsBuffer: DiagnosticLogEntry[] = []

export function recordDiagnosticLog(entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp'> & { timestamp?: number }): DiagnosticLogEntry {
	const log: DiagnosticLogEntry = {
		id: Math.random().toString(36).substring(2, 10),
		timestamp: entry.timestamp || Date.now(),
		...entry
	}

	logsBuffer.push(log)
	if (logsBuffer.length > MAX_STORED_LOGS) {
		logsBuffer.shift()
	}

	return log
}

export function recordDiagnosticLogsBatch(entries: Array<Omit<DiagnosticLogEntry, 'id' | 'timestamp'>>): number {
	for (const e of entries) {
		recordDiagnosticLog(e)
	}
	return entries.length
}

export function getDiagnosticLogs(options: {
	limit?: number
	level?: string
	type?: string
	fileOrRoom?: string
	since?: number
} = {}): DiagnosticLogEntry[] {
	let filtered = [...logsBuffer]

	if (options.level) {
		const targetLevel = options.level.toLowerCase()
		filtered = filtered.filter((l) => l.level === targetLevel)
	}

	if (options.type) {
		filtered = filtered.filter((l) => l.type === options.type)
	}

	if (options.fileOrRoom) {
		filtered = filtered.filter((l) => l.fileOrRoom?.includes(options.fileOrRoom!))
	}

	if (options.since) {
		filtered = filtered.filter((l) => l.timestamp >= options.since!)
	}

	const limit = Math.min(Math.max(options.limit || 50, 1), MAX_STORED_LOGS)
	return filtered.slice(-limit)
}

export function clearDiagnosticLogs(): void {
	logsBuffer.length = 0
}

export function getDiagnosticsHealth(activeClients = 0): DiagnosticsHealthReport {
	const now = Date.now()
	const fiveMinutesAgo = now - 5 * 60 * 1000
	const recentErrors = logsBuffer.filter((l) => l.level === 'error' && l.timestamp >= fiveMinutesAgo)

	let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
	if (recentErrors.length >= 10) {
		status = 'critical'
	} else if (recentErrors.length > 0) {
		status = 'degraded'
	}

	const latestError = [...logsBuffer].reverse().find((l) => l.level === 'error')

	return {
		ok: status !== 'critical',
		status,
		uptimeSeconds: Math.floor(process.uptime()),
		totalLogsStored: logsBuffer.length,
		recentErrorCount: recentErrors.length,
		activeClients,
		latestError
	}
}
