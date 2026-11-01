import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DiscordSDK } from '@discord/embedded-app-sdk'
import { initClientDiagnostics } from './diagnostics'

initClientDiagnostics()

async function init() {
  const params = new URLSearchParams(window.location.search)
  const isDiscord = !!params.get('instance_id') || !!params.get('frame_id')

  if (isDiscord) {
    try {
      const discordSdk = new DiscordSDK("1436611660713300048")
      await Promise.race([
        discordSdk.ready(),
        new Promise(resolve => setTimeout(resolve, 2500))
      ])
      ;(window as any).__DISCORD_SDK__ = discordSdk
      console.log("[Sonagi Activity] Discord SDK native ready() handshake complete!")
    } catch (err) {
      console.error("[Sonagi Activity] Discord SDK ready() catch:", err)
    }
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <App />
  )
}

init()
