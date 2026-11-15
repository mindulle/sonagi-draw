import { useEffect, useState } from 'react'

/**
 * API 인증 게이트.
 * - /api/auth/status 로 인증 여부 확인
 * - 미인증이면 비밀번호 입력 화면을 보여주고, /api/auth 로 로그인 후 새로고침
 * - 로컬(에이전트)에서는 서버가 이미 통과시키므로 authenticated=true 로 바로 진입
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<'checking' | 'login' | 'ready'>('checking')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		let cancelled = false
		fetch('/api/auth/status')
			.then((res) => res.json())
			.then((data) => {
				if (cancelled) return
				setState(data && data.authenticated ? 'ready' : 'login')
			})
			.catch(() => {
				if (!cancelled) setState('login')
			})
		return () => {
			cancelled = true
		}
	}, [])

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (submitting) return
		setSubmitting(true)
		setError('')
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			})
			if (res.ok) {
				window.location.reload()
				return
			}
			setError(res.status === 503 ? '서버에 인증이 설정되지 않았습니다.' : '비밀번호가 올바르지 않습니다.')
		} catch {
			setError('로그인 요청에 실패했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	if (state === 'ready') return <>{children}</>

	if (state === 'checking') {
		return (
			<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontSize: 13 }}>
				확인 중…
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
			<form
				onSubmit={submit}
				style={{
					background: '#111827',
					border: '1px solid #1f2937',
					borderRadius: 14,
					padding: 28,
					width: '100%',
					maxWidth: 360,
					display: 'flex',
					flexDirection: 'column',
					gap: 12
				}}
			>
				<div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>Sonagi Draw</div>
				<div style={{ color: '#94a3b8', fontSize: 12 }}>비밀번호를 입력하세요.</div>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoFocus
					placeholder="password"
					style={{
						background: '#0b1220',
						border: '1px solid #1f2937',
						borderRadius: 8,
						padding: '10px 12px',
						color: '#f8fafc',
						fontSize: 14,
						outline: 'none'
					}}
				/>
				<button
					type="submit"
					disabled={submitting}
					style={{
						background: '#2563eb',
						border: 'none',
						borderRadius: 8,
						padding: '10px 12px',
						color: '#fff',
						fontWeight: 600,
						cursor: submitting ? 'default' : 'pointer',
						opacity: submitting ? 0.7 : 1
					}}
				>
					{submitting ? '확인 중…' : '들어가기'}
				</button>
				{error ? <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div> : null}
			</form>
		</div>
	)
}
