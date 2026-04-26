// shared/ui/Slider/model/useResponsiveProps.js
import { useEffect, useState } from 'react'

export const useResponsiveProps = (baseProps, breakpoints) => {
  const [overrides, setOverrides] = useState(() =>
    typeof window !== 'undefined' ? computeActive(breakpoints) : {}
  )

  useEffect(() => {
    if (!breakpoints) return

    const entries = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => a - b)
      .map(min => {
        const mq = window.matchMedia(`(min-width: ${min}px)`)
        return { min, mq }
      })

    const recompute = () => setOverrides(computeActive(breakpoints))

    entries.forEach(({ mq }) => mq.addEventListener('change', recompute))
    recompute()

    return () => entries.forEach(({ mq }) => mq.removeEventListener('change', recompute))
  }, [breakpoints])

  return { ...baseProps, ...overrides }
}

function computeActive(breakpoints) {
  if (!breakpoints) return {}
  // Знаходимо найбільший ключ з matches=true (mobile-first)
  const matched = Object.keys(breakpoints)
    .map(Number)
    .sort((a, b) => b - a)
    .find(min => window.matchMedia(`(min-width: ${min}px)`).matches)
  return matched != null ? breakpoints[matched] : {}
}