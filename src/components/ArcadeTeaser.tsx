import { Reveal, Section } from './ui'

const CABS = [
  { name: 'Circuit Runner', tag: 'reaction · endless', accent: '#3ef0c0' },
  { name: 'Voltage Defender', tag: 'shooter · waves', accent: '#ffd166' },
  { name: 'Logic Rush', tag: 'speed · boolean', accent: '#8ab6ff' },
]

/** A door to the arcade, which lives on its own page. */
export function ArcadeTeaser({ href }: { href: string }) {
  return (
    <Section id="arcade" tone="alt">
      <Reveal>
        <a
          href={href}
          className="group relative block overflow-hidden rounded-2xl border border-line bg-[#05060a] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent sm:p-12"
        >
          {/* scanlines, because it is an arcade */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)',
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(60% 80% at 50% 50%, rgba(62,240,192,0.12), transparent)',
            }}
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-[#3ef0c0]"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3ef0c0]" />
                Its own page
              </p>
              <h2
                className="text-[clamp(28px,5vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.02em] text-white"
                style={{ fontFamily: 'var(--font-tech)', textShadow: '0 0 28px rgba(62,240,192,0.35)' }}
              >
                The arcade
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
                Three electronics games, built the same way as the rest of this site. Scores,
                multipliers, bosses and a clock that does not care about you.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#3ef0c0] px-5 py-2.5 text-[14px] text-[#3ef0c0] transition-colors group-hover:bg-[#3ef0c0] group-hover:text-[#05060a]">
                Insert coin
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>

            <ul className="flex shrink-0 flex-col gap-2.5">
              {CABS.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-transform duration-300"
                  style={{
                    borderColor: `${c.accent}44`,
                    background: `${c.accent}0f`,
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.accent, animation: `mf-pulse ${1.6 + i * 0.4}s ease-in-out infinite` }}
                  />
                  <span style={{ fontFamily: 'var(--font-tech)' }}>
                    <span className="block text-[13px] uppercase tracking-[0.1em] text-white">
                      {c.name}
                    </span>
                    <span className="block text-[11px] text-white/45">{c.tag}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </a>
      </Reveal>
    </Section>
  )
}
