export type Publication = {
  id: string
  title: string
  authors: string[]
  venue: string
  year: number
  doi: string
  position: string
  metrics: { quartile: string; percentile: string; impact: string; citeScore: string }
  tags: string[]
  note: string
}

export const ME = 'Md. Reshad Al Muttaki'

const ecmx = {
  quartile: 'Q1',
  percentile: 'Top 7%',
  impact: 'IF 8.78',
  citeScore: 'CiteScore 11.3',
}

export const publications: Publication[] = [
  {
    id: 'est-anomaly',
    title:
      'Demand-based anomaly detection algorithm in electric vehicle charging systems using machine learning and digital twin simulation',
    authors: [ME, 'Sadia Afrin', 'Alvi Ibn Amzad Anil', 'Shameem Hasan'],
    venue: 'Journal of Energy Storage',
    year: 2026,
    doi: '10.1016/j.est.2026.122795',
    position: '1st author',
    metrics: { quartile: 'Q1', percentile: 'Top 6%', impact: 'IF 9.8', citeScore: 'CiteScore 13.3' },
    tags: ['EV charging', 'anomaly detection', 'machine learning', 'digital twin'],
    note: 'Demand-side anomaly detection across EV charging systems, validated against a digital-twin simulation of the charging network.',
  },
  {
    id: 'ecmx-soc',
    title:
      'State-of-charge-aware charging opportunity detection for electric vehicles using data-driven learning and digital twin simulation',
    authors: [ME, 'Sadia Afrin', 'Alvi Ibn Amzad Anil', 'Shameem Hasan'],
    venue: 'Energy Conversion and Management: X',
    year: 2026,
    doi: '10.1016/j.ecmx.2026.101775',
    position: '1st author',
    metrics: ecmx,
    tags: ['state of charge', 'EV', 'data-driven learning', 'digital twin'],
    note: 'Detects charging opportunities from state-of-charge behaviour rather than from a fixed schedule.',
  },
  {
    id: 'ecmx-wams',
    title:
      'Towards smarter grids: A systematic review of wide area monitoring enhancing stability, protection, and promoting environmental sustainability',
    authors: [ME, 'Alvi Ibn Amzad Anil', 'Sadia Afrin', 'Shameem Hasan'],
    venue: 'Energy Conversion and Management: X',
    year: 2025,
    doi: '10.1016/j.ecmx.2025.101424',
    position: '1st author',
    metrics: ecmx,
    tags: ['smart grid', 'wide-area monitoring', 'stability', 'protection'],
    note: 'A systematic review of wide-area monitoring and what it does for grid stability, protection and sustainability.',
  },
  {
    id: 'ecmx-cyber',
    title:
      'AI-powered cybersecurity for smart grid communication: A systematic review of intrusion detection and threat mitigation systems',
    authors: ['Sadia Afrin', ME, 'Alvi Ibn Amzad Anil', 'Shameem Hasan'],
    venue: 'Energy Conversion and Management: X',
    year: 2025,
    doi: '10.1016/j.ecmx.2025.101416',
    position: '2nd author',
    metrics: ecmx,
    tags: ['smart grid', 'intrusion detection', 'AI security'],
    note: 'Intrusion detection and threat mitigation across smart-grid communication layers.',
  },
  {
    id: 'ecmx-storage',
    title:
      'The next generation of energy storage for smart and sustainable power grids: A systematic review',
    authors: ['Alvi Ibn Amzad Anil', ME, 'Sadia Afrin', 'Shameem Hasan'],
    venue: 'Energy Conversion and Management: X',
    year: 2026,
    doi: '10.1016/j.ecmx.2026.101771',
    position: '2nd author',
    metrics: ecmx,
    tags: ['energy storage', 'grid scale', 'sustainability'],
    note: 'Where grid-scale storage technology is going, and which parts of it hold up under review.',
  },
  {
    id: 'ecmx-balance',
    title:
      'Balancing cybersecurity, wireless charging, and safety: Digital twin-driven techno-economic analysis of electric vehicles',
    authors: [
      'Shameem Hasan',
      'Abu M. Fuad',
      'B.M. Khalid Hasan Drobo',
      ME,
      'Sadia Afrin',
      'Omar Farrok',
    ],
    venue: 'Energy Conversion and Management: X',
    year: 2026,
    doi: '10.1016/j.ecmx.2026.102107',
    position: '4th author',
    metrics: ecmx,
    tags: ['wireless charging', 'techno-economic', 'digital twin', 'safety'],
    note: 'A techno-economic reading of EV wireless charging where security and safety are treated as costs, not afterthoughts.',
  },
]
