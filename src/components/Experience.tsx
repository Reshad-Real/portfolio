import { education, honours, references, roles, training } from '../data/experience'
import { courses } from '../data/projects'
import { useInView } from '../hooks/useInView'
import { Counter, Reveal, Section, SectionHeading, Tag } from './ui'

function GradeBar({ score, outOf }: { score: number; outOf: number }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="mt-4 h-[3px] w-full bg-line">
      <div
        className="h-full bg-accent transition-[width] duration-1000 ease-out"
        style={{ width: inView ? `${(score / outOf) * 100}%` : '0%' }}
      />
    </div>
  )
}

export function Experience() {
  return (
    <Section id="openings">
      <SectionHeading
        index="05"
        kicker="Openings · experience & teaching"
        title={
          <>
            Where the work happens,
            <br className="hidden sm:block" /> and who it happens with.
          </>
        }
        lede="Two research posts, four semesters of tutoring, three courses, and one year advising the students who had just arrived."
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ol className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-3 left-[5px] top-3 w-px bg-line"
            />
            {roles.map((r, i) => (
              <Reveal as="li" key={r.id} delay={i * 70}>
                <div className="relative pb-10 pl-8">
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute left-0 top-[7px] h-[11px] w-[11px] rounded-full border-2',
                      r.current ? 'border-accent bg-accent' : 'border-linestrong bg-bg',
                    ].join(' ')}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[19px] font-medium tracking-[-0.015em] text-ink">
                      {r.title}
                    </h3>
                    <span
                      className="text-[12px] text-muted"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {r.period}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-inksoft">{r.org}</p>
                  <p className="text-[13px] text-muted">{r.meta}</p>
                  <ul className="mt-4 space-y-2">
                    {r.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-baseline gap-3 text-[14.5px] leading-relaxed text-muted"
                      >
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-linestrong" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={100}>
            <div className="mt-4 rounded-sm border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[17px] font-medium text-ink">{training.title}</h3>
                <span
                  className="text-[12px] text-muted"
                  style={{ fontFamily: 'var(--font-tech)' }}
                >
                  {training.org} · {training.period}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {training.modules.map(([name, detail]) => (
                  <div key={name} className="border-t border-line pt-3">
                    <dt className="text-[14px] font-medium text-ink">{name}</dt>
                    <dd className="mt-1 text-[13.5px] leading-relaxed text-muted">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal>
            <h3
              className="mb-5 text-[11px] uppercase tracking-[0.24em] text-muted"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              Courses tutored
            </h3>
            <ul className="space-y-px overflow-hidden rounded-sm border border-line bg-line">
              {courses.map((c) => (
                <li key={c.code} className="bg-bg p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] text-accent"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {c.code}
                    </span>
                    <span
                      className="text-[11px] text-muted"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {c.term}
                    </span>
                  </div>
                  <p className="mt-1 text-[16px] font-medium text-ink">{c.title}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <h3
              className="mb-5 mt-12 text-[11px] uppercase tracking-[0.24em] text-muted"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              Education
            </h3>
            <ul className="space-y-5">
              {education.map((d) => (
                <li key={d.title} className="border-t border-line pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.2em] text-muted"
                        style={{ fontFamily: 'var(--font-tech)' }}
                      >
                        {d.level}
                      </p>
                      <p className="mt-1 text-[16px] font-medium leading-snug text-ink">
                        {d.title}
                      </p>
                      <p className="text-[13px] text-muted">{d.org}</p>
                      <p className="text-[12px] text-muted">{d.period}</p>
                    </div>
                    <p className="shrink-0 text-right text-[26px] font-medium leading-none tracking-tight text-ink">
                      <Counter value={d.score} decimals={2} />
                      <span className="block text-[11px] font-normal text-muted">
                        {d.note} / {d.outOf.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <GradeBar score={d.score} outOf={d.outOf} />
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-12 border-t border-line pt-5">
              <h3
                className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                Honours
              </h3>
              <p className="mb-2 text-[14px] text-ink">
                Vice Chancellor&rsquo;s List &times;{honours.vc.length}
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {honours.vc.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <p className="mb-2 text-[14px] text-ink">
                Dean&rsquo;s List &times;{honours.dean.length}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {honours.dean.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-12 border-t border-line pt-5">
              <h3
                className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                References
              </h3>
              <ul className="space-y-4">
                {references.map((r) => (
                  <li key={r.email}>
                    <p className="text-[15px] font-medium text-ink">{r.name}</p>
                    <p className="text-[13px] text-muted">
                      {r.role} · {r.org}
                    </p>
                    <a
                      href={`mailto:${r.email}`}
                      className="text-[13px] text-accent underline underline-offset-2 hover:opacity-70"
                    >
                      {r.email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
