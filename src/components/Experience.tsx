import type { ReactNode } from 'react'
import { education, honours, references, roles, training } from '../data/experience'
import { skillGroups } from '../data/skills'
import { useInView } from '../hooks/useInView'
import { Counter, Reveal, Section, SectionHeading, Tag } from './ui'
import { RefAvatar } from './art/RefAvatar'

function GradeBar({ score, outOf }: { score: number; outOf: number }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
        style={{ width: inView ? `${(score / outOf) * 100}%` : '0%' }}
      />
    </div>
  )
}

/**
 * One part of the section at a time, full width, with a ruled label above it.
 * This used to be two columns holding six blocks between them, and at any
 * normal reading width that is a wall.
 */
function Block({
  label,
  children,
  delay = 0,
}: {
  label: string
  children: ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="mt-24 first:mt-0">
        <div className="mb-8 flex items-center gap-4">
          <h3
            className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-muted"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {label}
          </h3>
          <span className="mf-rule h-px flex-1 bg-line" />
        </div>
        {children}
      </div>
    </Reveal>
  )
}

export function Experience() {
  return (
    <Section id="teaching">
      <SectionHeading
        index="04"
        kicker="Teaching & experience"
        title={
          <>
            Where the work happens,
            <br className="hidden sm:block" /> and who it happens with.
          </>
        }
        lede="Two research posts, four semesters of tutoring, and one year advising the students who had just arrived."
      />

      <Block label="Roles">
        <ol className="relative max-w-4xl">
          <span aria-hidden="true" className="absolute bottom-3 left-[6px] top-3 w-[2px] bg-line" />
          {roles.map((r, i) => (
            <Reveal as="li" key={r.id} delay={i * 70}>
              <div className="group relative pb-12 pl-9">
                <span
                  aria-hidden="true"
                  className={[
                    'absolute left-0 top-[7px] h-[14px] w-[14px] rounded-full border-2 transition-transform duration-300 group-hover:scale-125',
                    r.current ? 'border-accent bg-accent' : 'border-linestrong bg-bg',
                  ].join(' ')}
                />
                {r.current && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[7px] h-[14px] w-[14px] rounded-full bg-accent/40"
                    style={{ animation: 'mf-ring 2.4s ease-out infinite' }}
                  />
                )}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h4 className="text-[20px] font-medium tracking-[-0.015em] text-ink">{r.title}</h4>
                  <span className="text-[12px] text-muted" style={{ fontFamily: 'var(--font-tech)' }}>
                    {r.period}
                  </span>
                </div>
                <p className="mt-1 text-[14.5px] text-inksoft">{r.org}</p>
                <p className="text-[13px] text-muted">{r.meta}</p>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-baseline gap-3 text-[15px] leading-relaxed text-muted"
                    >
                      <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-linestrong" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </Block>

      <Block label="Industrial training">
        <div className="rounded-xl border border-line bg-surface p-7 md:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-[19px] font-medium text-ink">{training.title}</h4>
            <span className="text-[12px] text-muted" style={{ fontFamily: 'var(--font-tech)' }}>
              {training.org} · {training.period}
            </span>
          </div>
          <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {training.modules.map(([name, detail]) => (
              <div key={name} className="border-t border-line pt-3">
                <dt className="text-[14.5px] font-medium text-ink">{name}</dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed text-muted">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Block>

      <Block label="Education">
        <ul className="grid gap-8 md:grid-cols-3">
          {education.map((d) => (
            <li key={d.title} className="border-t border-line pt-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] text-muted"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    {d.level}
                  </p>
                  <p className="mt-1.5 text-[17px] font-medium leading-snug text-ink">{d.title}</p>
                  <p className="mt-1 text-[13.5px] text-muted">{d.org}</p>
                  <p className="text-[12.5px] text-muted">{d.period}</p>
                </div>
                <p className="shrink-0 text-right text-[28px] font-medium leading-none tracking-tight text-ink">
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
      </Block>

      <Block label="Honours">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-t border-line pt-5">
            <p className="mb-3 text-[15px] text-ink">
              Vice Chancellor&rsquo;s List &times;{honours.vc.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {honours.vc.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
          <div className="border-t border-line pt-5">
            <p className="mb-3 text-[15px] text-ink">Dean&rsquo;s List &times;{honours.dean.length}</p>
            <div className="flex flex-wrap gap-1.5">
              {honours.dean.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        </div>
      </Block>

      <Block label="References">
        <ul className="grid gap-5 md:grid-cols-2">
          {references.map((r, i) => (
            <li
              key={r.email}
              className="mf-card flex items-center gap-5 rounded-xl border border-line bg-bg p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <RefAvatar
                kind={i === 0 ? 'senior' : 'junior'}
                name={r.name}
                className="h-[76px] w-[76px] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-ink">{r.name}</p>
                <p className="text-[13.5px] leading-snug text-muted">
                  {r.role} · {r.org}
                </p>
                <a
                  href={`mailto:${r.email}`}
                  className="mt-1 inline-block break-all text-[13.5px] text-accent underline underline-offset-2 hover:opacity-70"
                >
                  {r.email}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block label="Toolbox">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((g) => (
            <div key={g.id} className="border-t border-line pt-5">
              <p className="mb-4 text-[13.5px] text-inksoft">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line px-2.5 py-1 text-[12.5px] text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>
    </Section>
  )
}
