export type Role = {
  id: string
  title: string
  org: string
  meta: string
  period: string
  current: boolean
  points: string[]
}

export const roles: Role[] = [
  {
    id: 'fellow',
    title: 'Research Fellow',
    org: 'BRAC University',
    meta: 'Center for Research on Energy, Semiconductors & Technology (CREST)',
    period: 'May 2026 — present',
    current: true,
    points: [
      'Conducting research on GaN-Based G4FET Technology: Fabrication, Characterization, Modeling, and Circuit Demonstration, funded under the CREST initiative.',
      'Designing a 5 nm AlGaN/GaN tri-gate FinFET (AS³-FinFET) in Silvaco Atlas TCAD, applying VLSI short-channel-effect theory and polarization-charge device physics.',
      'Applying gate, doping and spacer engineering to manage electrostatic scaling and interface effects at the sub-5 nm VLSI node.',
      'Benchmarking the design against global FinFET and nanosheet approaches, with a roadmap toward compact modelling and circuit-level demonstration.',
    ],
  },
  {
    id: 'ra',
    title: 'Research Assistant',
    org: 'BRAC University',
    meta: 'Research & Sustainable Growth Initiative (RSGI)',
    period: 'Mar 2026 — present',
    current: true,
    points: [
      'Conducting research on Advancing Sustainable Biosensing: A Self-powered Biosensor for Real-time and Wireless Health Monitoring, funded by RSGI.',
      'Developing an e-skin-type biosensor in both simulation and hardware environments.',
    ],
  },
  {
    id: 'tutor',
    title: 'Student Tutor',
    org: 'BSRM School of Engineering, Dept. of EEE',
    meta: 'BRAC University',
    period: 'Jan 2024 — Oct 2025',
    current: false,
    points: [
      'Managed and mentored undergraduate students through tutorial and consultation sessions, online and offline, across multiple courses.',
      'Prepared supplementary problem sets, worked examples and exam-review material to address common conceptual gaps.',
      'Held regular office hours and pre-exam review sessions in circuit analysis, semiconductor devices and energy-conversion topics.',
    ],
  },
  {
    id: 'mentor',
    title: 'Student Mentor — FYAT',
    org: 'First Year Advising Team, OAA',
    meta: 'BRAC University',
    period: 'Jan 2024 — Jan 2025',
    current: false,
    points: [
      'Provided one-to-one mentorship to students as part of the First Year Advising Team.',
      'Guided first-year students on course selection, study habits and adjustment to university life.',
    ],
  },
]

export type Degree = {
  level: string
  title: string
  org: string
  period: string
  score: number
  outOf: number
  note: string
}

export const education: Degree[] = [
  {
    level: 'Degree',
    title: 'BSc in Electrical & Electronic Engineering',
    org: 'BRAC University · Major: Electronics',
    period: 'Jan 2022 — Jan 2026',
    score: 3.81,
    outOf: 4,
    note: 'CGPA',
  },
  {
    level: 'Higher secondary',
    title: 'HSC · Science',
    org: 'Square School & College · Rajshahi Board',
    period: 'Passed 2020',
    score: 5,
    outOf: 5,
    note: 'GPA',
  },
  {
    level: 'Secondary',
    title: 'SSC · Science',
    org: 'Square School & College · Rajshahi Board',
    period: 'Passed 2018',
    score: 5,
    outOf: 5,
    note: 'GPA',
  },
]

export const honours = {
  vc: ['Spring 2023', 'Summer 2023', 'Summer 2024'],
  dean: ['Fall 2022', 'Fall 2023', 'Spring 2024', 'Fall 2024', 'Spring 2025'],
}

export const training = {
  title: 'Industrial Training in VLSI Design',
  org: 'Ulkasemi Pvt. Ltd.',
  period: 'Oct 2025',
  modules: [
    ['Analog Design', 'Circuit-level design and analysis of analog building blocks.'],
    ['Digital Design', 'RTL-level design methodology for digital systems.'],
    ['Digital Verification', 'Functional verification flows for digital circuit designs.'],
    ['Custom Layout', 'Physical layout design for custom VLSI cells.'],
    ['Digital Circuit Design', 'Design and implementation of digital circuit blocks.'],
  ] as const,
}

export type Reference = { name: string; role: string; org: string; email: string }

export const references: Reference[] = [
  {
    name: 'Dr. Mirza Rasheduzzaman',
    role: 'Associate Professor',
    org: 'Department of EEE, BRAC University',
    email: 'mirza.rasheduzzaman@bracu.ac.bd',
  },
  {
    name: 'SK Tahmed Salim Rafid',
    role: 'Lecturer',
    org: 'Department of EEE, BRAC University',
    email: 'rafid.salim@bracu.ac.bd',
  },
]
