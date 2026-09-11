import { courses } from '../data/projects'
import { Reveal, Section, SectionHeading } from './ui'

/**
 * The courses tutored, on their own rather than squeezed into a column of the
 * teaching section. Three courses over four semesters, one card each.
 */
export function Courses() {
  return (
    <Section id="courses" tone="alt">
      <SectionHeading
        index="05"
        kicker="Courses tutored"
        title={
          <>
            Three courses,
            <br className="hidden sm:block" /> four semesters of them.
          </>
        }
        lede="Circuits, electronics and machines, tutored at BRAC University alongside the research."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((c, i) => (
          <Reveal key={c.code} delay={i * 80}>
            <article className="mf-card flex h-full flex-col rounded-xl border border-line bg-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[12px] text-accent" style={{ fontFamily: 'var(--font-tech)' }}>
                  {c.code}
                </span>
                <span className="text-[11px] text-muted" style={{ fontFamily: 'var(--font-tech)' }}>
                  {c.term}
                </span>
              </div>
              <h3 className="mt-2 text-[19px] font-medium leading-snug tracking-[-0.015em] text-ink">
                {c.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{c.detail}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
