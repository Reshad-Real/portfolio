import { navLinks, person } from '../data/site'

export function Footer({ arcadeHref }: { arcadeHref: string }) {
  const year = new Date().getFullYear()
  const links = [...navLinks, { label: 'Arcade', href: arcadeHref }, { label: 'Contact', href: '#contact' }]

  return (
    <footer className="border-t border-line bg-bg2">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-12 sm:px-8 md:px-10 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p
              className="flex items-baseline text-[21px] tracking-tight text-ink sm:text-[25px]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {person.mark}
              <span className="text-accent">{person.markSuffix}</span>
            </p>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              The bench of {person.name}. Semiconductor devices, digital twins, teaching, and a few
              things that did not need to be interactive but are.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative text-[15px] text-ink transition-colors hover:text-accent"
              >
                {l.label}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full"
                />
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {person.name}.
          </p>
          <p style={{ fontFamily: 'var(--font-tech)' }}>Dhaka, Bangladesh</p>
        </div>
      </div>
    </footer>
  )
}
