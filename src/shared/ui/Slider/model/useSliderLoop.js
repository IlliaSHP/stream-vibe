// Slider/model/useSliderLoop.js
import { flushSync } from 'react-dom'
import {useRef} from 'react'

export const useSliderLoop = ({
  wrapperRef,
  loop,
  N,
  isVertical,
  normalizeIndex,
  goToSlide,
  getTranslateForIndex,
  currentIndexRef,
  animStateRef,
}) => {
  const disableTransition = () => {
    if (wrapperRef.current) wrapperRef.current.style.transition = 'none'
  }

  const enableTransition = () => {
    if (wrapperRef.current) wrapperRef.current.style.transition = ''
  }

  const setDOMTranslate = (px) => {
    if (!wrapperRef.current) return
    wrapperRef.current.style.transform = isVertical
      ? `translate3d(0, ${px}px, 0)`
      : `translate3d(${px}px, 0, 0)`
  }

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return

    console.log('[transitionEnd]', {
      animState: animStateRef.current,
      idx: currentIndexRef.current,
      normalized: normalizeIndex(currentIndexRef.current, N)
    })
    const prevState = animStateRef.current
    animStateRef.current = 'idle'

    if (prevState !== 'sliding') return
    if (!loop || N === 0) return

    const idx = currentIndexRef.current
    const normalized = normalizeIndex(idx, N)
    if (idx === normalized) return // вже нормалізований — нічого робити

    // 1. Синхронно оновлюємо ref — getSlideOffset одразу бачить нове значення
    currentIndexRef.current = normalized

    // 2-3. Телепортуємо wrapper без анімації
    disableTransition()
    // stepRef.current — актуальний розмір (не closure з рендеру)
    setDOMTranslate(getTranslateForIndex(normalized))

    // Фікс кадру між ре-рендерами (мерехтіння)
    flushSync(() => goToSlide(normalized))

    // 5. Відновлюємо анімацію після двох rAF (гарантує що browser commit відбувся)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        enableTransition()
      })
    })
  }

  return { handleTransitionEnd, disableTransition, enableTransition, setDOMTranslate }
}