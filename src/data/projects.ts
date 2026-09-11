export type Project = {
  id: string
  kind: 'device' | 'sensing' | 'systems' | 'optimisation'
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
    id: 'g4fet',
    kind: 'device',
    title: 'GaN-based G4FET technology',
    blurb:
      'A four-gate transistor in gallium nitride: one body, four independent controls, and a design space that does not behave like anything in the textbook.',
    detail:
      'Research on GaN-Based G4FET Technology: Fabrication, Characterization, Modeling, and Circuit Demonstration, funded under the CREST initiative. The work covers transfer and output behaviour, subthreshold swing, DIBL and self-heating, written up for peer review.',
    stack: ['TCAD', 'multi-gate', 'transfer curves', 'characterisation'],
    context: 'BRAC University · CREST',
  },
  {
    id: 'eskin',
    kind: 'sensing',
    title: 'Self-powered e-skin biosensor',
    blurb:
      'A flexible skin-mounted sensor that harvests what it needs to run. No battery to change is the whole point of wearing it continuously.',
    detail:
      'Part of Advancing Sustainable Biosensing: A Self-powered Biosensor for Real-time and Wireless Health Monitoring, funded by RSGI at BRAC University. The e-skin-type biosensor is developed in both simulation and hardware environments.',
    stack: ['energy harvesting', 'flexible substrates', 'biosignals', 'wireless'],
    context: 'BRAC University · RSGI',
  },
  {
    id: 'digital-twins',
    kind: 'systems',
    title: 'Digital twins for storage & EV charging',
    blurb:
      'Models of battery packs and charging infrastructure that stay faithful enough to be worth trusting when the real thing is expensive to test.',
    detail:
      'The simulation backbone behind several of the published papers. State-of-charge-aware opportunity detection, demand-based anomaly detection and techno-economic analysis of wireless charging all run against digital-twin models rather than against the hardware.',
    stack: ['Li-ion', 'thermal', 'converters', 'machine learning'],
    context: 'Published research',
  },
  {
    id: 'hera-framework',
    kind: 'optimisation',
    title: 'HERA optimisation framework',
    blurb:
      'A constrained multi-objective search for sub-3 nm gate-all-around FinFETs, warm-started by reinforcement learning over a calibrated TCAD twin.',
    detail:
      'A Gaussian-process ensemble surrogate, a constrained expected-hypervolume acquisition function and a reinforcement-learning-warm-started search explore the device design space. Representative designs are cross-verified in DEVSIM drift-diffusion TCAD. Currently under review.',
    stack: ['Gaussian process', 'EHVI', 'reinforcement learning', 'DEVSIM'],
    context: 'Under review',
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
