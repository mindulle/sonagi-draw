import { useEffect, useState } from 'react'

type AuthState = 'checking' | 'anon' | 'authed'

/**
 * 인증 UI.
 *
 * 서버 정책: **읽기는 공개, 쓰기는 인증**.
 * 그래서 앱은 로그인 없이도 열리고(도면 열람 가능), 저장·업로드가 401 을 받으면
 * 이 컴포넌트의 로그인 모달을 띄운다. 로그인에 성공하면 새로고침한다.
 *
 * 바깥(저장 코드)에서 강제로 띄우려면 `window.__drawAuth.openLogin()` 을 호출한다.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>('checking')
	const [open, setOpen] = useState(false)
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const openLogin = () => {
		setError('')
		setOpen(true)
	}

	useEffect(() => {
		;(window as any).__drawAuth = { openLogin, isAuthed: state === 'authed' }
		return () => {
			delete (window as any).__drawAuth
		}
	}, [state])

	useEffect(() => {
		let cancelled = false
		fetch('/api/auth/status')
			.then((res) => res.json())
			.then((data) => {
				if (cancelled) return
				setState(data && data.authenticated ? 'authed' : 'anon')
			})
			.catch(() => {
				if (!cancelled) setState('anon')
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

	return (
		<>
			{children}

			{/* 읽기 전용 안내 + 로그인 진입점 */}
			{state === 'anon' && !open && (
				<button
					onClick={openLogin}
					title="편집하려면 로그인이 필요합니다"
					style={{
						position: 'fixed',
						left: 16,
						bottom: 16,
						zIndex: 999999,
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						background: '#0f172a',
						color: '#e2e8f0',
						border: '1px solid #1f2937',
						borderRadius: 999,
						padding: '8px 14px',
						fontSize: 12,
						fontWeight: 600,
						cursor: 'pointer',
						boxShadow: '0 8px 20px -6px rgba(0,0,0,0.45)'
					}}
				>
					<span>🔒</span>
					<span>읽기 전용 · 로그인</span>
				</button>
			)}

			{open && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 1000000,
						background: 'rgba(2, 6, 23, 0.72)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false)
					}}
				>
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
						<div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>편집하려면 로그인</div>
						<div style={{ color: '#94a3b8', fontSize: 12 }}>보기는 누구나 가능하고, 저장에는 비밀번호가 필요합니다.</div>
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
						<button
							type="button"
							onClick={() => setOpen(false)}
							style={{
								background: 'none',
								border: 'none',
								color: '#64748b',
								fontSize: 12,
								cursor: 'pointer',
								alignSelf: 'flex-end'
							}}
						>
							닫기
						</button>
					</form>
				</div>
			)}
		</>
	)
}

/** 저장/업로드가 401 을 받았을 때 로그인 모달을 띄운다. */
export function requireLogin() {
	const auth = (window as any).__drawAuth
	if (auth && auth.isAuthed) return false
	if (auth) auth.openLogin()
	return true
}
