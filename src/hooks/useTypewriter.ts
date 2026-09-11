import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Reveals `text` one character at a time after `startDelay` ms.
 * Readers who ask for reduced motion get the whole line immediately.
 */
export function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const reduced = usePrefersReducedMotion()
  const timers = useRef<number[]>([])

  useEffect(() => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []

    if (reduced) {
      setDisplayed(text)
      setDone(true)
      return
    }

    setDisplayed('')
    setDone(false)

    let index = 0
    let interval = 0

    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1
        setDisplayed(text.slice(0, index))
        if (index >= text.length) {
          window.clearInterval(interval)
          setDone(true)
        }
      }, speed)
      timers.current.push(interval)
    }, startDelay)

    timers.current.push(start)

    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
      timers.current = []
    }
  }, [text, speed, startDelay, reduced])

  return { displayed, done }
}
