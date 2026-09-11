import type { Rgb } from './clay'

/** Linearised-ish clay colours, tuned against the indigo room. */
const c = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const P = {
  room: c('#4355db'),
  roomDeep: c('#3644b8'),

  chair: c('#4658e0'),
  chairLight: c('#6274f2'),
  chairDark: c('#3a49c4'),
  chairLeg: c('#2f3aa0'),

  skin: c('#f0c9a4'),
  skinDark: c('#dcae86'),
  hair: c('#241f3a'),
  shirt: c('#f4f5fc'),
  shirtDark: c('#dcdff0'),
  denim: c('#4f5fd8'),

  cans: c('#b79ceb'),
  cansDark: c('#8f72d0'),
  pink: c('#f2789f'),
  glass: c('#241f3a'),

  laptop: c('#eef0fa'),
  laptopEdge: c('#d3d8ee'),
  screen: c('#f7f8ff'),

  potSoil: c('#2a2440'),
  pot: c('#6a4fd0'),
  potRim: c('#8466e8'),
  leaf: c('#3cc47f'),
  leafDark: c('#2aa165'),

  wood: c('#f0a050'),
  woodDark: c('#d98736'),
  metal: c('#f2f4ff'),

  lamp: c('#a970e0'),
  lampDark: c('#8a54c4'),
  bulb: c('#fff2c8'),

  bag: c('#e8dcc4'),
  bagDark: c('#d2c3a6'),
  bagStrap: c('#c9b696'),

  book1: c('#f2789f'),
  book2: c('#8b6ae8'),
  book3: c('#3cc47f'),

  cup: c('#f2789f'),
  cupDark: c('#d85c84'),

  hex: [c('#f2789f'), c('#9b6ae0'), c('#f0a040'), c('#3cc47f'), c('#5b8df0'), c('#e8607a')] as Rgb[],
  hexFace: c('#ffffff'),

  // Dog, matched to the reference: warm golden fur, cream chest, chrome plate.
  fur: c('#e6b26a'),
  furLight: c('#f2cf9a'),
  furDark: c('#c8924e'),
  chrome: c('#a7aeba'),
  chromeDark: c('#7d8492'),
  optic: c('#2aa8f0'),
  nose: c('#2b2422'),
  tongue: c('#f28ba0'),
  eye: c('#2b1d16'),
} as const
