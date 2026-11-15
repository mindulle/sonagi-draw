import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Enforce host
    port: 5173,
    proxy: {
      '/connect': {
        target: 'http://127.0.0.1:5858',
        ws: true
      },
      '/library': 'http://127.0.0.1:5858',
      '/uploads': 'http://127.0.0.1:5858',
      '/api': 'http://127.0.0.1:5858'
    }
  },
  build: {
    // 벤더를 따로 떼어 두면 앱 코드가 바뀌어도 tldraw 청크는 캐시가 유지된다.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // tldraw 만 따로 뗀다. react/jsx-runtime 을 다른 청크로 쪼개면
          // 순환 의존으로 'Cannot read properties of undefined (reading Fragment)' 가 난다.
          if (id.includes('@tldraw') || id.includes('/tldraw')) return 'tldraw'
          return 'vendor'
        }
      }
    }
  },
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    'process.env.VITE_TLDRAW_LICENSE_KEY': JSON.stringify('tldraw-2026-08-02/WyI3WmxUc1NzTCIsWyIqIl0sMTYsIjIwMjYtMDgtMDIiXQ.t2lUm5RY8pyUf5XykXxWLPv1/MOYscDP0pnxDzW/9iW6p17+3ZcEAY9pMpP8ywDmifABwcV3Ftdn/iqeKsFMng')
  }
})
