import { useState } from 'react'
import { capabilities, skillGroups } from '../data/skills'
import { Reveal, Section, SectionHeading } from './ui'

export function Studio() {
  const [hover, setHover] = useState<string | null>(null)

  return (
    <Section id="studio" tone="alt">
      <SectionHeading
        index="06"
        kicker="Studio · how we operate"
        title={
          <>
            Four steps, in order,
            <br className="hidden sm:block" /> every single time.
          </>
        }
        lede="Nothing gets fabricated before it has been meshed, biased and pushed until it stops converging."
      />

      <div className="border-t border-line">
        {capabilities.map((c, i) => (
          <Reveal key={c.id} delay={i * 60}>
            <article
              onMouseEnter={() => setHover(c.id)}
              onMouseLeave={() => setHover(null)}
              className="group relative grid grid-cols-1 gap-4 border-b border-line py-8 transition-colors duration-300 md:grid-cols-12 md:gap-8 md:py-10"
            >
              {/* a rule that draws itself across the row on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-transform duration-500"
                style={{ transform: hover === c.id ? 'scaleX(1)' : 'scaleX(0)' }}
              />
              <div className="md:col-span-2">
                <span
                  className="text-[13px] text-accent"
                  style={{ fontFamily: 'var(--font-tech)' }}
                >
                  {c.n}
                </span>
              </div>
              <h3 className="text-[clamp(20px,2.6vw,30px)] font-medium leading-tight tracking-[-0.02em] text-ink md:col-span-4">
                {c.title}
              </h3>
              <div className="md:col-span-6">
                <p className="max-w-xl text-[15px] leading-relaxed text-muted">{c.body}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12px] text-muted"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {skillGroups.map((g, i) => (
          <Reveal key={g.id} delay={i * 70}>
            <div>
              <h3
                className="mb-4 border-t border-linestrong pt-4 text-[11px] uppercase tracking-[0.22em] text-muted"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {g.label}
              </h3>
              <ul className="space-y-2.5">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="group flex items-center justify-between text-[15px] text-ink"
                  >
                    <span>{item}</span>
                    <span
                      aria-hidden="true"
                      className="h-px w-6 origin-right scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
