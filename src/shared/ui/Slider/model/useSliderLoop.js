// Slider/model/useSliderLoop.js
import { flushSync } from 'react-dom'
import {normalizeIndex} from '@/shared/ui/Slider/lib/normalizeIndex'

export const useSliderLoop = ({
  loop,
  N,
  goToSlide,
  getTranslateForIndex,
  currentIndexRef,
  animStateRef,
  setAnimating,
  setDOMTranslate,
  disableTransition,
  enableTransition,
}) => {

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return

    const prevState = animStateRef.current
    animStateRef.current = 'idle'
    setAnimating(false)

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