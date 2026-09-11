import { projects } from '../data/projects'
import { Reveal, Section, SectionHeading, Tag } from './ui'

const systems = projects.filter((p) => p.kind === 'systems' || p.kind === 'sensing')

export function EnergyLab() {
  return (
    <Section id="energy">
      <SectionHeading
        index="03"
        kicker="Energy · EV · smart grid"
        title={
          <>
            Models worth trusting when
            <br className="hidden sm:block" /> the real thing is expensive to test.
          </>
        }
        lede="Six Q1 papers sit behind this section: wide-area monitoring, grid-scale storage, charging-opportunity detection, demand anomalies and the economics of wireless charging."
      />

      <div className="grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-2">
        {systems.map((p, i) => (
          <Reveal key={p.id} delay={i * 80} className="bg-bg">
            <article className="h-full p-6 md:p-8">
              <span
                className="text-[10px] uppercase tracking-[0.24em] text-accent"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {p.context}
              </span>
              <h3 className="mt-4 text-[21px] font-medium leading-snug tracking-[-0.02em] text-ink">
                {p.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.blurb}</p>
              <p className="mt-4 text-[14px] leading-relaxed text-inksoft">{p.detail}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
