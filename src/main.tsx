import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const container = document.getElementById('root')

async function start() {
  if (!container) return
  const root = createRoot(container)

  // Development-only art inspector, behind a dynamic import so it never
  // reaches the bundle.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('inspect')) {
    const { ArtInspector } = await import('./components/ArtInspector')
    root.render(
      <StrictMode>
        <ArtInspector />
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
