// shared/ui/Slider/model/useSliderMousewheel.js
import { useEffect } from 'react'

export const useSliderMousewheel = ({
  viewportRef,
  enabled,
  isVertical,
  goToNext,
  goToPrev,
  animStateRef,
}) => {
  useEffect(() => {
    if (!enabled) return
    const el = viewportRef.current
    if (!el) return

    let lastFireTime = 0
    const COOLDOWN_MS = 300  // не реагуємо на події частіше ніж раз на 300ms

    const onWheel = (e) => {
      const now = Date.now()
      if (now - lastFireTime < COOLDOWN_MS) return

      // deltaY додатній = скрол вниз = next (для horizontal) або next (для vertical)
      // deltaX додатній = скрол вправо
      const delta = isVertical ? e.deltaY : (e.deltaX || e.deltaY)
      if (Math.abs(delta) < 5) return  // ігноруємо легкі рухи

      e.preventDefault()  // не скролити сторінку
      lastFireTime = now

      if (delta > 0) goToNext()
      else goToPrev()
    }

    // passive: false щоб preventDefault працював
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [enabled, isVertical, goToNext, goToPrev, viewportRef])
}