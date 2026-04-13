import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'
import {flushSync} from 'react-dom'

const SliderTrack = ({ slides, slideLabels = [], className, slideClassName }) => {
  const {
    currentIndex,
    realActiveIndex,
    direction,
    registerSlides,
    slidesPerView,
    loop,
    goToNext,
    goToPrev,
    goToSlide,
  } = useSlider()

  const viewportRef = useRef(null)
  const wrapperRef  = useRef(null)

  const slideSizeRef = useRef(0)
  const gapRef= useRef(0)
  const stepRef= useRef(0)

  const [metrics, setMetrics] = useState({ slideSize: 0, gap: 0, step: 0 })

  const currentIndexRef = useRef(currentIndex)
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  const animStateRef = useRef('idle') // 'idle' | 'sliding' | 'snapback'

  const isDragging = useRef(false)
  const startPos= useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingState, setIsDraggingState] = useState(false)

  const isVertical = direction === 'vertical'
  const N = slides.length

  useEffect(() => {
    registerSlides(slides.length)
  }, [slides.length, registerSlides])

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

      let size
      if (slidesPerView === 'auto') {
        const firstSlide = el.querySelector('.' + styles.slide)
        if (!firstSlide) return
        size = isVertical ? firstSlide.offsetHeight : firstSlide.offsetWidth
      } else {
        const containerSize = isVertical
          ? el.clientHeight
          - parseFloat(getComputedStyle(el).paddingTop)
          - parseFloat(getComputedStyle(el).paddingBottom)
          : el.clientWidth
          - parseFloat(getComputedStyle(el).paddingLeft)
          - parseFloat(getComputedStyle(el).paddingRight)

        console.log('[SliderTrack measure]', {
          parsedGap,
          containerSize,
          slidesPerView,
          isVertical,
        })

        size = (containerSize - parsedGap * (slidesPerView - 1)) / slidesPerView
      }

      const newStep = size + parsedGap
      slideSizeRef.current = size
      gapRef.current = parsedGap
      stepRef.current = newStep

      setMetrics({ slideSize: size, gap: parsedGap, step: newStep })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView])

  const getSlideOffset = useCallback((slideIndex, currentStep, currentIdx) => {
    if (!loop || N === 0 || currentStep === 0) return 0
    const k = Math.round((currentIdx - slideIndex) / N)
    return k * N * currentStep
  }, [loop, N])

  const getComputedTranslate = () => {
    if (!wrapperRef.current) return 0
    const matrix = new DOMMatrix(window.getComputedStyle(wrapperRef.current).transform)
    return isVertical ? matrix.m42 : matrix.m41
  }

  const setDOMTranslate = (px) => {
    if (!wrapperRef.current) return
    wrapperRef.current.style.transform = isVertical
      ? `translate3d(0, ${px}px, 0)`
      : `translate3d(${px}px, 0, 0)`
  }

  const disableTransition = () => {
    if (wrapperRef.current) wrapperRef.current.style.transition = 'none'
  }

  const enableTransition = () => {
    if (wrapperRef.current) wrapperRef.current.style.transition = ''
  }

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return
    animStateRef.current = 'idle'
    if (!loop) return

    const idx = currentIndexRef.current
    const normalized = ((idx % N) + N) % N

    console.log('[transitionEnd]', { idx, normalized, isSame: idx === normalized })

    if (idx === normalized) return // вже нормалізований — нічого робити

    // 1. Синхронно оновлюємо ref — getSlideOffset одразу бачить нове значення
    currentIndexRef.current = normalized

    // 2-3. Телепортуємо wrapper без анімації
    disableTransition()
    // stepRef.current — актуальний розмір (не closure з рендеру)
    const targetTranslate = -normalized * stepRef.current
    console.log('[teleport]', { from: idx, to: normalized, targetTranslate })
    setDOMTranslate(targetTranslate)

    // Фікс кадру між ре-рендерами (мерехтіння)
    flushSync(() => goToSlide(normalized))

    // 5. Відновлюємо анімацію після двох rAF (гарантує що browser commit відбувся)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('[enableTransition] transform зараз:', wrapperRef.current?.style.transform)
        enableTransition()
      })
    })
  }

  // ─── Pointer events ───────────────────────────────────────────────────────
  const getEventPos = (e) => isVertical ? e.clientY : e.clientX

  const handlePointerDown = (e) => {
    if (animStateRef.current !== 'idle') {
      // Перехоплюємо поточну CSS-позицію і миттєво зупиняємо анімацію
      const liveTranslate = getComputedTranslate()
      disableTransition()
      setDOMTranslate(liveTranslate)
      animStateRef.current = 'idle'
    }

    isDragging.current = true
    startPos.current = getEventPos(e)
    setIsDraggingState(true)
    // Захоплюємо pointer — всі наступні події приходять сюди
    // навіть якщо курсор вийшов за межі елемента
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return
    let offset = getEventPos(e) - startPos.current

    if (!loop) {
      const isAtStart = currentIndexRef.current === 0
      const isAtEnd   = currentIndexRef.current === N - 1
      if ((isAtStart && offset > 0) || (isAtEnd && offset < 0)) {
        offset = Math.sign(offset) * Math.pow(Math.abs(offset), 0.35) * 10
      }
    }

    setDragOffset(offset)
  }

  const handlePointerUp = (e) => {
    if (!isDragging.current) return
    isDragging.current = false

    const delta= getEventPos(e) - startPos.current
    const threshold = slideSizeRef.current * 0.3

    enableTransition()

    const action =
      delta < -threshold ? goToNext :
        delta >  threshold ? goToPrev : null

    if (action) {
      animStateRef.current = 'sliding'
      action()
    } else {
      animStateRef.current = 'snapback' // йде анімація повернення на місце (користувач відпустив не дотягнувши)
    }

    setIsDraggingState(false)
    setDragOffset(0)
  }

  const { slideSize, gap, step } = metrics
  const isReady= step > 0
  const baseTranslate= isReady ? -currentIndex * step : 0
  const wrapperSize = N * slideSize + Math.max(0, N - 1) * gap

  const wrapperStyle = isReady
    ? isVertical
      ? {
        flexDirection: 'column',
        height: `${wrapperSize}px`,
        transform: `translate3d(0, ${baseTranslate + dragOffset}px, 0)`,
      }
      : {
        transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)`,
      }
    : isVertical
      ? { flexDirection: 'column' }
      : {}

  const slideStyle = isReady
    ? { [isVertical ? 'height' : 'width']: `${slideSize}px`, flexShrink: 0 }
    : { flexShrink: 0 }

  console.log('[SliderTrack render]', { currentIndex, step, baseTranslate, isReady });

  return (
    <div
      ref={viewportRef}
      className={clsx(
        styles.sliderViewport,
        isVertical && styles.sliderViewportVertical,
        styles.sliderViewportDraggable,
        isDraggingState && styles.sliderViewportDragging,
      )}
      style={{ touchAction: isVertical ? 'pan-x' : 'pan-y' }}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <ul
        ref={wrapperRef}
        className={clsx(
          styles.sliderWrapper,
          isDraggingState && styles.sliderWrapperDragging,
          className,
        )}
        style={wrapperStyle}
        onTransitionEnd={handleTransitionEnd}
      >

        {slides.map((slideContent, index) => {
          const isActive = index === realActiveIndex
          const offset   = getSlideOffset(index, step, currentIndex)

          if (offset !== 0) console.log('[slide offset]', { index, offset, currentIndex })

          const slideTransform = loop && offset !== 0
            ? isVertical
              ? `translate3d(0, ${offset}px, 0)`
              : `translate3d(${offset}px, 0, 0)`
            : undefined

          return (
            <li
              key={index}
              role="group"
              aria-roledescription="slide"
              style={slideTransform ? { ...slideStyle, transform: slideTransform } : slideStyle}
              className={clsx(styles.slide, slideClassName, isActive && 'slide-active')}
              aria-hidden={!isActive}
              inert={!isActive}  // блокує Tab і взаємодію для прихованих
              aria-label={slideLabels[index] ?? `${index + 1} of ${N}`}
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