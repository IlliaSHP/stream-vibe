import {useCallback, useEffect, useMemo, useRef} from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'
import { useSliderMetrics } from '@/shared/ui/Slider/model/useSliderMetrics'
import { useSliderLoop } from '@/shared/ui/Slider/model/useSliderLoop'
import { useSliderDrag } from '@/shared/ui/Slider/model/useSliderDrag'
import { useVisualIndex } from '@/shared/ui/Slider/model/useVisualIndex'
import { normalizeIndex } from '../lib/normalizeIndex'

const calcTranslate = (idx, N, isAutoMode, positions, virtualSize, gap, step) => {
  if (isAutoMode) {
    const i = normalizeIndex(idx, N)
    // Кількість повних циклів — скільки разів вийшли за межі
    const cycles = Math.floor(idx / N)
    return -(positions[i] ?? 0) - cycles * (virtualSize + gap)
  }
  return -idx * step
}

const SliderTrack = ({ slides, slideLabels = [], classNames = {}, }) => {
  const {
    currentIndex,
    direction,
    registerSlides,
    slidesPerView,
    centeredSlides,
    loop,
    transition,
    setIndexRaw,
    setAnimating,
    pauseAutoplay,
    resumeAutoplay,
  } = useSlider()

  const viewportRef = useRef(null)
  const wrapperRef  = useRef(null)
  const currentIndexRef = useRef(currentIndex)

  const animStateRef = useRef('idle') // 'idle' | 'sliding' | 'snapback'
  const isVertical = direction === 'vertical'
  const sourceN = slides.length

  const needsPixelMode = slidesPerView === 'auto' || centeredSlides

  // ── DOM-дублювання для малого N (як у Swiper / Embla) ─────────────────────
  // Virtual clones (transform offset) не дають невидимий телепорт коли
  // N < 2*slidesPerView + 1 — точка розриву збігається з краєм viewport.
  // Рішення: рендеримо слайди кратно, поки ефективне N не пройде поріг.
  // Усі обчислення нижче працюють з ефективним N; sourceN зберігаємо
  // для публічного API (registerSlides, aria-label, dots).
  //
  // auto-mode пропускаємо: там розміри слайдів різні, поріг визначається
  // геометрично, а не математично. Безпечніше не чіпати.
  const slidesPerViewNumeric = typeof slidesPerView === 'number' ? slidesPerView : 1

  // Мінімальна кількість слайдів у DOM, при якій телепорт між циклами
  // (transform-based teleport у getSlideOffset) НЕ потрапляє у viewport.
  //
  // Геометрія: точка телепорту знаходиться на відстані N/2 · step
  // від центру viewport. Щоб вона лежала ЗА межею viewport (V · step),
  // потрібно: N/2 ≥ V → N ≥ 2V. Додаємо +1 щоб мати запас на sub-pixel
  // rounding, easing з overshoot, та крайові пікселі — інакше телепорт
  // може мерехтіти на межі.
  //
  // Якщо sourceN < цього мінімуму — рендеримо слайди кратно, через
  // duplicateFactor = ceil(minLoopSlides / sourceN).
  //
  // Чому не V+2 (інтуїтивно "слайди у viewport + 2 буфери"): для V≥2
  // точка телепорту опиняється всередині viewport — користувач бачить
  // миттєвий стрибок слайду. Перевірено: N=6, V=4, loop=true →
  // слайд 0 стрибає на позицію 3·step (всередині V·step=4·step).
  //
  // Формула фундаментальна для virtual-clones архітектури: вона про
  // геометрію точки телепорту, а не про реалізацію. Зменшити неможливо
  // без переходу на DOM-clones (де клони стоять заздалегідь справа/зліва
  // від оригіналу) — а це інша архітектура зі своїми trade-offs.
  const minLoopSlides = 2 * slidesPerViewNumeric + 1
  const duplicateFactor = loop && !needsPixelMode && sourceN >= 2 && sourceN < minLoopSlides
    ? Math.ceil(minLoopSlides / sourceN)
    : 1

  const renderedSlides = useMemo(
    () => duplicateFactor > 1
      ? Array.from({ length: duplicateFactor }, () => slides).flat()
      : slides,
    [slides, duplicateFactor]
  )
  const N = renderedSlides.length

  useEffect(() => {
    registerSlides(sourceN)
  }, [sourceN, registerSlides])

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

  // Step = slideSize + gap. Для drag-обчислень "скільки слайдів пройдено".
  // В numeric mode stepRef уже = slideSize + gap, у auto — рахуємо для поточного.
  const getCurrentStep = useCallback(() => {
    if (isAutoMode) {
      const i = normalizeIndex(currentIndexRef.current, N)
      return (slideSizesRef.current[i] ?? 0) + gapRef.current
    }
    return stepRef.current
  }, [isAutoMode, N, slideSizesRef, stepRef, gapRef])

  // ── Loop teleport ──────────────────────────────────────────────────────
  const { handleTransitionEnd, armSafetyTimer } = useSliderLoop({
    wrapperRef,
    loop,
    N,
    duration: transition.duration,
    setIndex: setIndexRaw,
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
    setIndex: setIndexRaw,
    getCurrentSlideSize,
    getCurrentStep,
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
  const getSlideOffset = useCallback((slideIndex, renderIdx, virtualSize, gap, step) => {
    if (N === 0) return 0

    // При loop=false телепорт працює ТІЛЬКИ коли сам currentIndex вийшов
    // за межі [0, N-1] — це може статись лише через Strategy B autoplay.
    // Drag може тимчасово гнати renderIdx за межі через dragOffset,
    // але currentIndex при цьому стоїть на місці, отже телепорт не потрібен.
    if (!loop && currentIndex >= 0 && currentIndex <= N - 1) return 0

    const effectiveStep = isAutoMode ? (virtualSize + gap) : (N * step)
    if (effectiveStep === 0) return 0
    const k = Math.round((renderIdx - slideIndex) / N)
    if (k === 0) return 0
    return k * effectiveStep
  }, [N, isAutoMode, loop, currentIndex])

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

    animStateRef.current = 'sliding'
    setAnimating(true)
    armSafetyTimer()
  }, [currentIndex])

  useEffect(() => {
    if (isDraggingState) pauseAutoplay()
    else resumeAutoplay()
  }, [isDraggingState, pauseAutoplay, resumeAutoplay])

  const internalActiveIndex = N > 0 ? normalizeIndex(currentIndex, N) : 0
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
        {/*{slides.map((slideContent, index) => {*/}
        {renderedSlides.map((slideContent, index) => {

          // sourceIndex — куди вказує цей DOM-слайд у вихідному масиві slides.
          // Потрібен для aria-label і slideLabels (публічний контракт у source-space).
          const sourceIndex = duplicateFactor > 1 ? index % sourceN : index
          // isVisuallyActive — чи це САМЕ та копія, що зараз у viewport.
          // Тільки одна копія активного source-слайду буде видима — її і робимо
          // tabbable та non-inert. Інші копії off-screen, для AT вони закриті.
          const isVisuallyActive = index === internalActiveIndex

          const offset = getSlideOffset(index, renderIndex, virtualSize, gap, step)

          const slideTransform = offset !== 0
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
              key={index}                                        // ← index, не sourceIndex (можуть дублюватись)
              // role="group" — групує контент слайду як одне ціле для AT.
              role="group"
              // aria-roledescription="slide" — скрінрідер скаже "slide" замість "group".
              aria-roledescription="slide"
              // aria-label="2 of 5" — APG рекомендує саме такий формат для каруселі.
              // Допомагає користувачу орієнтуватись в загальній кількості.
              aria-label={slideLabels[sourceIndex] ?? `${sourceIndex + 1} of ${sourceN}`}
              // tabIndex — активний слайд у Tab-послідовності.
              // Користувач Tab-ає → фокус на активному слайді → стрілки працюють.
              // Неактивні tabIndex={-1} (програмно фокусуємі, але не через Tab).
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={isVisuallyActive ? 0 : -1}
              // inert — повністю вимикає неактивні слайди для AT і інтеракції.
              // Це гарантує що Tab всередині прихованого слайду не "втече" в нього.
              // inert ефективніше за aria-hidden + tabIndex=-1: він гарантовано блокує всі вкладені фокусовані елементи.
              inert={!isVisuallyActive}
              // aria-hidden залишається як подвійна гарантія для старих AT
              // (inert підтримується з 2023 в усіх движках, але legacy AT може не знати)
              aria-hidden={!isVisuallyActive}
              style={slideStyle}
              className={clsx(
                styles.slide,
                classNames.slide,
                isVisuallyActive && 'slide-active'
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