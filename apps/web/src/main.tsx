import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: "https://4b69a39699591b04328705f819ed1bb3@o4504455820869632.ingest.us.sentry.io/4511766347120640",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // 민감 정보 화면 녹화 시 별표(*) 처리
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1, // 성능 트레이싱 10%
  replaysSessionSampleRate: 0.0, // 평상시 녹화 비율
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 화면 녹화 첨부!
  
  beforeSend(event, hint) {
    // 1. ResizeObserver 같은 무시해도 되는 UI 스팸 에러 필터링
    const error = hint.originalException as Error;
    if (error && error.message) {
      if (error.message.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    return event;
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	
		<App />
	
)
