import { useEffect, useRef, useState } from 'react'
import { person } from '../data/site'
import { Magnetic, Reveal, Section, SectionHeading } from './ui'
import { SocialIcon } from './art/SocialIcon'

const LINKS = [
  { label: 'Google Scholar', value: 'Publication record', href: person.links.scholar, icon: 'scholar' },
  { label: 'LinkedIn', value: 'md-reshad-al-muttaki', href: person.links.linkedin, icon: 'linkedin' },
  { label: 'GitHub', value: 'Reshad-Real', href: person.links.github, icon: 'github' },
] as const

export function Contact({ base }: { base: string }) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(person.email)
        ok = true
      }
    } catch {
      ok = false
    }
    setCopied(ok ? 'ok' : 'fail')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied('idle'), 2000)
  }

  return (
    <Section id="contact">
      <SectionHeading
        index="05"
        motif="mug"
        kicker="Contact"
        title={
          <>
            Got a device
            <br className="hidden sm:block" /> that will not behave?
          </>
        }
        lede="Gate stacks, TCAD convergence, mobility models, or a paper that needs a second reader. Open to device-level research, VLSI collaboration and teaching."
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal>
            <a
              href={`mailto:${person.email}`}
              className="group block break-all text-[clamp(26px,5.4vw,58px)] font-medium leading-[1.05] tracking-[-0.03em] text-ink"
            >
              <Magnetic strength={0.12}>
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
                  {person.email}
                </span>
              </Magnetic>
            </a>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copy}
                className="rounded-full border border-line px-4 py-2 text-[14px] text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Press Ctrl+C' : 'Copy address'}
              </button>
              <a
                href={`tel:${person.phoneHref}`}
                className="rounded-full border border-line px-4 py-2 text-[14px] text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                {person.phone}
              </a>
              <a
                href={`${base}${person.cv}`}
                download
                className="rounded-full border border-ink bg-ink px-4 py-2 text-[14px] text-bg transition-colors hover:bg-transparent hover:text-ink"
              >
                Download CV
              </a>
              <span role="status" aria-live="polite" className="sr-only">
                {copied === 'ok' ? 'Email address copied' : ''}
              </span>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-10 max-w-md text-[15px] leading-relaxed text-muted">
              Based in {person.location}. Currently a Research Fellow at BRAC University and open to
              collaboration.
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={100}>
            <ul className="border-t border-line">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 border-b border-line py-5 pl-1 pr-2 transition-colors hover:bg-bg2"
                  >
                    <span className="flex items-center gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors duration-300 group-hover:border-accent group-hover:text-accent">
                        <SocialIcon id={l.icon} size={19} />
                      </span>
                      <span>
                        <span className="block text-[16px] text-ink">{l.label}</span>
                        <span className="block text-[13px] text-muted">{l.value}</span>
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-[18px] text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
