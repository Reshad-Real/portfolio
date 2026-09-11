import { marqueeTerms, person, stats } from '../data/site'
import { Counter, Reveal, Section, SectionHeading } from './ui'

const FACTS: [string, string][] = [
  ['Location', person.location],
  ['Field', 'Semiconductor devices · VLSI'],
  ['Tooling', 'Silvaco Atlas · DEVSIM · COMSOL'],
  ['Teaching', '3 courses · 4 semesters'],
  ['Honours', "VC's List x3 · Dean's List x5"],
  ['Status', 'Open to collaboration'],
]

export function Marquee() {
  const run = [...marqueeTerms, ...marqueeTerms]
  return (
    <div
      aria-hidden="true"
      className="relative flex overflow-hidden border-b border-line bg-bg py-3 select-none"
    >
      <div className="mf-marquee-track flex shrink-0 items-center whitespace-nowrap">
        {run.map((term, i) => (
          <span key={`${term}-${i}`} className="flex items-center">
            <span
              className="px-5 text-[12px] uppercase tracking-[0.22em] text-muted"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              {term}
            </span>
            <span className="h-1 w-1 rounded-full bg-accent/60" />
          </span>
        ))}
      </div>
    </div>
  )
}

export function About() {
  return (
    <Section id="about">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <SectionHeading
            index="01"
            kicker="Identity"
            title={
              <>
                I work on the part of the stack
                <br className="hidden sm:block" /> most people never see.
              </>
            }
          />

          <div className="max-w-2xl space-y-6 text-[clamp(15px,1.6vw,18px)] leading-[1.75] text-inksoft">
            <Reveal as="p">
              I am an Electrical and Electronic Engineering graduate of BRAC University, and a
              Research Fellow there now. My research sits between device physics and simulation.
            </Reveal>
            <Reveal as="p" delay={70}>
              At BRAC CREST I model gallium nitride tri-gate devices in Silvaco Atlas, pushing an
              asymmetric-spacer AlGaN/GaN FinFET down to a 5 nm gate and arguing with the
              short-channel effects that show up when you do. Alongside that I work on self-powered
              electronic-skin biosensors, and on digital-twin models for energy storage and EV
              charging.
            </Reveal>
            <Reveal as="p" delay={140}>
              I also teach. Four semesters of tutoring circuits and electronics taught me that the
              fastest way to find the hole in your own understanding is to explain it to someone at
              eight in the morning.
            </Reveal>
          </div>

          <Reveal delay={200}>
            <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {FACTS.map(([k, v]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt
                    className="text-[10px] uppercase tracking-[0.24em] text-muted"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    {k}
                  </dt>
                  <dd className="mt-1 text-[15px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={100}>
            <div className="sticky top-28 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line">
              {stats.map((s) => (
                <div key={s.label} className="bg-bg p-5 sm:p-6">
                  <div className="text-[clamp(30px,4.4vw,46px)] font-medium leading-none tracking-[-0.03em] text-ink">
                    <Counter
                      value={s.value}
                      decimals={'decimals' in s ? (s.decimals as number) : 0}
                    />
                  </div>
                  <div
                    className="mt-3 text-[11px] uppercase leading-snug tracking-[0.16em] text-muted"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
