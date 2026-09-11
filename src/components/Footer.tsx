import { brand, navLinks, person } from '../data/site'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-line bg-bg2">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 md:px-10 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p
              className="flex items-center text-[21px] tracking-tight text-ink sm:text-[26px]"
              style={{ fontFamily: 'var(--font-heading)', gap: '0.75rem' }}
            >
              <span>
                {brand.name}
                {brand.mark}
              </span>
              <span
                aria-hidden="true"
                className="select-none text-[25px] leading-none sm:text-[30px]"
                style={{ letterSpacing: '-0.02em' }}
              >
                {brand.asterisk}
              </span>
            </p>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              The research studio of {person.name}. Semiconductor devices, digital twins and things
              that should probably not be interactive but are.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[15px] text-ink transition-opacity hover:opacity-60"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              className="text-[15px] text-ink underline underline-offset-2 transition-opacity hover:opacity-60"
            >
              Get in touch
            </a>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {person.name}. Built with React, TypeScript and hand-written WebGL.
          </p>
          <p style={{ fontFamily: 'var(--font-tech)' }}>
            {person.location.split(',').slice(-2).join(',').trim()}
          </p>
        </div>
      </div>
    </footer>
  )
}
