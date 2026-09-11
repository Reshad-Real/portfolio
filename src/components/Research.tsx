import { interests } from '../data/skills'
import { projects } from '../data/projects'
import { Reveal, Section, SectionHeading, Tag } from './ui'
import { DeviceExplorer } from './DeviceExplorer'

const devices = projects.filter((p) => p.kind === 'device' || p.kind === 'optimisation')

export function Research() {
  return (
    <Section id="labs" tone="alt">
      <SectionHeading
        index="02"
        kicker="Labs · device engineering"
        title={
          <>
            Simulate it until
            <br className="hidden sm:block" /> the physics gives in.
          </>
        }
        lede="Gallium nitride tri-gate devices, modelled in Silvaco Atlas and pushed to a 5 nm gate. Move the geometry below and watch the short-channel effects answer back."
      />

      <Reveal>
        <DeviceExplorer />
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
        {devices.map((p, i) => (
          <Reveal key={p.id} delay={i * 70} className="bg-bg">
            <article className="group h-full p-6 transition-colors duration-300 hover:bg-surface md:p-7">
              <span
                className="text-[10px] uppercase tracking-[0.24em] text-accent"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {p.context}
              </span>
              <h3 className="mt-4 text-[20px] font-medium leading-snug tracking-[-0.02em] text-ink">
                {p.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{p.blurb}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.slice(0, 4).map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {interests.map((group, i) => (
          <Reveal key={group.id} delay={i * 80}>
            <div className="border-t border-linestrong pt-5">
              <h3
                className="text-[11px] uppercase tracking-[0.22em] text-muted"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {group.label}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-baseline gap-3 text-[15px] text-ink">
                    <span className="h-1 w-1 shrink-0 translate-y-[-3px] rounded-full bg-accent" />
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
