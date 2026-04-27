// shared/ui/Slider/model/useSliderLoop.js
import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { normalizeIndex } from '@/shared/ui/Slider/lib/normalizeIndex'

export const useSliderLoop = ({
  wrapperRef,
  loop,
  N,
  duration,
  setIndex,
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
    if (completedRef.current) return  // вже відпрацювало (transitionend або timer)
    completedRef.current = true

    clearTimeout(safetyTimerRef.current)

    animStateRef.current = 'idle'
    setAnimating(false)

    if (!loop || N === 0) return

    const idx = currentIndexRef.current
    const normalized = normalizeIndex(idx, N)
    if (idx === normalized) return // вже нормалізований — нічого робити

    // Синхронно оновлюємо ref — drag-handlers і getSlideOffset одразу
    // бачать нове значення (без чекання на React render).
    currentIndexRef.current = normalized

    // Snap послідовність:
    //  1. Вимикаємо transition.
    //  2. Ставимо нову (нормалізовану) позицію wrapper-у.
    //  3. flushSync(goToSlide) — синхронно оновлюємо React currentIndex,
    //     щоб у наступному рендері baseTranslate теж був new.
    //  4. Через 2×rAF знов вмикаємо transition — щоб браузер встиг
    //     закомітити "transition: none + новий transform" перед тим
    //     як прийде наступна анімація.
    disableTransition()
    setDOMTranslate(getTranslateForIndex(normalized))
    // Фікс кадру між ре-рендерами (мерехтіння)
    flushSync(() => setIndex(normalized))

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
    // duration + 100ms запас — на випадок якщо transitionend "загубиться"
    // (interruption, browser quirks, тощо).
    safetyTimerRef.current = setTimeout(performNormalization, duration + 100)
  }

  useEffect(() => () => clearTimeout(safetyTimerRef.current), [])

  return { handleTransitionEnd, armSafetyTimer }
}