import { Suspense, lazy, useState } from 'react'
import { disableAudio, enableAudio } from '../lib/audio'
import { Reveal, Section, SectionHeading } from './ui'

const CircuitRunner = lazy(() => import('./games/CircuitRunner'))
const VoltageDefender = lazy(() => import('./games/VoltageDefender'))
const LogicLab = lazy(() => import('./games/LogicLab'))

type GameKey = 'runner' | 'defender' | 'logic'

const CABINETS: { key: GameKey; name: string; tag: string; accent: string }[] = [
  { key: 'runner', name: 'Circuit Runner', tag: 'reaction · lanes', accent: '#3ef0c0' },
  { key: 'defender', name: 'Voltage Defender', tag: 'shooter · waves', accent: '#ffd166' },
  { key: 'logic', name: 'Logic Lab', tag: 'puzzle · boolean', accent: '#8ab6ff' },
]

export function ElectronicsArcade() {
  const [active, setActive] = useState<GameKey>('runner')
  const [sound, setSound] = useState(false)

  const toggleSound = () => {
    if (sound) {
      disableAudio()
      setSound(false)
    } else {
      setSound(enableAudio())
    }
  }

  const accent = CABINETS.find((c) => c.key === active)!.accent

  return (
    <Section id="arcade" tone="alt">
      <SectionHeading
        index="08"
        kicker="The electronics arcade"
        title={
          <>
            Three cabinets.
            <br className="hidden sm:block" /> All of them actually run.
          </>
        }
        lede="A deliberate break from the rest of the site. Electronics rules, 1980s manners, real scoring and a personal best kept in your browser."
      />

      <Reveal>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Arcade cabinets"
          >
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
                  className="rounded-sm border px-4 py-2 text-left transition-colors"
                  style={{
                    fontFamily: 'var(--font-tech)',
                    borderColor: on ? c.accent : 'var(--line)',
                    background: on ? c.accent : 'transparent',
                    color: on ? '#05060a' : 'var(--ink)',
                  }}
                >
                  <span className="block text-[13px] uppercase tracking-[0.14em]">{c.name}</span>
                  <span className="block text-[11px] opacity-70">{c.tag}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] text-ink transition-colors hover:bg-ink hover:text-bg"
          >
            <span aria-hidden="true">{sound ? '🔊' : '🔈'}</span>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div
          id={`cab-${active}`}
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          className="mx-auto max-w-4xl"
        >
          <Suspense
            fallback={
              <div
                className="grid h-[320px] place-items-center rounded-sm border"
                style={{ borderColor: `${accent}55`, background: '#05060a' }}
              >
                <p
                  className="text-[12px] uppercase tracking-[0.24em]"
                  style={{ color: accent, fontFamily: 'var(--font-tech)' }}
                >
                  loading cabinet
                  <span className="mf-cursor ml-1 align-baseline" style={{ background: accent }} />
                </p>
              </div>
            }
          >
            {active === 'runner' && <CircuitRunner sound={sound} />}
            {active === 'defender' && <VoltageDefender sound={sound} />}
            {active === 'logic' && <LogicLab sound={sound} />}
          </Suspense>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-5 max-w-4xl text-[12.5px] leading-relaxed text-muted">
          Every cabinet is keyboard playable, keeps its own best score in local storage, and stays
          silent until you switch the sound on.
        </p>
      </Reveal>
    </Section>
  )
}
