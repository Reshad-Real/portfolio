import { useState } from 'react'
import { projects } from '../data/projects'
import { interests } from '../data/skills'
import { Reveal, Section, SectionHeading, Tag } from './ui'

/**
 * One research section rather than several. The cards open in place, so the
 * detail is there without a wall of text sitting on the page.
 */
export function Research() {
  const [open, setOpen] = useState<string | null>(projects[0]?.id ?? null)

  return (
    <Section id="research" tone="alt">
      <SectionHeading
        index="02"
        kicker="What I work on"
        title={
          <>
            Simulate it until
            <br className="hidden sm:block" /> the physics gives in.
          </>
        }
        lede="Gallium nitride tri-gate devices in Silvaco Atlas, and a self-powered skin sensor built in both simulation and hardware. Open a card for the detail."
      />

      <div className="grid items-start gap-4 md:grid-cols-2">
        {projects.map((p, i) => {
          const isOpen = open === p.id
          return (
            <Reveal key={p.id} delay={i * 70}>
              <article
                className={[
                  'group h-full overflow-hidden rounded-xl border bg-bg transition-all duration-300',
                  isOpen
                    ? 'border-accent shadow-[0_18px_44px_-26px_var(--accent)]'
                    : 'border-line hover:-translate-y-1 hover:border-linestrong hover:shadow-[0_18px_40px_-28px_rgba(20,18,40,0.45)]',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  aria-expanded={isOpen}
                  aria-controls={`proj-${p.id}`}
                  className="w-full p-6 text-left md:p-7"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className="text-[10px] uppercase tracking-[0.22em] text-accent"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {p.context}
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-[15px] leading-none text-muted transition-transform duration-300 group-hover:border-accent"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                    >
                      +
                    </span>
                  </span>
                  <h3 className="mt-4 text-[20px] font-medium leading-snug tracking-[-0.02em] text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{p.blurb}</p>
                </button>

                <div
                  id={`proj-${p.id}`}
                  hidden={!isOpen}
                  className="border-t border-line px-6 py-5 md:px-7"
                >
                  <p className="text-[14px] leading-relaxed text-inksoft">{p.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.stack.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>

      <Reveal className="mt-20 md:mt-24">
        <div className="mb-8 flex items-center gap-4">
          <h3
            className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-muted"
            style={{ fontFamily: "var(--font-tech)" }}
          >
            Research interests
          </h3>
          <span className="mf-rule h-px flex-1 bg-line" />
        </div>
      </Reveal>

      <div className="grid gap-8 md:grid-cols-3">
        {interests.map((group, i) => (
          <Reveal key={group.id} delay={i * 80}>
            <div className="border-t-2 border-accent/30 pt-5">
              <h3
                className="text-[11px] uppercase tracking-[0.22em] text-muted"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {group.label}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="group flex items-baseline gap-3 text-[15px] text-ink transition-transform duration-200 hover:translate-x-1"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-accent transition-transform duration-200 group-hover:scale-150" />
                    {item}
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
