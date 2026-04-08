import { useEffect, useRef, useState } from 'react'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'
import clsx from 'clsx'

const SliderTrack = ({ slides, slideLabels = [], className, slideClassName }) => {
  const {
    currentIndex,
    direction,
    registerSlides,
    slidesPerView,
    loop,
    goToNext,
    goToPrev,
    goToSlide,
  } = useSlider()

  const LOOP_CLONES = Math.max(1, slidesPerView === 'auto' ? 1 : Math.ceil(slidesPerView))

  const viewportRef = useRef(null)
  const wrapperRef = useRef(null)    // ← пряме керування transition
  const [slideSize, setSlideSize] = useState(0)

  /* --- drag state ---
  Якби використовували тільки state isDraggingState без isDragging — кожен pointermove тригерив би рендер, це дорого.*/
  const isDragging = useRef(false)
  const startPos = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const isTransitioningRef = useRef(false)

  // Ref для актуального currentIndex — уникає stale closure в transitionEnd
  const currentIndexRef = useRef(currentIndex)
  useEffect(() => {
    currentIndexRef.current = currentIndex
    console.log('[Slider] currentIndex змінився →', currentIndex)
  }, [currentIndex])

  const isVertical = direction === 'vertical'

  // --- Loop: будуємо розширений масив слайдів ---
  //
  // Без loop:  [0][1][2][3][4]
  // З loop:    [4*][0][1][2][3][4][0*]
  //             ↑ клон tail          ↑ клон head
  //
  const displaySlides = loop
    ? [
      ...slides.slice(-LOOP_CLONES),
      ...slides,
      ...slides.slice(0, LOOP_CLONES),
    ]
    : slides

  const loopOffset = loop ? LOOP_CLONES : 0
  const internalIndex = currentIndex + loopOffset

  console.log('[Slider] render | currentIndex:', currentIndex, '| internalIndex:', internalIndex, '| slideSize:', slideSize)

  useEffect(() => {
    registerSlides(slides.length)
  }, [slides.length, registerSlides])

  // Вимірювання розміру контейнера
  useEffect(() => {
    if (!viewportRef.current) return

    const measure = () => {
      const el = viewportRef.current
      if (!el) return

      if (slidesPerView === 'auto') {
        const firstSlide = el.querySelector(`.${styles.slide}`)
        if (!firstSlide) return
        const size = isVertical ? firstSlide.offsetHeight : firstSlide.offsetWidth
        console.log('[Slider] measure auto | slideSize:', size)
        setSlideSize(size)
        return
      }

      const containerSize = isVertical
        ? el.clientHeight
        - parseFloat(getComputedStyle(el).paddingTop)
        - parseFloat(getComputedStyle(el).paddingBottom)
        : el.clientWidth
        - parseFloat(getComputedStyle(el).paddingLeft)
        - parseFloat(getComputedStyle(el).paddingRight)

      const size = containerSize / slidesPerView
      console.log('[Slider] measure | containerSize:', containerSize, '| slideSize:', size)
      setSlideSize(size)
    }

    measure()
    // ResizeObserver викликає callback при зміні viewport
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView])

  // Вимикаємо/вмикаємо transition напряму в DOM — без React state
  // Це гарантує що браузер застосує transition:none ДО наступного рендеру
  const disableTransition = () => {
    if (!wrapperRef.current) return
    wrapperRef.current.style.transition = 'none'
    console.log('[Slider] transition → ВИМКНЕНО')
  }

  const enableTransition = () => {
    if (!wrapperRef.current) return
    wrapperRef.current.style.transition = ''
    console.log('[Slider] transition → УВІМКНЕНО')
  }

  // Loop: телепортація після анімації
  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return

    const index = currentIndexRef.current
    const lastRealIndex = slides.length - 1

    console.log('[Slider] transitionEnd | index:', index, '| lastRealIndex:', lastRealIndex)

    isTransitioningRef.current = false

    if (!loop) return

    if (index > lastRealIndex || index < 0) {
      const targetIndex = index > lastRealIndex ? 0 : lastRealIndex
      console.log('[Slider] телепорт | index:', index, '→ targetIndex:', targetIndex)

      disableTransition()   // синхронно — до рендеру React
      goToSlide(targetIndex)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          enableTransition()
        })
      })
    }
  }

  // Pointer handlers
  const getEventPos = (e) => isVertical ? e.clientY : e.clientX

  const handlePointerDown = (e) => {
    if (isTransitioningRef.current) {
      console.log('[Slider] pointerDown заблоковано — анімація триває')
      return
    }
    isDragging.current = true
    startPos.current = getEventPos(e)
    setIsDraggingState(true)
    // Захоплюємо pointer — всі наступні події приходять сюди
    // навіть якщо курсор вийшов за межі елемента
    e.currentTarget.setPointerCapture(e.pointerId)
    console.log('[Slider] drag START')
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return
    const offset = getEventPos(e) - startPos.current
    setDragOffset(offset)
  }

  const handlePointerUp = (e) => {
    if (!isDragging.current) return
    isDragging.current = false

    const delta = getEventPos(e) - startPos.current
    const threshold = slideSize * 0.3

    console.log('[Slider] drag END | delta:', delta, '| threshold:', threshold)

    setIsDraggingState(false)
    setDragOffset(0)

    if (isTransitioningRef.current) {
      console.log('[Slider] pointerUp — перехід заблоковано')
      return
    }

    const action = delta < -threshold ? goToNext : delta > threshold ? goToPrev : null

    if (action) {
      requestAnimationFrame(() => {
        isTransitioningRef.current = true
        console.log('[Slider] pointerUp → викликаємо', delta < -threshold ? 'goToNext' : 'goToPrev')
        action()
      })
    }
  }

  // Transform
  const isReady = slideSize > 0
  const baseTranslate = isReady ? -internalIndex * slideSize : 0

  const wrapperStyle = isReady
    ? isVertical
      ? {
        flexDirection: 'column',
        transform: `translate3d(0, ${baseTranslate + dragOffset}px, 0)`,
        height: `${displaySlides.length * slideSize}px`,
      }
      : {
        transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)`,
      }
    : isVertical
      ? { flexDirection: 'column' }
      : {}

  const slideStyle = isReady
    ? { [isVertical ? 'height' : 'width']: `${slideSize}px` }
    : {}

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
        {/*index в key це нормально для статичних об'єктів, які ніколи не змінюються*/}
        {displaySlides.map((slideContent, index) => {
          const realIndex = index - loopOffset
          // Нормалізуємо realIndex для клонів — щоб aria-label був правильним
          const normalizedRealIndex = ((realIndex % slides.length) + slides.length) % slides.length
          const isActive = realIndex === currentIndex

          return (
            <li
              key={index}
              style={slideStyle}
              className={clsx(
                styles.slide,
                slideClassName,
                isActive && 'slide-active',
              )}
              aria-hidden={!isActive}
              aria-label={
                slideLabels[normalizedRealIndex]
                ?? `${normalizedRealIndex + 1} of ${slides.length}`
              }
              // WAI-ARIA Carousel Pattern вимагає саме комбінацію двох атрибутів:
              //
              // role="group" — каже скрін рідеру що це контейнер з групою елементів.
              //   Без нього <li> оголошується як "listitem", що семантично неточно для слайда.
              //
              // aria-roledescription="slide" — замінює голосове оголошення ролі.
              //   Без нього користувач почує "group 2 of 5" замість "slide 2 of 5".
              //
              // Разом вони дають скрін рідеру інструкцію:
              //   "обробляй як групу, але оголошуй як slide".
              // Результат: "Hero, slide 2 of 5" — зрозуміло і точно.
              // Swiper використовує ту саму комбінацію на кожному .swiper-slide.
              role="group"
              aria-roledescription="slide"
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