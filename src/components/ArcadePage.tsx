import { Suspense, lazy, useState } from 'react'
import { setSfx } from '../lib/audio'
import { Navbar } from './Navbar'
import { Byte } from './Byte'
import { useTheme } from '../hooks/useTheme'
import { person } from '../data/site'

const CircuitRunner = lazy(() => import('./games/CircuitRunner'))
const VoltageDefender = lazy(() => import('./games/VoltageDefender'))
const LogicRush = lazy(() => import('./games/LogicRush'))

type Key = 'runner' | 'defender' | 'logic'

const CABINETS: {
  key: Key
  name: string
  tag: string
  blurb: string
  accent: string
}[] = [
  {
    key: 'runner',
    name: 'Circuit Runner',
    tag: 'reaction · endless',
    blurb: 'Three lanes, rising speed, a multiplier that only survives if you keep collecting.',
    accent: '#3ef0c0',
  },
  {
    key: 'defender',
    name: 'Voltage Defender',
    tag: 'shooter · waves',
    blurb: 'Hold a power rail against spikes and noise. Every fifth wave sends something bigger.',
    accent: '#ffd166',
  },
  {
    key: 'logic',
    name: 'Logic Rush',
    tag: 'speed · boolean',
    blurb: 'Call the output before the clock runs out. The circuit grows as you get it right.',
    accent: '#8ab6ff',
  },
]

export function ArcadePage({ homeHref }: { homeHref: string }) {
  const { theme, toggle } = useTheme()
  const [active, setActive] = useState<Key>('runner')
  const [sound, setSound] = useState(false)

  const cab = CABINETS.find((c) => c.key === active)!

  const toggleSound = () => {
    setSound(setSfx(!sound))
  }

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggle} arcadeHref={homeHref} simple />

      <main className="min-h-[100svh] bg-bg2 pb-24 pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8">
          <header className="mb-8">
            <p
              className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              The arcade
            </p>
            <h1 className="max-w-2xl text-[clamp(30px,5.4vw,54px)] font-medium leading-[1.04] tracking-[-0.03em] text-ink">
              Three cabinets. All of them actually run.
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
              Electronics rules, 1980s manners. Every cabinet keeps its own best score in your
              browser, is playable from the keyboard, and stays silent until you switch the sound on.
            </p>
          </header>

          {/* cabinet picker */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Arcade cabinets">
              {CABINETS.map((c) => {
                const on = c.key === active
                return (
                  <button
                    key={c.key}
                    role="tab"
                    aria-selected={on}
                    aria-controls={`cab-${c.key}`}
                    id={`tab-${c.key}`}
                    type="button"
                    onClick={() => setActive(c.key)}
                    className="rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      fontFamily: 'var(--font-tech)',
                      borderColor: on ? c.accent : 'var(--line)',
                      background: on ? `${c.accent}1f` : 'transparent',
                      color: 'var(--ink)',
                      boxShadow: on ? `0 10px 30px -18px ${c.accent}` : 'none',
                    }}
                  >
                    <span className="block text-[13.5px] uppercase tracking-[0.12em]">{c.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{c.tag}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={sound}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13.5px] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              <span aria-hidden="true">{sound ? '🔊' : '🔈'}</span>
              {sound ? 'Sound on' : 'Sound off'}
            </button>
          </div>

          <p className="mb-4 text-[14px] text-muted">{cab.blurb}</p>

          <div id={`cab-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`}>
            <Suspense
              fallback={
                <div
                  className="grid h-[340px] place-items-center rounded-sm border"
                  style={{ borderColor: `${cab.accent}55`, background: '#05060a' }}
                >
                  <p
                    className="text-[12px] uppercase tracking-[0.24em]"
                    style={{ color: cab.accent, fontFamily: 'var(--font-tech)' }}
                  >
                    loading cabinet
                  </p>
                </div>
              }
            >
              {active === 'runner' && <CircuitRunner sound={sound} />}
              {active === 'defender' && <VoltageDefender sound={sound} />}
              {active === 'logic' && <LogicRush sound={sound} />}
            </Suspense>
          </div>

          <a
            href={homeHref}
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[14px] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
          >
            <span aria-hidden="true">←</span>
            Back to the portfolio
          </a>
        </div>
      </main>

      <footer className="border-t border-line bg-bg px-5 py-8 text-center text-[12.5px] text-muted sm:px-8">
        © {new Date().getFullYear()} {person.name}
      </footer>

      <Byte />
    </>
  )
}
