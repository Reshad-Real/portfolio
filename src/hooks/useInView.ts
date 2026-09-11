import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Stop observing after the first intersection. */
  once?: boolean
  rootMargin?: string
  threshold?: number
}

/**
 * Reports whether an element is on screen. Used both for reveal animations and
 * to park expensive canvases while they are scrolled away.
 */
export function useInView<T extends HTMLElement>({
  once = true,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0.12,
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}
