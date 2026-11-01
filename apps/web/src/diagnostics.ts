export interface ClientDiagnosticEntry {
	timestamp: number
	level: 'error' | 'warn' | 'info'
	type: 'WINDOW_ERROR' | 'UNHANDLED_REJECTION' | 'CONSOLE_ERROR' | 'CONSOLE_WARN' | 'FETCH_FAIL' | 'CUSTOM'
	message: string
	file?: string
	line?: number
	col?: number
	stack?: string
	url?: string
	status?: number
	fileOrRoom?: string
	clientType: 'web' | 'discord-activity' | 'obsidian'
}

const MAX_LOCAL_BUFFER = 100
export const clientDiagnosticsBuffer: ClientDiagnosticEntry[] = []
let pendingFlushLogs: ClientDiagnosticEntry[] = []
let flushTimer: any = null
let isInitialized = false

export function getClientType(): 'web' | 'discord-activity' | 'obsidian' {
	if (typeof window === 'undefined') return 'web'
	if (
		window.location.origin.includes('discordsays.com') ||
		window.location.pathname.startsWith('/draw') ||
		(window as any).__DISCORD_SDK__
	) {
		return 'discord-activity'
	}
	if ((window as any).app?.vault || navigator.userAgent.includes('Obsidian')) {
		return 'obsidian'
	}
	return 'web'
}

export function getCurrentFileOrRoom(): string {
	if (typeof window === 'undefined') return ''
	const params = new URLSearchParams(window.location.search)
	return params.get('file') || params.get('room') || ''
}

export function recordClientDiagnostic(
	entry: Omit<ClientDiagnosticEntry, 'timestamp' | 'clientType' | 'fileOrRoom'> & {
		timestamp?: number
		clientType?: 'web' | 'discord-activity' | 'obsidian'
		fileOrRoom?: string
	}
): ClientDiagnosticEntry {
	const log: ClientDiagnosticEntry = {
		timestamp: entry.timestamp || Date.now(),
		clientType: entry.clientType || getClientType(),
		fileOrRoom: entry.fileOrRoom || getCurrentFileOrRoom(),
		...entry
	}

	clientDiagnosticsBuffer.push(log)
	if (clientDiagnosticsBuffer.length > MAX_LOCAL_BUFFER) {
		clientDiagnosticsBuffer.shift()
	}

	pendingFlushLogs.push(log)
	scheduleFlush()

	return log
}

function scheduleFlush() {
	if (typeof window === 'undefined') return
	if (flushTimer) return

	flushTimer = setTimeout(() => {
		flushTimer = null
		if (pendingFlushLogs.length === 0) return

		const toSend = [...pendingFlushLogs]
		pendingFlushLogs = []

		fetch('/api/bridge/logs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(toSend)
		}).catch(() => {
			// If bridge is temporarily unreachable, re-queue at most 50 items
			pendingFlushLogs = [...toSend.slice(-50), ...pendingFlushLogs]
		})
	}, 1500)
}

export function initClientDiagnostics(): void {
	if (isInitialized || typeof window === 'undefined') return
	isInitialized = true

	// 1. Unhandled Window Errors
	window.addEventListener('error', (event) => {
		recordClientDiagnostic({
			level: 'error',
			type: 'WINDOW_ERROR',
			message: event.message || 'Unknown window error',
			file: event.filename,
			line: event.lineno,
			col: event.colno,
			stack: event.error?.stack
		})
	})

	// 2. Unhandled Promise Rejections
	window.addEventListener('unhandledrejection', (event) => {
		const reason = event.reason
		recordClientDiagnostic({
			level: 'error',
			type: 'UNHANDLED_REJECTION',
			message: reason?.message || String(reason || 'Unhandled Promise rejection'),
			stack: reason?.stack
		})
	})

	// 3. Intercept console.error & console.warn
	const origError = console.error
	console.error = function (...args: any[]) {
		origError.apply(console, args)
		try {
			const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
			recordClientDiagnostic({
				level: 'error',
				type: 'CONSOLE_ERROR',
				message: msg,
				stack: new Error().stack
			})
		} catch (_) {}
	}

	const origWarn = console.warn
	console.warn = function (...args: any[]) {
		origWarn.apply(console, args)
		try {
			const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
			recordClientDiagnostic({
				level: 'warn',
				type: 'CONSOLE_WARN',
				message: msg
			})
		} catch (_) {}
	}

	// 4. Intercept network fetch failures
	const origFetch = window.fetch
	window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
		try {
			const res = await origFetch.apply(this, [input, init])
			if (!res.ok && res.status >= 400 && !url.includes('/api/bridge/logs')) {
				recordClientDiagnostic({
					level: res.status >= 500 ? 'error' : 'warn',
					type: 'FETCH_FAIL',
					message: `HTTP ${res.status} ${res.statusText} on ${url}`,
					url,
					status: res.status
				})
			}
			return res
		} catch (err: any) {
			if (!url.includes('/api/bridge/logs')) {
				recordClientDiagnostic({
					level: 'error',
					type: 'FETCH_FAIL',
					message: `Fetch exception: ${err?.message || err} on ${url}`,
					url
				})
			}
			throw err
		}
	}

	// 5. Expose inspection helper on window
	;(window as any).__GET_DIAGNOSTICS_REPORT__ = () => ({
		clientType: getClientType(),
		fileOrRoom: getCurrentFileOrRoom(),
		totalStored: clientDiagnosticsBuffer.length,
		recentLogs: [...clientDiagnosticsBuffer].reverse()
	})
}
