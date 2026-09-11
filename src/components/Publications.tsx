import { useState } from 'react'
import { ME, publications } from '../data/publications'
import { person } from '../data/site'
import { Reveal, Section, SectionHeading, Tag } from './ui'

export function Publications() {
  const [open, setOpen] = useState<string | null>(publications[0]?.id ?? null)

  return (
    <Section id="papers" tone="alt">
      <SectionHeading
        index="03"
        kicker="Selected publications"
        title={
          <>
            Six Q1 papers,
            <br className="hidden sm:block" /> all peer reviewed.
          </>
        }
        lede="Energy storage, conversion and management, and the smart-grid work around them. Every one links to its DOI."
      />

      <ol className="border-t border-line">
        {publications.map((p, i) => {
          const isOpen = open === p.id
          return (
            <Reveal as="li" key={p.id} delay={i * 45}>
              <div className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    aria-expanded={isOpen}
                    aria-controls={`pub-${p.id}`}
                    className="group flex w-full items-start gap-4 py-6 text-left transition-colors sm:gap-6"
                  >
                    <span
                      className="mt-1 w-6 shrink-0 text-[12px] text-muted tabular-nums"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[clamp(16px,2.1vw,22px)] font-medium leading-snug tracking-[-0.015em] text-ink transition-opacity group-hover:opacity-70">
                        {p.title}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                        <span className="italic">{p.venue}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.year}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.position}</span>
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[18px] leading-none text-muted transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                    >
                      +
                    </span>
                  </button>
                </h3>

                <div
                  id={`pub-${p.id}`}
                  hidden={!isOpen}
                  className="pb-7 pl-10 pr-2 sm:pl-12"
                >
                  <p className="max-w-3xl text-[15px] leading-relaxed text-inksoft">{p.note}</p>

                  <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
                    {p.authors.map((a, ai) => (
                      <span key={a}>
                        <span className={a === ME ? 'font-medium text-ink' : undefined}>{a}</span>
                        {ai < p.authors.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>

                  {p.metrics && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Tag>{p.metrics.quartile}</Tag>
                      <Tag>{p.metrics.percentile}</Tag>
                      <Tag>{p.metrics.impact}</Tag>
                      <Tag>{p.metrics.citeScore}</Tag>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>

                  {p.doi && (
                    <a
                      href={`https://doi.org/${p.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-[13px] text-accent underline underline-offset-4 hover:opacity-70"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {p.doi}
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          )
        })}
      </ol>

      <Reveal delay={120}>
        <a
          href={person.links.scholar}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-3 border-b border-ink pb-1 text-[15px] text-ink transition-opacity hover:opacity-60"
        >
          Full record on Google Scholar
          <span aria-hidden="true">↗</span>
        </a>
      </Reveal>
    </Section>
  )
}
