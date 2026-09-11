import { useState } from 'react'
import { HeroScene } from './art/HeroScene'
import { DogArt, type Pose } from './art/DogArt'
import { RefAvatar } from './art/RefAvatar'
import { Motif, type MotifId } from './art/Motif'
import { WallPanels } from './art/WallPanels'

/**
 * Development-only. Every drawn element on its own, in the states it actually
 * ships in, so shapes and animation can be checked before anything is placed
 * in the page. Reachable at `?inspect` while running `npm run dev`.
 */
const MOTIFS: MotifId[] = ['chip', 'wafer', 'mug', 'plant', 'window', 'lamp']

const DOG_STATES: { name: string; pose: Pose; joy: number; barking: boolean; blinking: boolean }[] = [
  { name: 'sit · idle', pose: 'sit', joy: 0, barking: false, blinking: false },
  { name: 'sit · blink', pose: 'sit', joy: 0, barking: false, blinking: true },
  { name: 'sit · bark', pose: 'sit', joy: 0, barking: true, blinking: false },
  { name: 'sit · petted', pose: 'sit', joy: 1, barking: false, blinking: false },
  { name: 'walk', pose: 'walk', joy: 0, barking: false, blinking: false },
  { name: 'walk · bark', pose: 'walk', joy: 0.6, barking: true, blinking: false },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <p
        className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        {label}
      </p>
      <div className="grid place-items-center">{children}</div>
    </div>
  )
}

export function ArtInspector() {
  const [dogSize, setDogSize] = useState(120)

  return (
    <div className="min-h-screen bg-bg2 p-6 text-ink">
      <h1 className="mb-6 text-[20px]" style={{ fontFamily: 'var(--font-tech)' }}>
        art inspector
      </h1>

      <h2 className="mb-3 mt-8 text-[13px] uppercase tracking-[0.2em] text-muted">Hero scene</h2>
      <div className="overflow-hidden rounded-xl border border-line">
        <HeroScene className="block w-full" />
      </div>

      <h2 className="mb-3 mt-10 text-[13px] uppercase tracking-[0.2em] text-muted">
        Wall panels, on their own
      </h2>
      <div className="rounded-xl border border-line bg-[#20203a] p-4">
        <svg viewBox="60 20 190 190" className="block w-[320px]">
          <defs>
            <filter id="hs-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
          <WallPanels />
        </svg>
      </div>

      <h2 className="mb-3 mt-10 flex items-center gap-4 text-[13px] uppercase tracking-[0.2em] text-muted">
        BYTE, every state
        <input
          type="range"
          min={70}
          max={220}
          value={dogSize}
          onChange={(e) => setDogSize(Number(e.target.value))}
          className="mf-range h-4 w-40 cursor-pointer appearance-none bg-transparent"
        />
        <span className="tabular-nums">{dogSize}px</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DOG_STATES.map((s) => (
          <Cell key={s.name} label={s.name}>
            <div style={{ width: dogSize, height: dogSize }}>
              <DogArt
                pose={s.pose}
                joy={s.joy}
                barking={s.barking}
                blinking={s.blinking}
                lookX={0}
                lookY={0}
                className="h-full w-full"
              />
            </div>
          </Cell>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-[13px] uppercase tracking-[0.2em] text-muted">Motifs</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {MOTIFS.map((m) => (
          <Cell key={m} label={m}>
            <Motif id={m} size={96} />
          </Cell>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-[13px] uppercase tracking-[0.2em] text-muted">
        Reference avatars
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cell label="senior">
          <RefAvatar kind="senior" name="Senior" className="h-[110px] w-[110px]" />
        </Cell>
        <Cell label="junior">
          <RefAvatar kind="junior" name="Junior" className="h-[110px] w-[110px]" />
        </Cell>
      </div>
    </div>
  )
}
