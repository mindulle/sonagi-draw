import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
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
      '/uploads': 'http://127.0.0.1:5858'
    }
  },
  define: {
    'process.env.VITE_TLDRAW_LICENSE_KEY': JSON.stringify('tldraw-2026-08-02/WyI3WmxUc1NzTCIsWyIqIl0sMTYsIjIwMjYtMDgtMDIiXQ.t2lUm5RY8pyUf5XykXxWLPv1/MOYscDP0pnxDzW/9iW6p17+3ZcEAY9pMpP8ywDmifABwcV3Ftdn/iqeKsFMng')
  }
})
