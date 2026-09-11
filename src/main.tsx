import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const container = document.getElementById('root')

async function start() {
  if (!container) return
  const root = createRoot(container)

  // Development-only model inspector, so every 3D part can be checked on its
  // own before it reaches the page. The dynamic import keeps it out of the
  // production bundle entirely.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('inspect')) {
    const { ModelInspector } = await import('./components/ModelInspector')
    root.render(
      <StrictMode>
        <ModelInspector />
      </StrictMode>,
    )
    return
  }

  const { default: App } = await import('./App')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
