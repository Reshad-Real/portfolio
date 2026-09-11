import { useEffect, useRef, useState } from 'react'
import { HeroScene } from './art/HeroScene'
import { useTypedLines } from '../hooks/useTypedLines'
import { intro, person, typedLines } from '../data/site'

const SOCIALS = [
  { label: 'Google Scholar', href: person.links.scholar, glyph: 'GS' },
  { label: 'GitHub', href: person.links.github, glyph: 'GH' },
  { label: 'LinkedIn', href: person.links.linkedin, glyph: 'in' },
] as const

export function Hero({ base, arcadeHref }: { base: string; arcadeHref: string }) {
  const { text, done } = useTypedLines(typedLines)
  const [in1, setIn1] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setIn1(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  const rise = (delay: number) => ({
    opacity: in1 ? 1 : 0,
    transform: in1 ? 'none' : 'translateY(14px)',
    transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
  })

  return (
    <section id="home" className="relative overflow-hidden border-b border-line bg-bg2">
      {/* a soft wash so the illustration and the page share a light */}
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
            className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-muted"
            style={{ ...rise(0), fontFamily: 'var(--font-tech)' }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {person.title}
          </p>

          <h1
            className="text-[clamp(36px,6.6vw,68px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink"
            style={rise(60)}
          >
            {person.name}
          </h1>

          {/* the line that keeps typing itself */}
          <p
            className="mt-4 min-h-[58px] text-[clamp(17px,2.3vw,23px)] leading-snug text-inksoft sm:min-h-[34px]"
            style={{ ...rise(120), fontFamily: 'var(--font-tech)' }}
          >
            <span className="text-accent">&gt;</span> {text}
            <span
              className="ml-[2px] inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-accent"
              style={{ animation: done ? 'blink 1s step-end infinite' : 'none' }}
              aria-hidden="true"
            />
          </p>

          <p className="mt-5 max-w-lg text-[clamp(15px,1.7vw,17.5px)] leading-relaxed text-muted" style={rise(180)}>
            {intro}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5" style={rise(240)}>
            <Pill href="#research" tone="solid">
              Read the research
            </Pill>
            <Pill href="#papers">See the papers</Pill>
            <Pill href={arcadeHref}>Play the arcade</Pill>
            <Pill href={`${base}${person.cv}`} download>
              Download CV
            </Pill>
            <EmailPill />
          </div>

          <div className="mt-8 flex items-center gap-2.5" style={rise(300)}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-[11px] font-medium text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                {s.glyph}
              </a>
            ))}
            <span className="ml-1 text-[12.5px] text-muted">{person.location}</span>
          </div>
        </div>

        {/* -------------------------------------------------- illustration */}
        <div
          className="order-1 lg:order-2"
          style={{
            opacity: in1 ? 1 : 0,
            transform: in1 ? 'none' : 'scale(0.97)',
            transition: 'opacity .8s ease 60ms, transform .8s cubic-bezier(.2,.7,.2,1) 60ms',
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(20,18,40,0.55)]">
            <HeroScene className="block w-full" />
          </div>
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
