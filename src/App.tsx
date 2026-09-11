import { useTheme } from './hooks/useTheme'
import { Navbar } from './components/Navbar'
import { Landing } from './components/Landing'
import { About, Marquee } from './components/About'
import { Research } from './components/Research'
import { EnergyLab } from './components/EnergyLab'
import { Publications } from './components/Publications'
import { Experience } from './components/Experience'
import { Studio } from './components/Studio'
import { ElectronicsArcade } from './components/ElectronicsArcade'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { CyberDog } from './components/CyberDog'
import { ScrollProgress } from './components/ui'

export default function App() {
  const { theme, toggle } = useTheme()
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
      <Navbar theme={theme} onToggleTheme={toggle} />

      <Landing base={base} />

      <main id="content">
        <Marquee />
        <About />
        <Research />
        <EnergyLab />
        <Publications />
        <Experience />
        <Studio />
        <ElectronicsArcade />
        <Contact base={base} />
      </main>

      <Footer />
      <CyberDog />
    </>
  )
}
