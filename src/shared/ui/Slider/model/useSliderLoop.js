// shared/ui/Slider/model/useSliderLoop.js
import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { normalizeIndex } from '@/shared/ui/Slider/lib/normalizeIndex'

export const useSliderLoop = ({
  wrapperRef,
  loop,
  N,
  duration,
  goToSlide,
  getTranslateForIndex,
  currentIndexRef,
  animStateRef,
  setAnimating,
  setDOMTranslate,
  disableTransition,
  enableTransition,
}) => {
  const safetyTimerRef = useRef(null)
  const completedRef = useRef(false)

  const performNormalization = () => {
    console.log('[performNormalization called]', {
      t: Date.now() % 100000,
      completedRef: completedRef.current,
      animState: animStateRef.current,
      currentIdx: currentIndexRef.current,
      normalized: normalizeIndex(currentIndexRef.current, N),
      actualTranslate: wrapperRef.current
        ? new DOMMatrix(getComputedStyle(wrapperRef.current).transform).m41
        : 'no-wrapper',
    })

    if (completedRef.current) return  // вже відпрацювало (transitionend або timer)
    completedRef.current = true

    clearTimeout(safetyTimerRef.current)

    const prevState = animStateRef.current
    animStateRef.current = 'idle'
    setAnimating(false)

    if (!loop || N === 0) return

    const idx = currentIndexRef.current
    const normalized = normalizeIndex(idx, N)
    if (idx === normalized) return // вже нормалізований — нічого робити

    // Синхронно оновлюємо ref — getSlideOffset одразу бачить нове значення
    currentIndexRef.current = normalized
    disableTransition()
    setDOMTranslate(getTranslateForIndex(normalized))
    // Фікс кадру між ре-рендерами (мерехтіння)
    flushSync(() => goToSlide(normalized))

    // Відновлюємо анімацію після двох rAF (гарантує що browser commit відбувся)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => enableTransition())
    })
  }

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return
    performNormalization()
  }

  // Запускаємо safety timer щоразу коли починається анімація.
  // Викликається з SliderTrack через ref або через ефект на currentIndex.
  const armSafetyTimer = () => {
    completedRef.current = false
    clearTimeout(safetyTimerRef.current)
    // duration + 100ms запас на коливання браузера
    safetyTimerRef.current = setTimeout(performNormalization, duration + 100)
  }

  useEffect(() => () => clearTimeout(safetyTimerRef.current), [])

  return { handleTransitionEnd, armSafetyTimer }
}