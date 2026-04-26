import { useEffect, useRef, useState } from 'react'
import styles from '../Slider.module.scss'

export const useSliderMetrics = ({
   viewportRef,
   wrapperRef,
   slidesCount,   // ← замість slides, нас цікавить тільки довжина
   slidesPerView,
   isVertical,
   needsPixelMode,
 }) => {
  const slideSizesRef     = useRef([])
  const slidePositionsRef = useRef([])
  const virtualSizeRef= useRef(0)
  const slideSizeRef  = useRef(0)
  const stepRef       = useRef(0)
  const gapRef        = useRef(0)

  // ─── State для ре-рендеру ─────────────────────────────────────────────────
  // isAutoMode — чи активний субпіксельний режим.
  // Зберігаємо в state щоб React перерендерив JSX при переключенні режиму.
  const [metrics, setMetrics] = useState({
    mode: 'numeric',  // 'numeric' | 'auto'
    // числовий режим
    slideSize: 0, gap: 0, step: 0,
    // субпіксельний режим
    slideSizes: [], slidePositions: [], virtualSize: 0,
  })
  // const isAutoMode = metrics.slidePositions.length > 0 && slidesPerView === 'auto'
  const [isAutoMode, setIsAutoMode] = useState(false)

    // viewportRef і wrapperRef — стабільні об'єкти (не змінюються між рендерами).
    // Їх не потрібно в deps — ESLint помиляється тут, бо не знає що це refs.
  useEffect(() => {
    if (!viewportRef.current) return

    const measure = () => {
      const el = viewportRef.current
      if (!el) return

      // Читаємо реальний обчислений gap з wrapper
      let parsedGap = 0
      if (wrapperRef.current) {
        // getComputedStyle викликається тільки при resize, в іншому випадку
        // це не навантажує браузер, тобто у звичайного користувача все буде добре.
        const cs = getComputedStyle(wrapperRef.current)
        parsedGap = parseFloat(isVertical ? cs.rowGap : cs.columnGap) || 0
      }
      gapRef.current = parsedGap

      if (needsPixelMode) {
        // ── Субпіксельний режим: міряємо кожен слайд окремо ────────────────
        //
        // getBoundingClientRect() — субпіксельна точність (повертає float).
        // offsetWidth — ціле число (округлення вниз), при багатьох слайдах
        // може накопичитись drift (помилка позиціонування).
        // Embla використовує саме getBoundingClientRect для тієї ж причини.
        //
        // Важливо: getBoundingClientRect повертає розмір з урахуванням
        // CSS transform на самому елементі (якщо є). Але transform на wrapper
        // НЕ впливає на BoundingClientRect дочірніх елементів в абсолютних
        // координатах viewport — впливає тільки на відносні координати.
        // Для нас це не проблема бо нас цікавить width/height, а не left/top.
        const slideEls = el.querySelectorAll('.' + styles.slide)
        if (!slideEls.length) return

        const sizes     = []
        const positions = []
        let position    = 0

        slideEls.forEach((slideEl) => {

          const rect = slideEl.getBoundingClientRect()
          const size = isVertical ? rect.height : rect.width
          sizes.push(size)
          positions.push(position)
          position += size + parsedGap
        })

        // virtualSize — повна довжина контенту без trailing gap
        const virtualSize = position - parsedGap

        // Оновлюємо refs синхронно — handleTransitionEnd і drag одразу бачать нові значення
        slideSizesRef.current     = sizes
        slidePositionsRef.current = positions
        virtualSizeRef.current    = virtualSize

        setIsAutoMode(true)
        setMetrics({
          slideSize: 0, gap: parsedGap, step: 0,
          slideSizes: sizes, slidePositions: positions, virtualSize,
        })

      } else {
        // ── Числовий режим: один розрахунок для всіх однакових слайдів ─────
        //
        // clientWidth — без scrollbar, включає padding.
        // Для рівних слайдів субпіксельна точність менш критична:
        // всі слайди однакові → drift не накопичується.
        const containerSize = isVertical
          ? el.clientHeight
            - parseFloat(getComputedStyle(el).paddingTop)
            - parseFloat(getComputedStyle(el).paddingBottom)
          : el.clientWidth
            - parseFloat(getComputedStyle(el).paddingLeft)
            - parseFloat(getComputedStyle(el).paddingRight)

        const size    = (containerSize - parsedGap * (slidesPerView - 1)) / slidesPerView
        const newStep = size + parsedGap

        slideSizeRef.current = size
        stepRef.current      = newStep

        setIsAutoMode(false)
        setMetrics({
          slideSize: size, gap: parsedGap, step: newStep,
          slideSizes: [], slidePositions: [], virtualSize: 0,
        })
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView, needsPixelMode, slidesCount])

  return {
    metrics,
    isAutoMode,
    slideSizesRef,
    slidePositionsRef,
    virtualSizeRef,
    slideSizeRef,
    stepRef,
    gapRef,
  }
}