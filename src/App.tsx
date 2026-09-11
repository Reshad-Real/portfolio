import { useCallback, useEffect, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { Navbar } from './components/Navbar'
import { HeroChamber, type Phase } from './components/HeroChamber'
import { About, Marquee } from './components/About'
import { Research } from './components/Research'
import { EnergyLab } from './components/EnergyLab'
import { Publications } from './components/Publications'
import { SignalLab } from './components/SignalLab'
import { Experience } from './components/Experience'
import { Studio } from './components/Studio'
import { ElectronicsArcade } from './components/ElectronicsArcade'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { CyberDog } from './components/CyberDog'
import { ScrollProgress } from './components/ui'

const SEEN_KEY = 'mf-entered'

export default function App() {
  const { theme, toggle } = useTheme()

  // The full startup runs once per browser tab; a reload inside the same
  // session drops straight into the portfolio.
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1' ? 'live' : 'boot'
    } catch {
      return 'boot'
    }
  })

  // The startup owns the viewport until the visitor enters.
  useEffect(() => {
    document.body.dataset.locked = phase === 'boot' ? 'true' : 'false'
    return () => {
      document.body.dataset.locked = 'false'
    }
  }, [phase])

  const onEnter = useCallback(() => {
    setPhase((p) => (p === 'boot' ? 'entering' : p))
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const onLive = useCallback(() => {
    window.scrollTo(0, 0)
    setPhase('live')
  }, [])

  const base = import.meta.env.BASE_URL

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>

      <ScrollProgress />
      <Navbar phase={phase} theme={theme} onToggleTheme={toggle} />

      <HeroChamber phase={phase} onEnter={onEnter} onLive={onLive} />

      <main id="content">
        <Marquee />
        <About />
        <Research />
        <EnergyLab />
        <Publications />
        <SignalLab />
        <Experience />
        <Studio />
        <ElectronicsArcade />
        <Contact base={base} />
      </main>

      <Footer />
      {phase === 'live' && <CyberDog />}
    </>
  )
}
