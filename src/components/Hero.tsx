import { useEffect, useRef, useState } from 'react'
import { HeroScene } from './art/HeroScene'
import { SocialIcon } from './art/SocialIcon'
import { useTypedLines } from '../hooks/useTypedLines'
import { intro, person, typedLines } from '../data/site'

const SOCIALS = [
  { label: 'Google Scholar', href: person.links.scholar, icon: 'scholar' },
  { label: 'GitHub', href: person.links.github, icon: 'github' },
  { label: 'LinkedIn', href: person.links.linkedin, icon: 'linkedin' },
] as const

/** Staggered entrance, expressed as a delay rather than a JavaScript timer. */
const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` })

export function Hero({ base, arcadeHref }: { base: string; arcadeHref: string }) {
  const { text, done } = useTypedLines(typedLines)

  return (
    <section id="home" className="relative overflow-hidden border-b border-line bg-bg2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(70% 60% at 78% 18%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-5 pb-16 pt-24 sm:px-8 md:px-10 lg:grid lg:min-h-[92svh] lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-10 lg:pb-20 lg:pt-28">
        {/* ---------------------------------------------------------- copy */}
        <div className="order-2 max-w-xl lg:order-1">
          <p
            className="mf-in mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted"
            style={{ ...d(0), fontFamily: 'var(--font-tech)' }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {person.title}
          </p>

          <h1
            className="mf-in text-[clamp(36px,6.6vw,68px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink"
            style={d(80)}
          >
            {person.name}
          </h1>

          {/* Two lines of height are reserved, so retyping never shifts the page. */}
          <p
            className="mf-in mt-4 text-[clamp(16px,2.1vw,21px)] leading-[1.45] text-inksoft"
            style={{ ...d(160), fontFamily: 'var(--font-tech)', minHeight: '2.9em' }}
          >
            <span className="text-accent">&gt;</span> {text}
            <span
              className="ml-[2px] inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-accent"
              style={{ animation: done ? 'blink 1s step-end infinite' : 'none' }}
              aria-hidden="true"
            />
          </p>

          <p
            className="mf-in mt-4 max-w-lg text-[clamp(15px,1.7vw,17.5px)] leading-relaxed text-muted"
            style={d(240)}
          >
            {intro}
          </p>

          <div className="mf-in mt-8 flex flex-wrap items-center gap-2.5" style={d(320)}>
            <Pill href="#research" tone="solid">
              Read the research
            </Pill>
            <Pill href="#papers">See the papers</Pill>
            <a
              href={arcadeHref}
              className="mf-arcade inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#3ef0c0] bg-[#3ef0c0]/12 px-4 py-2 text-[13.5px] font-medium text-[#12806a] transition-transform duration-200 hover:-translate-y-0.5 dark:text-[#3ef0c0]"
            >
              <span aria-hidden="true" className="text-[15px]">🕹</span>
              Play the arcade
            </a>
            <Pill href={`${base}${person.cv}`} download>
              Download CV
            </Pill>
            <EmailPill />
          </div>

          <div className="mf-in mt-8 flex flex-wrap items-center gap-2.5" style={d(400)}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`${s.label} (opens in a new tab)`}
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_1px_0_var(--line)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[0_8px_18px_-10px_var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <SocialIcon id={s.icon} />
                {s.label}
                <span
                  aria-hidden="true"
                  className="text-[13px] text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                >
                  ↗
                </span>
              </a>
            ))}
          </div>
          <p className="mf-in mt-4 text-[12.5px] text-muted" style={d(440)}>
            {person.location}
          </p>
        </div>

        {/* -------------------------------------------------- illustration */}
        <div className="mf-in-scale order-1 mx-auto w-full max-w-[520px] lg:order-2 lg:max-w-none" style={d(60)}>
          <div className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(20,18,40,0.55)]">
            <HeroScene className="block w-full" />
          </div>
          <p className="mt-3 text-center text-[12px] text-muted">
            The panels on the wall are the shortcuts. Give one a click.
          </p>
        </div>
      </div>
    </section>
  )
}

function Pill({
  href,
  children,
  tone = 'ghost',
  download,
}: {
  href: string
  children: React.ReactNode
  tone?: 'solid' | 'ghost'
  download?: boolean
}) {
  const solid = tone === 'solid'
  return (
    <a
      href={href}
      {...(download ? { download: true } : {})}
      className={[
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] transition-all duration-200 hover:-translate-y-0.5',
        solid
          ? 'border-accent bg-accent text-white hover:shadow-[0_8px_20px_-8px_var(--accent)]'
          : 'border-line text-ink hover:border-accent hover:text-accent',
      ].join(' ')}
    >
      {children}
    </a>
  )
}

function EmailPill() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(person.email)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = person.email
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }
    setState(ok ? 'copied' : 'failed')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy email address ${person.email}`}
      className="relative inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line px-4 py-2 text-[13.5px] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
    >
      {person.email}
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
        <rect x="0.6" y="0.6" width="7.6" height="7.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <rect x="3.8" y="3.8" width="7.6" height="7.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      </svg>
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-bg transition-all duration-200',
          state === 'idle' ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
        ].join(' ')}
      >
        {state === 'failed' ? 'Press Ctrl+C' : 'Copied'}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Email address copied' : ''}
      </span>
    </button>
  )
}
