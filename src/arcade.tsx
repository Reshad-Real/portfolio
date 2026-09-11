import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ArcadePage } from './components/ArcadePage'

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <ArcadePage homeHref={import.meta.env.BASE_URL} />
    </StrictMode>,
  )
}
