export type SkillGroup = { id: string; label: string; items: string[] }

export const skillGroups: SkillGroup[] = [
  { id: 'prog', label: 'Programming', items: ['Python', 'C', 'MATLAB', 'Verilog', 'VHDL'] },
  {
    id: 'eda',
    label: 'EDA & simulation',
    items: [
      'Silvaco TCAD',
      'DEVSIM',
      'Cadence',
      'COMSOL Multiphysics',
      'Altium Designer',
      'Quartus',
    ],
  },
  { id: 'web', label: 'Web & markup', items: ['HTML', 'CSS', 'LaTeX'] },
  {
    id: 'tools',
    label: 'Tools & platforms',
    items: ['Git & GitHub', 'Google Suite', 'MS Office Suite'],
  },
]

export type Interest = { id: string; label: string; items: string[] }

export const interests: Interest[] = [
  {
    id: 'semi',
    label: 'Electronics & semiconductor',
    items: ['VLSI design', 'Semiconductor devices', 'Embedded systems', 'CAD algorithms'],
  },
  {
    id: 'ai',
    label: 'AI & cybernetics',
    items: [
      'Artificial intelligence & ML',
      'IoT & cyber-physical systems',
      'Digital twin systems',
      'Computer architecture',
    ],
  },
  {
    id: 'bio',
    label: 'Biomedical engineering',
    items: [
      'Healthcare technology',
      'Biomedical AI',
      'Flexible PCB & e-skin',
      'Health & bioinformatics',
    ],
  },
]

/** What the studio actually does, used by the Studio section. */
export type Capability = { id: string; n: string; title: string; body: string; tags: string[] }

export const capabilities: Capability[] = [
  {
    id: 'tcad',
    n: '01',
    title: 'Device design & TCAD',
    body: 'Build the device in TCAD before anything is fabricated. Mesh it, set the physics models, and find out where the deck stops converging.',
    tags: ['Silvaco Atlas', 'DEVSIM', 'COMSOL'],
  },
  {
    id: 'characterise',
    n: '02',
    title: 'Honest characterisation',
    body: 'Transfer and output curves, subthreshold swing, DIBL, self-heating. Report the numbers that make the device look bad alongside the ones that do not.',
    tags: ['I-V', 'SS', 'DIBL', 'thermal'],
  },
  {
    id: 'twin',
    n: '03',
    title: 'Digital twins & optimisation',
    body: 'Surrogate models and constrained multi-objective search over a calibrated twin, so the expensive simulation runs only where it earns its keep.',
    tags: ['Gaussian process', 'EHVI', 'RL warm start'],
  },
  {
    id: 'write',
    n: '04',
    title: 'Then write it up',
    body: 'Six Q1 papers so far. A result nobody can reproduce from your methods section is not a result yet.',
    tags: ['LaTeX', 'peer review', 'reproducibility'],
  },
]
