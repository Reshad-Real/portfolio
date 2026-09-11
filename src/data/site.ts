/**
 * Brand + identity strings live here so the studio name, agent name and
 * contact address can each be changed in exactly one place.
 */
export const brand = {
  name: 'Mainframe',
  mark: '®',
  asterisk: '✳︎',
  /** Address used by the hero "Reach us" pill. */
  studioEmail: 'hello@mainframe.co',
  agent: 'A.R.I.A',
  agentExpanded: 'Adaptive Response Interface Agent',
} as const

export const person = {
  name: 'Md. Reshad Al Muttaki',
  shortName: 'Reshad',
  role: 'VLSI & semiconductor device engineer',
  title: 'Research Fellow · BRAC University',
  location: 'Mirpur 11, Dhaka 1212, Bangladesh',
  email: 'realreshad@gmail.com',
  phone: '+880 1919 482265',
  phoneHref: '+8801919482265',
  cv: 'CV_Reshad.pdf',
  links: {
    scholar: 'https://scholar.google.com/citations?user=rUrbiOYAAAAJ&hl=en&oi=ao',
    linkedin: 'https://www.linkedin.com/in/md-reshad-al-muttaki-a37869331/',
    github: 'https://github.com/Reshad-Real',
  },
} as const

export const heroCopy = {
  intro: `Hey there, meet ${brand.agent},<br>${brand.name}'s ${brand.agentExpanded}`,
  typewriter: 'Glad you stopped in. Good taste tends to find us. Now, what are we building?',
} as const

/** Nav labels are fixed by the brand; each one anchors to a real section. */
export const navLinks = [
  { label: 'Labs', href: '#labs' },
  { label: 'Studio', href: '#studio' },
  { label: 'Openings', href: '#openings' },
  { label: 'Shop', href: '#arcade' },
] as const

export const contactCta = { label: 'Get in touch', href: '#contact' } as const

export const marqueeTerms = [
  'GaN tri-gate',
  'Silvaco Atlas',
  '2DEG transport',
  'short-channel effects',
  'AS³-FinFET',
  'e-skin biosensors',
  'digital twins',
  'subthreshold swing',
  'DIBL',
  'self-heating',
  'gate-all-around',
  'DEVSIM',
] as const

export type Stat = { value: number; decimals: number; suffix: string; label: string }

export const stats: Stat[] = [
  { value: 6, decimals: 0, suffix: '', label: 'Q1 journal papers' },
  { value: 1, decimals: 0, suffix: '', label: 'manuscript under review' },
  { value: 3.81, decimals: 2, suffix: '', label: 'CGPA out of 4.00' },
  { value: 5, decimals: 0, suffix: ' nm', label: 'smallest gate simulated' },
  { value: 3, decimals: 0, suffix: '', label: 'courses tutored' },
  { value: 8, decimals: 0, suffix: '', label: "VC's and Dean's list entries" },
]
