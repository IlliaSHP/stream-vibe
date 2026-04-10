// import { useEffect, useRef, useState } from 'react'
// import { useSlider } from './SliderContext'
// import styles from '../Slider.module.scss'
// import clsx from 'clsx'
//
// const SliderTrack = ({ slides, slideLabels = [], className, slideClassName }) => {
//   const {
//     currentIndex,
//     direction,
//     registerSlides,
//     slidesPerView,
//     loop,
//     goToNext,
//     goToPrev,
//     goToSlide,
//   } = useSlider()
//
//   const LOOP_CLONES = Math.max(1, slidesPerView === 'auto' ? 1 : Math.ceil(slidesPerView))
//
//   const viewportRef = useRef(null)
//   const wrapperRef = useRef(null)    // ← пряме керування transition
//   const [slideSize, setSlideSize] = useState(0)
//
//   /* --- drag state ---
//   Якби використовували тільки state isDraggingState без isDragging — кожен pointermove тригерив би рендер, це дорого.*/
//   const isDragging = useRef(false)
//   const startPos = useRef(0)
//   const [dragOffset, setDragOffset] = useState(0)
//   const [isDraggingState, setIsDraggingState] = useState(false)
//   const isTransitioningRef = useRef(false)
//
//   // Ref для актуального currentIndex — уникає stale closure в transitionEnd
//   const currentIndexRef = useRef(currentIndex)
//   useEffect(() => {
//     currentIndexRef.current = currentIndex
//     console.log('[Slider] currentIndex змінився →', currentIndex)
//   }, [currentIndex])
//
//   const isVertical = direction === 'vertical'
//
//   // --- Loop: будуємо розширений масив слайдів ---
//   //
//   // Без loop:  [0][1][2][3][4]
//   // З loop:    [4*][0][1][2][3][4][0*]
//   //             ↑ клон tail          ↑ клон head
//   //
//   const displaySlides = loop
//     ? [
//       ...slides.slice(-LOOP_CLONES),
//       ...slides,
//       ...slides.slice(0, LOOP_CLONES),
//     ]
//     : slides
//
//   const loopOffset = loop ? LOOP_CLONES : 0
//   const internalIndex = currentIndex + loopOffset
//
//   console.log('[Slider] render | currentIndex:', currentIndex, '| internalIndex:', internalIndex, '| slideSize:', slideSize)
//
//   useEffect(() => {
//     registerSlides(slides.length)
//   }, [slides.length, registerSlides])
//
//   // Вимірювання розміру контейнера
//   useEffect(() => {
//     if (!viewportRef.current) return
//
//     const measure = () => {
//       const el = viewportRef.current
//       if (!el) return
//
//       if (slidesPerView === 'auto') {
//         const firstSlide = el.querySelector(`.${styles.slide}`)
//         if (!firstSlide) return
//         const size = isVertical ? firstSlide.offsetHeight : firstSlide.offsetWidth
//         console.log('[Slider] measure auto | slideSize:', size)
//         setSlideSize(size)
//         return
//       }
//
//       const containerSize = isVertical
//         ? el.clientHeight
//         - parseFloat(getComputedStyle(el).paddingTop)
//         - parseFloat(getComputedStyle(el).paddingBottom)
//         : el.clientWidth
//         - parseFloat(getComputedStyle(el).paddingLeft)
//         - parseFloat(getComputedStyle(el).paddingRight)
//
//       const size = containerSize / slidesPerView
//       console.log('[Slider] measure | containerSize:', containerSize, '| slideSize:', size)
//       setSlideSize(size)
//     }
//
//     measure()
//     // ResizeObserver викликає callback при зміні viewport
//     const ro = new ResizeObserver(measure)
//     ro.observe(viewportRef.current)
//     return () => ro.disconnect()
//   }, [isVertical, slidesPerView])
//
//   // Вимикаємо/вмикаємо transition напряму в DOM — без React state
//   // Це гарантує що браузер застосує transition:none ДО наступного рендеру
//   const disableTransition = () => {
//     if (!wrapperRef.current) return
//     wrapperRef.current.style.transition = 'none'
//     console.log('[Slider] transition → ВИМКНЕНО')
//   }
//
//   const enableTransition = () => {
//     if (!wrapperRef.current) return
//     wrapperRef.current.style.transition = ''
//     console.log('[Slider] transition → УВІМКНЕНО')
//   }
//
//   // Loop: телепортація після анімації
//   const handleTransitionEnd = (e) => {
//     if (e.propertyName !== 'transform') return
//
//     const index = currentIndexRef.current
//     const lastRealIndex = slides.length - 1
//
//     console.log('[Slider] transitionEnd | index:', index, '| lastRealIndex:', lastRealIndex)
//
//     isTransitioningRef.current = false
//
//     if (!loop) return
//
//     if (index > lastRealIndex || index < 0) {
//       const targetIndex = index > lastRealIndex ? 0 : lastRealIndex
//       console.log('[Slider] телепорт | index:', index, '→ targetIndex:', targetIndex)
//
//       disableTransition()   // синхронно — до рендеру React
//       goToSlide(targetIndex)
//
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           enableTransition()
//         })
//       })
//     }
//   }
//
//   // Pointer handlers
//   const getEventPos = (e) => isVertical ? e.clientY : e.clientX
//
//   const handlePointerDown = (e) => {
//     if (isTransitioningRef.current) {
//       console.log('[Slider] pointerDown заблоковано — анімація триває')
//       return
//     }
//     isDragging.current = true
//     startPos.current = getEventPos(e)
//     setIsDraggingState(true)
//     // Захоплюємо pointer — всі наступні події приходять сюди
//     // навіть якщо курсор вийшов за межі елемента
//     e.currentTarget.setPointerCapture(e.pointerId)
//     console.log('[Slider] drag START')
//   }
//
//   const handlePointerMove = (e) => {
//     if (!isDragging.current) return
//     let offset = getEventPos(e) - startPos.current
//
//     if (!loop) {
//       const isAtStart = currentIndex === 0
//       const isAtEnd = currentIndex === slidesCount - 1
//       const RESISTANCE = 0.3 // менше = більший опір
//
//       if ((isAtStart && offset > 0) || (isAtEnd && offset < 0)) {
//         // offset залишається, але зменшується за степеневим законом
//         offset = Math.sign(offset) * Math.pow(Math.abs(offset), RESISTANCE) * 10
//         // або простіше:
//         // offset = offset * 0.2
//       }
//     }
//
//     setDragOffset(offset)
//   }
//
//   const handlePointerUp = (e) => {
//     if (!isDragging.current) return
//     isDragging.current = false
//
//     const delta = getEventPos(e) - startPos.current
//     const threshold = slideSize * 0.3
//
//     console.log('[Slider] drag END | delta:', delta, '| threshold:', threshold)
//
//     setIsDraggingState(false)
//     setDragOffset(0)
//
//     if (isTransitioningRef.current) {
//       console.log('[Slider] pointerUp — перехід заблоковано')
//       return
//     }
//
//     const action = delta < -threshold ? goToNext : delta > threshold ? goToPrev : null
//
//     if (action) {
//       requestAnimationFrame(() => {
//         isTransitioningRef.current = true
//         console.log('[Slider] pointerUp → викликаємо', delta < -threshold ? 'goToNext' : 'goToPrev')
//         action()
//       })
//     }
//   }
//
//   // Transform
//   const isReady = slideSize > 0
//   const baseTranslate = isReady ? -internalIndex * slideSize : 0
//
//   const wrapperStyle = isReady
//     ? isVertical
//       ? {
//         flexDirection: 'column',
//         transform: `translate3d(0, ${baseTranslate + dragOffset}px, 0)`,
//         height: `${displaySlides.length * slideSize}px`,
//       }
//       : {
//         transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)`,
//       }
//     : isVertical
//       ? { flexDirection: 'column' }
//       : {}
//
//   const slideStyle = isReady
//     ? { [isVertical ? 'height' : 'width']: `${slideSize}px` }
//     : {}
//
//   return (
//     <div
//       ref={viewportRef}
//       className={clsx(
//         styles.sliderViewport,
//         isVertical && styles.sliderViewportVertical,
//         styles.sliderViewportDraggable,
//         isDraggingState && styles.sliderViewportDragging,
//       )}
//       style={{ touchAction: isVertical ? 'pan-x' : 'pan-y' }}
//       onDragStart={(e) => e.preventDefault()}  // щоб уникнути неправильного drag на зображенні
//       onPointerDown={handlePointerDown}
//       onPointerMove={handlePointerMove}
//       onPointerUp={handlePointerUp}
//       onPointerCancel={handlePointerUp}
//     >
//       <ul
//         ref={wrapperRef}
//         className={clsx(
//           styles.sliderWrapper,
//           isDraggingState && styles.sliderWrapperDragging,
//           className,
//         )}
//         style={wrapperStyle}
//         onTransitionEnd={handleTransitionEnd}
//       >
//         {/*index в key це нормально для статичних об'єктів, які ніколи не змінюються*/}
//         {displaySlides.map((slideContent, index) => {
//           const realIndex = index - loopOffset
//           // Нормалізуємо realIndex для клонів — щоб aria-label був правильним
//           const normalizedRealIndex = ((realIndex % slides.length) + slides.length) % slides.length
//           const isActive = realIndex === currentIndex
//
//           return (
//             <li
//               key={index}
//               style={slideStyle}
//               className={clsx(
//                 styles.slide,
//                 slideClassName,
//                 isActive && 'slide-active',
//               )}
//               aria-hidden={!isActive}
//               aria-label={
//                 slideLabels[normalizedRealIndex]
//                 ?? `${normalizedRealIndex + 1} of ${slides.length}`
//               }
//               // WAI-ARIA Carousel Pattern вимагає саме комбінацію двох атрибутів:
//               //
//               // role="group" — каже скрін рідеру що це контейнер з групою елементів.
//               //   Без нього <li> оголошується як "listitem", що семантично неточно для слайда.
//               //
//               // aria-roledescription="slide" — замінює голосове оголошення ролі.
//               //   Без нього користувач почує "group 2 of 5" замість "slide 2 of 5".
//               //
//               // Разом вони дають скрін рідеру інструкцію:
//               //   "обробляй як групу, але оголошуй як slide".
//               // Результат: "Hero, slide 2 of 5" — зрозуміло і точно.
//               // Swiper використовує ту саму комбінацію на кожному .swiper-slide.
//               role="group"
//               aria-roledescription="slide"
//             >
//               {slideContent}
//             </li>
//           )
//         })}
//       </ul>
//     </div>
//   )
// }
//
// export default SliderTrack


