import { useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'
import { useSliderMetrics } from '@/shared/ui/Slider/model/useSliderMetrics'
import { useSliderLoop } from '@/shared/ui/Slider/model/useSliderLoop'
import { useSliderDrag } from '@/shared/ui/Slider/model/useSliderDrag'
import { useVisualIndex } from '@/shared/ui/Slider/model/useVisualIndex'
import { normalizeIndex } from '../lib/normalizeIndex'

const SliderTrack = ({ slides, slideLabels = [], classNames = {}, }) => {
  const {
    currentIndex,
    realActiveIndex,
    direction,
    registerSlides,
    slidesPerView,
    centeredSlides,
    loop,
    transition,
    goToNext,
    goToPrev,
    goToSlide,
    setAnimating,
  } = useSlider()

  const viewportRef = useRef(null)
  const wrapperRef  = useRef(null)
  const currentIndexRef = useRef(currentIndex)

  const animStateRef = useRef('idle') // 'idle' | 'sliding' | 'snapback'
  const isVertical = direction === 'vertical'
  const N = slides.length
  const needsPixelMode = slidesPerView === 'auto' || centeredSlides

  useEffect(() => {
    registerSlides(N)
  }, [N, registerSlides])

  // ── Metrics ────────────────────────────────────────────────────────────
  const {
    metrics,
    isAutoMode,
    slideSizesRef,
    slidePositionsRef,
    virtualSizeRef,
    slideSizeRef,
    stepRef,
    gapRef,
  } = useSliderMetrics({
    viewportRef,
    wrapperRef,
    slidesCount: N,
    slidesPerView,
    isVertical,
    needsPixelMode,
  })

  // ── DOM helpers — визначаємо тут, передаємо в хуки ────────────────────
  // Ці функції маніпулюють DOM напряму (обходять React) — це свідомо,
  // тільки для синхронних операцій під час анімації і drag.
  const disableTransition = useCallback(() => {
    if (wrapperRef.current) wrapperRef.current.style.transition = 'none'
  }, [])

  const enableTransition = useCallback(() => {
    if (wrapperRef.current) wrapperRef.current.style.transition = ''
  }, [])

  const setDOMTranslate = useCallback((px) => {
    if (!wrapperRef.current) return
    wrapperRef.current.style.transform = isVertical
      ? `translate3d(0, ${px}px, 0)`
      : `translate3d(${px}px, 0, 0)`
  }, [isVertical])

  const getComputedTranslate = useCallback(() => {
    if (!wrapperRef.current) return 0
    const matrix = new DOMMatrix(window.getComputedStyle(wrapperRef.current).transform)
    return isVertical ? matrix.m42 : matrix.m41
  }, [isVertical])

  // ─── Translate helpers ────────────────────────────────────────────────────
  // Централізуємо логіку розрахунку translate щоб не дублювати в render і в handleTransitionEnd.

  const calcTranslate = (idx, N, isAutoMode, positions, virtualSize, gap, step) => {
    if (isAutoMode) {
      const i = normalizeIndex(idx, N)
      // Кількість повних циклів — скільки разів вийшли за межі
      const cycles = Math.floor(idx / N)
      return -(positions[i] ?? 0) + cycles * (virtualSize + gap)
    }
    return -idx * step
  }

  // Для рендеру — читає з metrics (state, стабільне між рендерами)
  const getTranslateForRender = useCallback((idx) =>
      calcTranslate(idx, N, isAutoMode, metrics.slidePositions, metrics.virtualSize, metrics.gap, metrics.step),
    [isAutoMode, N, metrics])

  // Для handlers/effects — читає з refs (актуальне значення одразу)
  const getTranslateForIndex = useCallback((idx) =>
      calcTranslate(idx, N, isAutoMode, slidePositionsRef.current, virtualSizeRef.current, gapRef.current, stepRef.current),
    [isAutoMode, N, slidePositionsRef, stepRef, virtualSizeRef, gapRef])

  // Поточний розмір активного слайду — для drag threshold
  const getCurrentSlideSize = useCallback(() => {
    if (isAutoMode) {
      const i = normalizeIndex(currentIndexRef.current, N)
      return slideSizesRef.current[i] ?? 0
    }
    return slideSizeRef.current
  }, [isAutoMode, N, slideSizesRef, slideSizeRef])

  // ── Loop teleport ──────────────────────────────────────────────────────
  const { handleTransitionEnd, armSafetyTimer } = useSliderLoop({
    wrapperRef,
    loop,
    N,
    duration: transition.duration,
    goToSlide,
    getTranslateForIndex,
    currentIndexRef,
    animStateRef,
    setAnimating,
    setDOMTranslate,
    disableTransition,
    enableTransition,
  })

  // ── Drag ───────────────────────────────────────────────────────────────
  const { dragOffset, isDraggingState, handlers } = useSliderDrag({
    isVertical,
    loop,
    N,
    animStateRef,
    currentIndexRef,
    goToNext,
    goToPrev,
    getCurrentSlideSize,
    getComputedTranslate,
    setDOMTranslate,
    disableTransition,
    enableTransition,
    setAnimating,
  })

  // ── Slide offset (loop teleport per-slide) ─────────────────────────────
  //
  // В режимі loop слайди "телепортуються" на інший кінець щоб ілюзія
  // нескінченної стрічки працювала. Offset — скільки пікселів додати
  // до transform слайду щоб він опинився в правильному місці.
  //
  // k = кількість повних циклів між поточним індексом і слайдом.
  // При числовому режимі: offset = k * N * step (всі слайди рівні)
  // При субпіксельному:   offset = k * (virtualSize + gap) (повна довжина циклу)
  const getSlideOffset = useCallback((slideIndex, currentIdx, virtualSize, gap, step) => {
    if (!loop || N === 0) return 0
    const effectiveStep = isAutoMode ? (virtualSize + gap) : (N * step)
    if (effectiveStep === 0) return 0

    const k = Math.round((currentIdx - slideIndex) / N)
    if (k === 0) return 0
    return k * effectiveStep
  }, [loop, N, isAutoMode])

  // ─── Render values ────────────────────────────────────────────────────────
  const { slideSize, gap, step, slidePositions, virtualSize } = metrics

  const isReady = isAutoMode
    ? slidePositions.length > 0
    : step > 0

  const baseTranslate = isReady ? getTranslateForRender(currentIndex) : 0

  const renderIndex = useVisualIndex({
    wrapperRef,
    isVertical,
    isReady,
    isAutoMode,
    isDraggingState,
    dragOffset,
    baseTranslate,
    currentIndex,
    N,
    slidePositionsRef,
    virtualSizeRef,
    gapRef,
    stepRef,
  })

  // wrapperSize: при 'auto' — точний virtualSize, при числовому — формула
  const wrapperSize = isAutoMode
    ? virtualSize
    : N * slideSize + Math.max(0, N - 1) * gap

  const wrapperStyle = isReady
    ? isVertical
      ? { flexDirection: 'column', height: `${wrapperSize}px`, transform: `translate3d(0, ${baseTranslate + dragOffset}px, 0)` }
      : { transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)` }
    : isVertical
      ? { flexDirection: 'column' }
      : {}

  // useEffect [currentIndex] — кожна навігація запускає нову анімацію.
  // animStateRef='sliding' — ОБОВ'ЯЗКОВО, інакше performNormalization не
  // знає, що йде click-навігація і пропускає snap.
  useEffect(() => {
    currentIndexRef.current = currentIndex
    if (!isReady) return

    // if (transition.duration === 0) {
      // Без анімації — нормалізуємо на наступному tick
      // queueMicrotask(performNormalization)
      // return
    // }

    animStateRef.current = 'sliding'
    setAnimating(true)
    armSafetyTimer()
  }, [currentIndex])


  console.log('[SliderTrack render]', { currentIndex, step, baseTranslate, isReady });

  return (
    <div
      ref={viewportRef}
      className={clsx(
        styles.sliderViewport,
        isVertical && styles.sliderViewportVertical,
        styles.sliderViewportDraggable,
        isDraggingState && styles.sliderViewportDragging,
        classNames.viewport,
      )}
      style={{ touchAction: isVertical ? 'pan-x' : 'pan-y' }}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={handlers.handlePointerDown}
      onPointerMove={handlers.handlePointerMove}
      onPointerUp={handlers.handlePointerUp}
      onPointerCancel={handlers.handlePointerUp}
    >
      <ul
        ref={wrapperRef}
        className={clsx(
          styles.sliderWrapper,
          isDraggingState && styles.sliderWrapperDragging,
          classNames.wrapper,
        )}
        style={wrapperStyle}
        onTransitionEnd={handleTransitionEnd}
      >

        {slides.map((slideContent, index) => {
          const isActive = index === realActiveIndex
          const offset = getSlideOffset(index, currentIndex, virtualSize, gap, step)

          const slideTransform = loop && offset !== 0
            ? isVertical
              ? `translate3d(0, ${offset}px, 0)`
              : `translate3d(${offset}px, 0, 0)`
            : undefined

          // slideStyle: при 'auto' — не задаємо ширину примусово (CSS контролює),
          // при числовому — виставляємо точний розмір через inline style
          const slideStyle = isReady
            ? isAutoMode
              ? { flexShrink: 0, ...(slideTransform ? { transform: slideTransform } : {}) }
              : {
                [isVertical ? 'height' : 'width']: `${slideSize}px`,
                flexShrink: 0,
                ...(slideTransform ? { transform: slideTransform } : {}),
              }
            : { flexShrink: 0, ...(slideTransform ? { transform: slideTransform } : {}) }

          return (
            <li
              key={index}
              // role="group" — групує контент слайду як одне ціле для AT.
              role="group"
              // aria-roledescription="slide" — скрінрідер скаже "slide" замість "group".
              aria-roledescription="slide"
              // aria-label="2 of 5" — APG рекомендує саме такий формат для каруселі.
              // Допомагає користувачу орієнтуватись в загальній кількості.
              aria-label={slideLabels[index] ?? `${index + 1} of ${N}`}
              // tabIndex — активний слайд у Tab-послідовності.
              // Користувач Tab-ає → фокус на активному слайді → стрілки працюють.
              // Неактивні tabIndex={-1} (програмно фокусуємі, але не через Tab).
              tabIndex={isActive ? 0 : -1}
              // inert — повністю вимикає неактивні слайди для AT і інтеракції.
              // Це гарантує що Tab всередині прихованого слайду не "втече" в нього.
              // inert ефективніше за aria-hidden + tabIndex=-1: він гарантовано блокує всі вкладені фокусовані елементи.
              inert={!isActive}
              // aria-hidden залишається як подвійна гарантія для старих AT
              // (inert підтримується з 2023 в усіх движках, але legacy AT може не знати)
              aria-hidden={!isActive}
              style={slideStyle}
              className={clsx(
                styles.slide,
                classNames.slide,
                isActive && 'slide-active'
              )}
            >
              {slideContent}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SliderTrack