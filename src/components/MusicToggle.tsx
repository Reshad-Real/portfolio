import { useEffect, useState } from 'react'
import { armAudio, isMusicOn, prefersMusic, rememberMusic, setMusic } from '../lib/audio'

/**
 * The lofi loop, synthesised in the browser rather than streamed. It is on by
 * default, but no browser will let it sound before the visitor has touched the
 * page, so it comes up at the first click, tap or keypress. Switching it off
 * here is remembered, and it stays off on later visits.
 */
export function MusicToggle() {
  const [on, setOn] = useState(prefersMusic)

  useEffect(() => {
    armAudio((started) => setOn(started.music))
    // Never leave the loop running if this page goes away.
    return () => void setMusic(false)
  }, [])

  const toggle = () => {
    const next = !isMusicOn()
    rememberMusic(next)
    setOn(setMusic(next))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Turn the lofi loop off' : 'Play a lofi loop'}
      title={on ? 'Lofi: on' : 'Lofi: off'}
      className={[
        'relative grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors',
        on ? 'border-accent text-accent' : 'border-line text-muted hover:border-accent hover:text-accent',
      ].join(' ')}
    >
      {/* Three bars that dance while it plays and rest when it does not. */}
      {/* Uneven bars, so the resting state reads as an equaliser rather than
          three full stops. */}
      <span aria-hidden="true" className="flex items-end gap-[3px]">
        {[5, 11, 7].map((rest, i) => (
          <span
            key={i}
            className="block w-[2.5px] rounded-full bg-current"
            style={{
              height: on ? 12 : rest,
              animation: on ? `mf-eq 0.9s ease-in-out ${i * 0.18}s infinite` : 'none',
              transition: 'height 240ms ease',
            }}
          />
        ))}
      </span>
    </button>
  )
}
