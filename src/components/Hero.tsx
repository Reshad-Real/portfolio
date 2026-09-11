import { useEffect, useRef, useState } from 'react'
import { useTypewriter } from '../hooks/useTypewriter'
import { brand, heroCopy, person } from '../data/site'
import type { Phase } from './HeroChamber'

const PILLS = [
  { label: 'Pitch us an idea', href: '#contact' },
  { label: 'Come work here', href: '#openings' },
  { label: 'Send a brief hello', href: `mailto:${person.email}` },
  { label: 'See how we operate', href: '#studio' },
] as const

export function Hero({ phase }: { phase: Phase }) {
  const revealed = phase !== 'boot'
  const { displayed, done } = useTypewriter(revealed ? heroCopy.typewriter : '', 38, 600)

  // The action pills arrive on their own 400 ms timer, never waiting for the
  // typewriter to finish.
  const [pillsIn, setPillsIn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setPillsIn(true), 400)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div
      className={[
        'absolute inset-0 z-10 flex flex-col overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0',
        'justify-end transition-opacity duration-700 ease-out',
        revealed ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <div className="relative z-10 max-w-xl">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.3em] text-white/50"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          {person.name} — {person.role}
        </p>

        <p
          className="pointer-events-none mb-5 select-none sm:mb-6"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.3,
            fontWeight: 400,
            color: '#fff',
            filter: 'blur(4px)',
          }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: heroCopy.intro }}
        />
        {/* The blurred line is decorative; this carries it to assistive tech. */}
        <span className="sr-only">
          Hey there, meet {brand.agent}, {brand.name}&rsquo;s {brand.agentExpanded}
        </span>

        <p
          className="mb-5 text-white sm:mb-6"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.35,
            fontWeight: 400,
            minHeight: '54px',
          }}
        >
          {displayed}
          {!done && <span className="mf-cursor" aria-hidden="true" />}
        </p>

        <div
          className="flex flex-wrap gap-y-1"
          style={{
            opacity: pillsIn ? 1 : 0,
            transform: pillsIn ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {PILLS.map((p) => (
            <a
              key={p.label}
              href={p.href}
              className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]"
            >
              {p.label}
            </a>
          ))}
          <EmailPill />
        </div>
      </div>

      <ScrollCue show={revealed} />
    </div>
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
        await navigator.clipboard.writeText(brand.studioEmail)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) {
      // Older browsers, and any page not treated as a secure context.
      try {
        const ta = document.createElement('textarea')
        ta.value = brand.studioEmail
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
      aria-label={`Copy email address ${brand.studioEmail}`}
      className="relative mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]"
    >
      <span>
        Reach us: <span className="underline underline-offset-1">{brand.studioEmail}</span>
      </span>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
        <rect
          x="0.6"
          y="0.6"
          width="7.6"
          height="7.6"
          rx="1.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <rect
          x="3.8"
          y="3.8"
          width="7.6"
          height="7.6"
          rx="1.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
      {/* Absolutely positioned so the confirmation never reflows the row. */}
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[11px] text-black transition-all duration-200',
          state === 'idle' ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
        ].join(' ')}
      >
        {state === 'failed' ? 'Press Ctrl+C' : 'Copied!'}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Email address copied' : state === 'failed' ? 'Copy unavailable' : ''}
      </span>
    </button>
  )
}

function ScrollCue({ show }: { show: boolean }) {
  return (
    <a
      href="#about"
      className={[
        'absolute bottom-5 left-5 z-10 hidden items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/45 transition-opacity duration-700 hover:text-white md:flex md:left-10',
        show ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{ fontFamily: 'var(--font-tech)' }}
    >
      scroll
      <span className="relative block h-8 w-px overflow-hidden bg-white/20">
        <span
          className="absolute inset-x-0 top-0 h-3 bg-white"
          style={{ animation: 'mf-sweep 2.4s ease-in-out infinite' }}
        />
      </span>
    </a>
  )
}
