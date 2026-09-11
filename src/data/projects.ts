export type Project = {
  id: string
  kind: 'device' | 'sensing' | 'systems'
  title: string
  blurb: string
  detail: string
  stack: string[]
  context: string
}

export const projects: Project[] = [
  {
    id: 'as3-finfet',
    kind: 'device',
    title: '5 nm AlGaN/GaN AS³-FinFET',
    blurb:
      'An asymmetric-spacer tri-gate on a GaN channel. Wrapping the gate on three sides holds the channel together at a gate length where a planar device falls apart.',
    detail:
      'Designed in Silvaco Atlas TCAD, applying VLSI short-channel-effect theory and polarization-charge device physics. Gate, doping and spacer engineering manage electrostatic scaling and interface effects at the sub-5 nm VLSI node, benchmarked against global FinFET and nanosheet approaches with a roadmap toward compact modelling and circuit-level demonstration.',
    stack: ['Silvaco Atlas', '2DEG', 'DIBL', 'self-heating', 'spacer engineering'],
    context: 'BRAC University · CREST',
  },
  {
    id: 'eskin',
    kind: 'sensing',
    title: 'Self-powered e-skin biosensor',
    blurb:
      'A flexible skin-mounted sensor that harvests what it needs to run. No battery to change is the whole point of wearing it continuously.',
    detail:
      'Part of Advancing Sustainable Biosensing: A Self-powered Biosensor for Real-time and Wireless Health Monitoring, funded by RSGI at BRAC University. Energy harvesting, the flexible substrate, signal conditioning and the wireless link are developed as one chain rather than four parts, and the device is built in both simulation and hardware so that the modelled behaviour and the bench behaviour can be held against each other.',
    stack: ['energy harvesting', 'flexible substrates', 'biosignals', 'wireless'],
    context: 'BRAC University · RSGI',
  },
]

export type Course = { code: string; title: string; term: string; detail: string }

export const courses: Course[] = [
  {
    code: 'EEE/ECE 101',
    title: 'Electrical Circuits I',
    term: 'Summer 2024',
    detail:
      'Foundational DC circuit analysis: Kirchhoff laws, nodal and mesh analysis, Thevenin and Norton theorems, and the transient response of RC and RL circuits.',
  },
  {
    code: 'EEE/ECE 205',
    title: 'Electronic Circuits I',
    term: 'Spring 2024',
    detail:
      'Semiconductor device fundamentals and single-stage amplifier design covering diode, BJT, JFET and MOSFET construction, characteristics and circuit analysis.',
  },
  {
    code: 'EEE 221',
    title: 'Energy Conversion',
    term: 'Fall 2024 – Summer 2025',
    detail:
      'Principles, construction and performance analysis of DC and AC energy-conversion machines, including transformers, induction motors and synchronous machines.',
  },
]
