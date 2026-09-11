import { useTheme } from './hooks/useTheme'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { About, Marquee } from './components/About'
import { Research } from './components/Research'
import { Publications } from './components/Publications'
import { Experience } from './components/Experience'
import { ArcadeTeaser } from './components/ArcadeTeaser'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Byte } from './components/Byte'
import { ScrollProgress } from './components/ui'

export default function App() {
  const { theme, toggle } = useTheme()
  const base = import.meta.env.BASE_URL
  const arcadeHref = `${base}arcade.html`

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>

      <ScrollProgress />
      <Navbar theme={theme} onToggleTheme={toggle} arcadeHref={arcadeHref} />

      <Hero base={base} arcadeHref={arcadeHref} />

      <main id="content">
        <Marquee />
        <About />
        <Research />
        <Publications />
        <Experience />
        <ArcadeTeaser href={arcadeHref} />
        <Contact base={base} />
      </main>

      <Footer arcadeHref={arcadeHref} />
      <Byte />
    </>
  )
}
