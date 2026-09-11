import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Types each line out, holds it, deletes it, then moves to the next and loops.
 * Under reduced motion it simply shows the first line and stops.
 */
export function useTypedLines(
  lines: readonly string[],
  { typeMs = 42, deleteMs = 22, holdMs = 1900, startMs = 500 } = {},
) {
  const reduced = usePrefersReducedMotion()
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduced) {
      setText(lines[0] ?? '')
      setDone(true)
      return
    }

    let line = 0
    let chars = 0
    let deleting = false
    let timer = 0
    let stopped = false

    const tick = () => {
      if (stopped) return
      const current = lines[line % lines.length] ?? ''

      if (!deleting) {
        chars += 1
        setText(current.slice(0, chars))
        if (chars >= current.length) {
          setDone(true)
          deleting = true
          timer = window.setTimeout(tick, holdMs)
          return
        }
        setDone(false)
        timer = window.setTimeout(tick, typeMs)
        return
      }

      chars -= 1
      setText(current.slice(0, Math.max(0, chars)))
      if (chars <= 0) {
        deleting = false
        line += 1
        timer = window.setTimeout(tick, 320)
        return
      }
      timer = window.setTimeout(tick, deleteMs)
    }

    timer = window.setTimeout(tick, startMs)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [lines, typeMs, deleteMs, holdMs, startMs, reduced])

  return { text, done }
}
