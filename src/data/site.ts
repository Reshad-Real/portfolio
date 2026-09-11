export const person = {
  name: 'Md. Reshad Al Muttaki',
  shortName: 'Reshad',
  /** Wordmark: the site is his bench, not an agency. */
  mark: 'reshad',
  markSuffix: '.bench',
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

/** Lines the hero types out, one after another, in his own voice. */
export const typedLines = [
  'I design transistors about five nanometres wide.',
  'I simulate them until the physics gives in.',
  'Then I teach the people who will build the next ones.',
] as const

export const intro =
  'Electrical and Electronic Engineering graduate of BRAC University, and a Research Fellow there now. My work sits between device physics and simulation.'

export const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Research', href: '#research' },
  { label: 'Papers', href: '#papers' },
  { label: 'Teaching', href: '#teaching' },
  { label: 'Courses', href: '#courses' },
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
  { value: 3.81, decimals: 2, suffix: '', label: 'CGPA out of 4.00' },
  { value: 5, decimals: 0, suffix: ' nm', label: 'smallest gate simulated' },
  { value: 3, decimals: 0, suffix: '', label: 'courses tutored' },
  { value: 4, decimals: 0, suffix: '', label: 'semesters teaching' },
  { value: 8, decimals: 0, suffix: '', label: "VC's and Dean's list entries" },
]