import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'

// Відповідає тільки за рендер і DOM-анімацію.
// Вся логіка навігації — в SliderRoot через контекст.
//
// Infinite translate механіка (без клонів):
//   wrapper рухається: translate = -currentIndex * step
//   кожен слайд додатково зміщується: offset = k * N * step
//   де k = Math.round((currentIndex - slideIndex) / N)
//   finalPos = slideIndex * step + offset ≈ currentIndex * step
//   → слайд завжди поруч з viewport незалежно від величини currentIndex
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

  // slideSize і gap НЕ зберігаємо в useState бо вони потрібні лише для
  // DOM-маніпуляцій (setDOMTranslate, getSlideOffset) — не для JSX рендеру.
  // Якщо зберігати в state → кожен resize викликає ре-рендер → React
  // перераховує весь JSX → примусовий layout. Ref = нульовий overhead.
  //
  // Виняток: step потрібен в JSX (wrapperStyle, slideStyle) — тому є stepState.
  const slideSizeRef = useRef(0)
  const gapRef= useRef(0)
  const stepRef= useRef(0)

  const [step, setStep] = useState(0)

  // getSlideOffset і handleTransitionEnd читають
  // currentIndexRef.current — значення синхронне, без затримки React render cycle.
  //
  // Проблема без ref: goToSlide(normalized) викликає setState > ре-рендер
  // асинхронний. Між setDOMTranslate і ре-рендером є кадр де wrapper вже на
  // normalized позиції але getSlideOffset ще рахує з старого currentIndex >
  // слайди стоять на "неправильних" offset-ах > мерехтіння.
  //
  // З ref: getSlideOffset читає актуальне значення синхронно, без затримки.
  const currentIndexRef = useRef(currentIndex)
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  // Попередній код: два окремих ref (isSlideAnimating, isSnapBackAnimating).
  // Один enum-ref простіший, неможливо потрапити в стан де обидва true.
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


  // gap читаємо з CSS змінної --slider-gap.
  // Це дозволяє адаптивний gap через adapt() в SCSS — він автоматично
  // підхоплюється при зміні viewport без жодного JS.
  //
  // getComputedStyle в ResizeObserver — нормально: браузер вже перерахував
  // layout перед тим як викликати callback. Forced reflow тут не відбувається.
  //
  // CSS custom properties НЕ навантажують браузер більше ніж звичайні
  // властивості — getComputedStyle однаково дорогий в обох випадках.
  // Для 20 слайдерів на сторінці це абсолютно прийнятно.
  //
  // Розміри зберігаємо в ref (без ре-рендеру) і тільки step пушимо в стейт.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewportRef.current) return

    const measure = () => {
      const el = viewportRef.current
      if (!el) return

      const rawGap = getComputedStyle(el).getPropertyValue('--slider-gap').trim()
      const parsedGap = rawGap ? parseFloat(rawGap) : 0
      gapRef.current  = parsedGap

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

        size = (containerSize - parsedGap * (slidesPerView - 1)) / slidesPerView
      }

      slideSizeRef.current = size
      stepRef.current = size + parsedGap

      // Тільки step пушимо в стейт — він потрібен для JSX (wrapperStyle etc.)
      // Це єдиний ре-рендер від resize, і він необхідний.
      setStep(size + parsedGap)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView])


  // Читає currentIndexRef.current — синхронно, без затримки рендеру.
  // Це виправляє мерехтіння: offset рахується з актуального індексу
  // навіть в момент між setDOMTranslate і React ре-рендером.
  //
  // Залежності: тільки loop і N (стабільні між рендерами).
  // currentIndex навмисно НЕ в залежностях — читаємо через ref.
  const getSlideOffset = useCallback((slideIndex, currentStep) => {
    if (!loop || N === 0 || currentStep === 0) return 0
    const k = Math.round((currentIndexRef.current - slideIndex) / N)
    return k * N * currentStep
  }, [loop, N])

  //todo ─── DOM helpers ──────────────────────────────────────────────────────────
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

  // ─── handleTransitionEnd — нормалізація currentIndex ─────────────────────
  //
  // currentIndex зростає необмежено при швидкому свайпі (100, 200...).
  // Після кожної анімації нормалізуємо до [0, N-1].
  //
  // Порядок операцій критичний:
  //   1. currentIndexRef.current = normalized  ← синхронно, до будь-яких DOM-операцій
  //   2. disableTransition()
  //   3. setDOMTranslate()                     ← wrapper на нову позицію
  //   4. goToSlide(normalized)                 ← React setState (асинхронно)
  //   5. rAF → rAF → enableTransition()
  //
  // Крок 1 гарантує що getSlideOffset (який читає currentIndexRef) вже бачить
  // правильний індекс ще до того як React ре-рендерить компонент.
  // Без цього кроку між кроками 3 і 4 є кадр де offset-и рахуються
  // з старого currentIndex → мерехтіння.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return

    animStateRef.current = 'idle'

    if (!loop) return

    const idx = currentIndexRef.current
    const normalized = ((idx % N) + N) % N
    if (idx === normalized) return

    // 1. Синхронно оновлюємо ref — getSlideOffset одразу бачить нове значення
    currentIndexRef.current = normalized

    // 2-3. Телепортуємо wrapper без анімації
    disableTransition()
    // stepRef.current — актуальний розмір (не closure з рендеру)
    setDOMTranslate(-normalized * stepRef.current)

    // 4. Оновлюємо React стейт — ре-рендер з правильними offset-ами
    goToSlide(normalized)

    // 5. Відновлюємо анімацію після двох rAF (гарантує що browser commit відбувся)
    requestAnimationFrame(() => requestAnimationFrame(enableTransition))
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
    startPos.current   = getEventPos(e)
    setIsDraggingState(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return
    let offset = getEventPos(e) - startPos.current

    // Rubber-band ефект на межах при loop=false
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

    const delta     = getEventPos(e) - startPos.current
    const threshold = slideSizeRef.current * 0.3

    enableTransition()

    const action =
      delta < -threshold ? goToNext :
        delta >  threshold ? goToPrev : null

    if (action) {
      animStateRef.current = 'sliding'
      action()
    } else {
      animStateRef.current = 'snapback'
    }

    setIsDraggingState(false)
    setDragOffset(0)
  }

  // ─── Render values ────────────────────────────────────────────────────────
  const isReady       = step > 0
  const baseTranslate = isReady ? -currentIndex * step : 0
  const wrapperSize   = N * slideSizeRef.current + Math.max(0, N - 1) * gapRef.current

  const wrapperStyle = isReady
    ? isVertical
      ? {
        flexDirection: 'column',
        gap:       `${gapRef.current}px`,
        height:    `${wrapperSize}px`,
        transform: `translate3d(0, ${baseTranslate + dragOffset}px, 0)`,
      }
      : {
        gap:       `${gapRef.current}px`,
        transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)`,
      }
    : isVertical
      ? { flexDirection: 'column', gap: `${gapRef.current}px` }
      : { gap: `${gapRef.current}px` }

  const slideStyle = isReady
    ? { [isVertical ? 'height' : 'width']: `${slideSizeRef.current}px`, flexShrink: 0 }
    : { flexShrink: 0 }

  return (
    <div
      ref={viewportRef}
      className={clsx(
        styles.sliderViewport,
        isVertical && styles.sliderViewportVertical,
        styles.sliderViewportDraggable,
        isDraggingState && styles.sliderViewportDragging,
      )}
      // touch-action керується тут через inline style (залежить від direction)
      // і НЕ дублюється в CSS — inline style завжди виграє над класом.
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
          const offset   = getSlideOffset(index, step)

          const slideTransform = loop && offset !== 0
            ? isVertical
              ? `translate3d(0, ${offset}px, 0)`
              : `translate3d(${offset}px, 0, 0)`
            : undefined

          return (
            <li
              key={index}
              style={slideTransform ? { ...slideStyle, transform: slideTransform } : slideStyle}
              className={clsx(styles.slide, slideClassName, isActive && 'slide-active')}
              aria-hidden={!isActive}
              aria-label={slideLabels[index] ?? `${index + 1} of ${N}`}
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