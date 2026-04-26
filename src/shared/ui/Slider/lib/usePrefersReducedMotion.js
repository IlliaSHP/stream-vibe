// shared/ui/Slider/lib/usePrefersReducedMotion.js

// Слухаємо зміну через MediaQueryList.addEventListener щоб реагувати в реальному
// часі (користувач може змінити налаштування ОС під час сесії). Окремий стейт потрібен для ре-рендеру
import { useEffect, useState } from 'react'

export const usePrefersReducedMotion = () => {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setPrefers(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefers
}