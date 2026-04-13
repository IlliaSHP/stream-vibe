//! ╔══════════════════════════════════════════════════════════════════╗
//! ║  НАВЧАЛЬНИЙ ФАЙЛ — детальні коментарі до кожної частини коду   ║
//! ║  Робочий код без коментарів: SliderTrack.jsx                   ║
//! ╚══════════════════════════════════════════════════════════════════╝

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

//! Розкоментувати при перегляді.
//! Закоментував бо IDE кидає попередження про дублювання коду



import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSlider } from '../SliderContext'
import styles from '../../Slider.module.scss'

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

  // ─── Чому деякі значення в ref, а деякі в state ──────────────────────────
  //
  // ПРАВИЛО: якщо значення використовується в JSX (впливає на те що відображається)
  // → потрібен state, бо тільки зміна state викликає ре-рендер і оновлює DOM.
  // Якщо значення потрібне тільки в логіці (handlers, DOM-операції)
  // → достатньо ref, без зайвих ре-рендерів.
  //
  // ЛІНТЕР (react-hooks/refs): забороняє читати ref.current під час рендеру,
  // тобто в тілі компонента поза useEffect і event handlers.
  // Причина: ref.current може змінитись між рендерами без повідомлення React,
  // тому JSX з ref.current може показувати застарілі дані.
  // Дозволені місця для ref.current:
  //   ✓ useEffect (після рендеру)
  //   ✓ event handlers (поза циклом рендеру)
  //   ✓ useCallback, useMemo (якщо не викликаються під час рендеру)
  //   ✗ тіло компонента (між useState і return) — лінтер забороняє
  //   ✗ JSX вирази — лінтер забороняє
  //
  // КОНКРЕТНО ТУТ:
  // slideSizeRef, gapRef, stepRef — потрібні в handlers (handleTransitionEnd,
  // handlePointerUp) щоб уникнути stale (застарілий) closure. В JSX НЕ читаються.
  // Їх значення дублюються в metrics state — саме metrics використовується в JSX.
  //
  // Чому не можна обійтись тільки ref без state для slideSize/gap/step:
  // resize → measure() → slideSizeRef.current = 320 → ре-рендеру немає
  // → JSX не оновлюється → слайди залишились старої ширини → зламаний UI.
  // Тільки setMetrics() повідомляє React що треба ре-рендеритись.
  //
  // Чому не можна обійтись тільки state без ref для slideSize/gap/step:
  // State — це snapshot. handleTransitionEnd читає step в момент свого створення
  // (closure). Якщо між рендерами відбувся resize — handler бачить старий step
  // і телепортує wrapper на неправильну позицію. stepRef.current завжди актуальний.
  //
  // ЩО ОЗНАЧАЄ "МІЖ РЕНДЕРАМИ":
  // Рендер React — це не постійний процес. Це окремі короткі моменти
  // які відбуваються у відповідь на зміни (setState, нові пропси).
  // Між рендерами React нічого не робить — просто чекає наступної зміни.
  // Браузер в цей час продовжує жити: завершуються CSS transition,
  // спрацьовують ResizeObserver, setTimeout, requestAnimationFrame.
  //
  // Конкретний сценарій де state дає баг, а ref — ні:
  //
  //   Рендер 1 відбувся: step = 310
  //   handleTransitionEnd створена в цьому рендері, захопила step = 310 (closure)
  //       ↓
  //   ...React нічого не робить, чекає...
  //       ↓
  //   Користувач змінив розмір вікна під час анімації слайдера
  //       ↓
  //   ResizeObserver → measure() → stepRef.current = 300  (синхронно, одразу)
  //                             → setMetrics({step: 300}) (React ПЛАНУЄ рендер)
  //       ↓
  //   ...але Рендер 2 ще не відбувся — React чекає кінця поточного блоку...
  //       ↓
  //   CSS transition завершилась → браузер викликає handleTransitionEnd
  //   handler читає step зі своєї closure → бачить 310 (застаріло!)
  //   handler читає stepRef.current       → бачить 300 (актуально!)
  //       ↓
  //   Рендер 2 відбувся: step = 300
  //
  // Якби handler використовував step зі state (closure) — телепортував би
  // wrapper на -normalized * 310 замість правильного -normalized * 300.
  // stepRef.current не має closure — це пряме читання з об'єкта в пам'яті,
  // значення там вже оновлене measure() ще до того як handler (transitionEnd) викликався.
  // ─────────────────────────────────────────────────────────────────────────────
  const slideSizeRef = useRef(0)
  const gapRef= useRef(0)
  const stepRef= useRef(0)

  // Для JSX рендеру — один об'єкт замість трьох окремих useState.
  //
  // Причина 1 — атомарність:
  // slideSize, gap і step завжди змінюються разом (в одному measure() виклику).
  // Три окремих setState можуть дати проміжний стан де slideSize вже нове
  // а gap ще старе — неправильні розрахунки на один кадр.
  // Один setMetrics — всі три значення змінюються одночасно, завжди консистентно.
  //
  // Причина 2 — батчинг не гарантований поза React handlers:
  // measure() викликається з ResizeObserver — це не React event handler.
  // Три окремих setState тут можуть дати три окремих ре-рендери.
  // Один setMetrics — завжди один ре-рендер незалежно від контексту виклику.
  const [metrics, setMetrics] = useState({ slideSize: 0, gap: 0, step: 0 })

  // useRef повертає звичайний об'єкт { current: value } який живе поза рендерами —
  // той самий об'єкт протягом всього життя компонента.
  //
  // Навіщо ref якщо є стейт:
  // Стейт — це "знімок". Кожен рендер створює нові локальні змінні і функції
  // які захоплюють значення стейту на момент свого створення (closure).
  // DOM event handlers (transitionend, pointermove) викликаються браузером
  // асинхронно — між рендерами, де snapshot вже застарілий.
  //
  // Ref вирішує це: closure захоплює не значення, а посилання на об'єкт.
  // ref.current = нове значення — всі функції що мають це посилання
  // одразу бачать оновлений вміст, без ре-рендеру.
  //
  // Небезпека з асинхронністю:
  // JS однопоточний — поки функція виконується синхронно, ніхто не може
  // змінити ref.current між двома рядками. Але після await або setTimeout
  // інший код може змінити ref — і подальші звернення побачать нове значення.
  // В цьому компоненті всі операції з ref синхронні — проблеми немає.
  const currentIndexRef = useRef(currentIndex)
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  // ─── Стан анімації — enum замість двох булевих ────────────────────────────
  // 'idle' | 'sliding' | 'snapback'
  // Один enum унеможливлює стан де обидва прапори true одночасно.
  // sliding  — йде анімація переходу до наступного/попереднього слайда
  // snapback — йде анімація повернення (користувач відпустив не дотягнувши)
  // idle     — анімацій немає, можна починати новий drag
  const animStateRef = useRef('idle') // 'idle' | 'sliding' | 'snapback'

  // ─── Drag — ref для логіки, state для UI ─────────────────────────────────
  // isDragging і startPos — тільки для внутрішньої логіки handlers.
  // Змінюються до 60 разів на секунду під час drag — ре-рендер не потрібен.
  //
  // dragOffset — напряму в JSX (transform wrapper). Кожна зміна має
  // оновлювати DOM — тому state і ре-рендер необхідні.
  //
  // isDraggingState — впливає на CSS клас (.sliderWrapperDragging вимикає
  // CSS transition під час drag). Змінюється двічі (початок/кінець drag) —
  // ре-рендер виправданий.
  const isDragging = useRef(false)
  const startPos= useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingState, setIsDraggingState] = useState(false)

  const isVertical = direction === 'vertical'
  const N = slides.length

  useEffect(() => {
    registerSlides(slides.length)
  }, [slides.length, registerSlides])


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

        // slidesPerView -1 це gap:
        // [слайд][gap][слайд][gap][слайд]
        // простір для свайпів containerSie - загальні відступи слайдів
        // розміщені одночасно в контейнері і розділити на загальну кількість слайдів,
        // щоб отримати size одного slide
        size = (containerSize - parsedGap * (slidesPerView - 1)) / slidesPerView
      }

      const newStep = size + parsedGap
      slideSizeRef.current = size
      gapRef.current = parsedGap
      stepRef.current = newStep

      setMetrics({ slideSize: size, gap: parsedGap, step: newStep })
    }

    measure()
    // спостереження за змінами розміру не тільки
    // в наслідок зміни розміру вікна браузеру
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView])


  // ─── getSlideOffset ───────────────────────────────────────────────────────
  //
  // Функція отримує currentIdx як аргумент — не читає ref і не замикає стейт.
  // Це дає можливість викликати її з будь-якого контексту і завжди передавати
  // правильне значення явно.
  //
  // ══ CLOSURE — БАЗОВА КОНЦЕПЦІЯ ════════════════════════════════════════════
  //
  // Closure (замикання) — механізм JS де функція "захоплює" змінні
  // з зовнішньої області видимості в момент свого СТВОРЕННЯ і "пам'ятає"
  // їх навіть після того як зовнішня функція завершила виконання.
  //
  // Це фундаментальний і КОРИСНИЙ механізм JS:
  //
  //   Приватні дані — count недоступний зовні:
  //   function makeCounter() {
  //     let count = 0
  //     return {
  //       increment: () => ++count,  // захопила count — корисно
  //       getCount:  () => count,
  //     }
  //   }
  //
  //   Фабрики функцій — кожна пам'ятає свій factor:
  //   const double = makeMultiplier(2)  // захопила factor = 2
  //   const triple = makeMultiplier(3)  // захопила factor = 3
  //
  // Closure дає передбачуваність: функція завжди працює з тими даними
  // з якими була створена. Це перевага в більшості ситуацій.
  //
  // ── ПРИМІТИВИ VS ОБ'ЄКТИ — ЧОМУ ЦЕ ВАЖЛИВО ──────────────────────────────
  //
  // Примітиви (number, string, boolean...) — копіюються при присвоєнні.
  // Closure захоплює КОПІЮ значення — зміна оригіналу не впливає на копію.
  //
  // Об'єкти ({ current: value }) — передаються по посиланню.
  // Closure захоплює ПОСИЛАННЯ — зміна вмісту об'єкта видна всім
  // хто має це посилання.
  //
  //   let count = 5              // примітив
  //   let ref = { current: 5 }  // об'єкт
  //
  //   const fn = () => {
  //     console.log(count)        // захопила КОПІЮ значення 5
  //     console.log(ref.current)  // захопила ПОСИЛАННЯ на об'єкт
  //   }
  //
  //   count = 10
  //   ref.current = 10
  //
  //   fn()
  //   count → 5   (стара копія — stale closure)
  //   ref.current → 10  (актуально — той самий об'єкт в пам'яті)
  //
  // Саме тому useRef вирішує stale closure — ref це об'єкт,
  // closure захоплює посилання а не копію значення.
  //
  // ══ Ref ══════════════════════════════════
  // ref це посилання на коробку, змінюється значення в коробці, а
  // ле посилання завжди статичне (якщо не перестворювати об'єкт),
  // ось чому з різних частин коду можна звернутись до ref і воно буде завжди актуальне.
  // Ref це по суті просто хук в якому є ось такий вміст:
  //
  // {
  //   current: ''
  // }
  //
  // І все, більше нічого, просто пустий об'єкт з ключем current,
  // до current можна звертатись по ключу а в будь-який момент значення може змінитись.
  //
  // ══ ДВА СПОСОБИ ОТРИМАТИ ЗАСТАРІЛІ ДАНІ ══════════════════════════════════
  //
  // 1. STALE CLOSURE ("черстве замикання"):
  //
  //    "Stale" (черствий, протухлий) — closure захопила примітивне значення
  //    яке вже не відповідає актуальному стану.
  //    Stale closure — не баг closure як механізму. Це ситуація де
  //    передбачуваність closure конфліктує з потребою в динамічності.
  //
  //    В контексті React — як це відбувається:
  //
  //      Рендер 1: компонент запустився, currentIndex = 5
  //      handler створений — захопив currentIndex = 5 (КОПІЯ примітива)
  //          ↓
  //      goToNext() → setState(6) → React ПЛАНУЄ новий рендер
  //      [рендер ще не відбувся — React батчить зміни]
  //          ↓
  //      Браузер викликає handler (transitionend, pointermove...)
  //      React не контролює момент цього виклику — він поза React системою
  //      handler читає свій захоплений currentIndex → бачить 5 (застаріло!)
  //      насправді вже має бути 6, але handler фізично не може це побачити —
  //      він тримає власну копію значення з Рендеру 1
  //          ↓
  //      Рендер 2: відбувається ПІСЛЯ handler — новий handler з currentIndex = 6
  //
  //    Чому саме браузерні handlers схильні до цього:
  //    React handlers (onClick, onChange) — React реєструє через event delegation
  //    на #root і контролює момент виконання.
  //    Браузерні події (transitionend, pointermove, ResizeObserver, setTimeout)
  //    React НЕ контролює — викликаються незалежно від циклу рендеру.
  //
  //    Лікування: ref — closure захоплює ПОСИЛАННЯ на { current: value },
  //    а не копію примітива. Зміна .current видна всім хто має посилання.
  //
  // 2. "НЕВИДИМА ЗМІНА" (проблема ref в JSX):
  //
  //    Це НЕ stale closure — значення в ref насправді актуальне.
  //    Але React не знає що воно змінилось → не запускає ре-рендер →
  //    JSX не перечитує ref.current → DOM залишається зі старим відображенням.
  //
  //    resize → ref.current = 280 (реально змінилось)
  //    але ре-рендеру немає → DOM залишається 320px
  //
  //    Симптом схожий (застарілі дані), але причина інша:
  //    не "функція бачить старе" а "React не знає що треба оновитись".
  //
  //    Лікування: state — зміна state сигналізує React запустити ре-рендер.
  //    Без лінтера технічно можна писати ref.current в JSX — але проблема
  //    залишається. Лінтер лише попереджає про неї, не створює її.
  //
  // ── DEPENDENCIES В useCallback/useMemo ───────────────────────────────────
  //
  // Dependencies існують саме через механіку closure.
  // useCallback зберігає функцію між рендерами — але збережена функція
  // тримає closure з моменту свого створення.
  // Якщо не вказати залежності — функція ніколи не перествориться
  // і назавжди тримає старі захоплені значення (stale closure).
  //
  // Deps кажуть React: "якщо ці значення змінились — перестворити функцію
  // з новим closure де захоплені нові актуальні значення".
  //
  //   useCallback(() => console.log(count), [])       // stale closure якщо count змінився
  //   useCallback(() => console.log(count), [count])  // правильно — новий closure при зміні
  //
  //   [] — нормально тільки якщо функція не читає зовнішніх примітивів:
  //   useCallback(() => setCount(prev => prev + 1), [])
  //     setCount від React — гарантовано стабільне посилання, не потребує deps
  //     prev — приходить від React як аргумент, не з closure
  //
  //   Якщо функція читає об'єкти/масиви/функції — додавати їх в deps,
  //   але спочатку стабілізувати через useMemo/useCallback:
  //   const options = useMemo(() => ({ gap }), [gap])  // стабільне посилання
  //   useCallback(() => doSomething(options), [options]) // deps не змінюється кожен рендер
  //
  //   Нестабільний об'єкт в deps → нескінченний цикл:
  //   const obj = { x: 1 }  // новий об'єкт кожен рендер → нова deps → нова функція → ...
  //
  // ══ ЦЕЙ КОМПОНЕНТ ════════════════════════════════════════════════════════
  //
  // getSlideOffset викликається тільки під час рендеру (slides.map):
  //   const offset = getSlideOffset(index, step, currentIndex)
  //   currentIndex — зі стейту. Stale closure тут неможлива:
  //   кожна зміна currentIndex є причиною ре-рендеру — рендер сам
  //   і є наслідком зміни стейту. Пропустити жодне значення неможливо.
  //
  // Якщо в майбутньому getSlideOffset буде викликатись в handler —
  // передавати currentIndexRef.current, а не currentIndex зі стейту.
  //
  // ПІДСУМОК — коли що використовувати:
  //   ref в handler → правильно (вирішує stale closure з примітивами)
  //   ref в JSX    → неправильно (створює "невидиму зміну")
  //   state в JSX  → правильно (React знає про зміну і ре-рендерить)
  //   state в handler → обережно (може бути застарілим між рендерами)
  // ─────────────────────────────────────────────────────────────────────────────
  const getSlideOffset = useCallback((slideIndex, currentStep, currentIdx) => {
    if (!loop || N === 0 || currentStep === 0) return 0
    const k = Math.round((currentIdx - slideIndex) / N)
    return k * N * currentStep
  }, [loop, N])

  // ─── DOM helpers ──────────────────────────────────────────────────────────
  // getComputedStyle(element) — глобальна функція браузера (не метод window спеціально,
  // просто window це глобальний об'єкт і всі глобальні функції доступні через нього).
  // Повертає об'єкт зі всіма CSS властивостями елемента в їх ПОТОЧНОМУ стані —
  // не те що написано в CSS файлі, а те що браузер фактично застосував,
  // включаючи анімовані значення в процесі transition.
  //
  // .transform повертає рядок з матрицею трансформації:
  //   translate3d(100px, 0, 0)  → "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 100,0,0,1)"
  //   translateX(100px)         → "matrix(1, 0, 0, 1, 100, 0)"
  //   translate(100px, 50px)    → "matrix(1, 0, 0, 1, 100, 50)"
  //   (без transform)           → "none"
  //
  // Браузер завжди повертає matrix або matrix3d — незалежно від того
  // чи використовував ти translate, translateX чи translate3d.
  // Це внутрішнє представлення трансформацій в браузері.
  //
  // DOMMatrix парсить цей рядок в об'єкт з іменованими полями.
  // Для 2D матриці matrix(a, b, c, d, tx, ty):
  //   m41 = tx = зміщення по X
  //   m42 = ty = зміщення по Y
  //
  // Навіщо це потрібно: якщо користувач натискає під час CSS transition,
  // нам треба знати де wrapper ФІЗИЧНО зараз (анімований стан),
  // а не де він буде після закінчення анімації.
  // element.style.transform дає кінцеве значення (куди рухається),
  // getComputedStyle дає поточне (де знаходиться прямо зараз).
  //
  // Коли йде CSS transition — елемент фізично знаходиться десь
  // між початком і кінцем анімації. element.style.transform цього
  // не знає — він завжди повертає кінцеве значення.
  // getComputedStyle повертає фактичний поточний стан — те що браузер зараз малює на екрані.
  //
  // Браузер внутрішньо зберігає всі трансформації у вигляді матриці
  // — це його внутрішній формат обчислень. Коли читаєш через
  // getComputedStyle — він повертає своє внутрішнє представлення
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

  // браузер більше не бачить inline override і повертається до CSS класу
  // Тобто Transition "вмикається" — але не тому що я його встановив,
  // а тому що перестав його перевизначати inline стилями.
  const enableTransition = () => {
    if (wrapperRef.current) wrapperRef.current.style.transition = ''
  }


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

    // при швидкому свайпі currentIndex може стати 47. Математично слайдер працює — але зберігати число 47 коли слайдів 3 безглуздо, і при наступних розрахунках float precision може накопичуватись.
    // в JavaScript % для від'ємних чисел повертає від'ємний результат. -1 % 3 = -1, а треба 2. Подвійна операція ((x % N) + N) % N гарантує завжди додатній результат.
    //
    // Float precision
    // Числа з плаваючою крапкою в комп'ютері зберігаються в бінарному форматі.
    // Деякі десяткові числа неможливо записати точно:
    // 0.1 + 0.2  // → 0.30000000000000004, не 0.3
    //
    // У слайдері це може проявитись при великих currentIndex:
    // currentIndex = 10000, step = 310.5
    //   10000 * 310.5  // → 3105000 (точно)
    //
    // Але після багатьох операцій додавання/множення:
    // 310.5 + 310.5 + ... (10000 разів) → може бути 3105000.0000000037
    // Для слайдера ця різниця субпіксельна і непомітна, але теоретично при дуже великих числах може накопичитись.
    //
    // normalized для НОРМАЛІЗАЦІЇ після transitionEnd:
    // Це локальна операція: скинути currentIndex до [0, N-1] після анімації.
    // Тут normalized потрібен щоб зробити setDOMTranslate і goToSlide.
    // realActiveIndex з контексту — це значення з ПОТОЧНОГО рендеру (snapshot).
    // В handleTransitionEnd воно може бути застарілим — та сама closure проблема.
    //
    // normalized рахується з currentIndexRef.current — завжди актуальне.
    // Це принципова різниця для коректної роботи.
    const idx = currentIndexRef.current
    const normalized = ((idx % N) + N) % N
    if (idx === normalized) return // вже нормалізований — нічого робити

    // 1. Синхронно оновлюємо ref — getSlideOffset одразу бачить нове значення
    currentIndexRef.current = normalized

    // 2-3. Телепортуємо wrapper без анімації
    disableTransition()
    // stepRef.current — актуальний розмір (не closure з рендеру)
    setDOMTranslate(-normalized * stepRef.current)

    // 4. Оновлюємо React стейт — ре-рендер з правильними offset-ами.
    //
    // React батчить (batching) зміни стейту: якщо в одному синхронному
    // блоці виконання викликається кілька setState — React не робить
    // окремий рендер для кожного, а групує їх і робить один рендер в кінці.
    //
    // Батчинг працює на рівні одного синхронного ланцюжка викликів —
    // не на рівні компонента. Функція в функції батчиться так само:
    //   outer() → setA(1), inner() → setB(2), setC(3)
    //   результат: один рендер з усіма трьома змінами
    //
    // Батчинг не перетинає асинхронні межі:
    //   setA(1)
    //   setTimeout(() => setB(2), 0)  ← окремий рендер, поза синхронним блоком
    //   setC(3)
    //   результат: рендер 1 (setA + setC), рендер 2 (setB після setTimeout)
    //
    // goToSlide(normalized) — оновлює React state.
    // Розміщений після DOM операцій не тому що порядок впливає на результат —
    // React все одно виконає ре-рендер тільки після завершення всього
    // синхронного блоку (батчинг). Розміщення в кінці — явний намір:
    // спочатку всі синхронні DOM маніпуляції (ref, translate, transition),
    // потім сигнал React що стейт змінився. Це робить код читабельнішим
    // і відображає реальну послідовність: DOM готовий → React наздоганяє.
    //
    // ── ПРОБЛЕМА: BATCHING + ПРЯМИЙ DOM = МЕРЕХТІННЯ ─────────────────────────
    //
    // Тут батчинг стає проблемою. handleTransitionEnd — це колбек браузерного
    // події, React 18 батчить setState навіть всередині нього (автоматичний batching).
    // Послідовність БЕЗ flushSync:
    //   1. disableTransition()           → прямий DOM запис
    //   2. setDOMTranslate(target)       → прямий DOM запис, браузер бачить зміну
    //   3. goToSlide(normalized)         → setState, React ЗАПЛАНУВАВ рендер... але не зараз
    //   --- функція повертає управління ---
    //   4. браузер малює кадр            → wrapper вже на новій позиції (крок 2),
    //                                       але getSlideOffset() слайдів ще повертає
    //                                       старі значення (React ще не рендерив)
    //   Результат: один мигаючий кадр де слайд "не там" → видиме мерехтіння.
    //
    // ── РІШЕННЯ: flushSync ────────────────────────────────────────────────────
    //
    // flushSync — це "escape hatch" з React scheduling системи.
    // flushSync(() => setState(...)) виконує setState синхронно — React рендерить
    // компонент прямо всередині цього виклику, до того як повернути управління
    // в браузер. Після рядка з flushSync DOM вже повністю оновлений.
    //
    // Послідовність З flushSync:
    //   1. disableTransition()                 → прямий DOM запис
    //   2. setDOMTranslate(target)             → wrapper телепортований
    //   3. flushSync(() => goToSlide(norm))    → React рендерить ЗАРАЗ,
    //                                            getSlideOffset() всіх слайдів оновлено
    //   4. браузер малює кадр                 → все синхронно → мерехтіння немає
    //
    // ── НАВАНТАЖЕННЯ ──────────────────────────────────────────────────────────
    //
    // flushSync НЕ важча операція ніж звичайний рендер — різниця лише в тому
    // КОЛИ рендер відбувається: зараз vs трохи пізніше в мікрозадачі.
    // Тут виправдано: викликається раз на transitionEnd (рідко),
    // не в hot path (не в onPointerMove, не в requestAnimationFrame).
    // Порівняно з resize або scroll обробниками — нічого спільного по навантаженню.
    //
    // ── КОЛИ flushSync ВИПРАВДАНИЙ (загальне правило) ─────────────────────────
    //
    // ✓ синхронізація React стейту з прямими DOM маніпуляціями
    // ✓ коли між DOM записом і React рендером браузер встигає намалювати
    //   "неправильний" кадр — зазвичай onTransitionEnd, onAnimationEnd,
    //   або інтеграція зі стороннім JS (THREE.js, GSAP, Swiper.js)
    //
    // ✗ в звичайних event handlers (там батчинг вже працює правильно)
    // ✗ в циклах або hot path (кожен виклик — синхронний рендер → блокує scheduler)
    // ✗ якщо можна обійтись useLayoutEffect (він теж виконується до paint,
    //   але не блокує scheduler — м'якше рішення)
    //
    // ── flushSync В SWIPER/REACT ──────────────────────────────────────────────
    //
    // swiper/react — це обгортка над Swiper.js (написаним на чистому JS).
    // Внутрішній стан Swiper живе поза React деревом, тому при синхронізації
    // JS стану з React деревом використовується ReactDOM.flushSync або його
    // еквівалент. Та сама проблема — та само рішення.
    goToSlide(normalized)

    // 5. Відновлюємо анімацію після двох rAF (гарантує що browser commit відбувся)
    requestAnimationFrame(() => {
      // Ми тут — до Paint і Commit
      // Зміна від "телепортації" ще не намальована
      //
      // Браузер ЗАПЛАНУВАВ малювання нового стану але ще не намалював
      // Якщо тут enableTransition() — браузер може намалювати проміжний стан
      // де transition вже є але "телепортація" ще не зафіксована
      // → анімація від старої позиції до нової → видимий стрибок
      requestAnimationFrame(() => {
        // Другий rAF — вже наступний кадр
        // Paint і Commit першого кадру вже відбулись
        // Браузер намалював і зафіксував позицію -620px
        // Тепер вмикаємо transition — він не бачить різниці
        // бо "стара" позиція для нього вже є -620px (намальована і зафіксована)
        //
        // Перший rAF вже виконався → браузер вже намалював і зафіксував новий стан
        // Тепер безпечно вмикати transition — він буде застосовуватись
        // тільки до майбутніх змін, не до вже намальованого стану
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


    // Rubber-band ефект на межах при loop=false
    //  Math.sign(offset)
    // Повертає 1 або -1 — зберігає напрямок (вліво чи вправо)
    //
    //  Math.abs(offset)
    // Від'ємне значення → позитивне (щоб Math.pow працював правильно)
    //
    //  Math.pow(Math.abs(offset), 0.35)
    //    Степінь менша за 1 — стискає великі числа, але збільшує малі
    //    offset=10  → 10^0.35 = 2.24   (зменшилось)
    //    offset=100 → 100^0.35 = 5.01  (зменшилось сильніше)
    //    offset=200 → 200^0.35 = 6.84  (ще сильніше опір)
    //    Чим далі тягнеш — тим більший опір
    //
    //  * 10
    // Масштабування щоб рух був помітним (без цього значення були б занадто малими)
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

  // ─── Render values ────────────────────────────────────────────────────────
  // Math.max(0, 0 - 1)  // Math.max(0, -1) → 0
  // Без захисту: -1 * gap = від'ємне число → wrapper від'ємної висоти
  const { slideSize, gap, step } = metrics
  const isReady= step > 0     // перевірка на вміст контенту в слайдах
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


  return (
    <div
      ref={viewportRef}
      // tabIndex={0} — дозволяє отримати фокус клавіатури через Tab.
      // Виправдано тут: section обробляє pointer і keyboard events (drag, стрілки).
      // На нативних інтерактивних елементах (button, input) tabIndex не потрібен.
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
        // ul — семантично правильний список слайдів.
        // Не має власного aria-* — скрінрідер оголошує його як список.
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

          const slideTransform = loop && offset !== 0
            ? isVertical
              ? `translate3d(0, ${offset}px, 0)`
              : `translate3d(${offset}px, 0, 0)`
            : undefined

          return (
            <li
              key={index}
              // role="group" — перевизначає стандартний "listitem".
              // Каже скрінрідеру: це група пов'язаного контенту, а не просто елемент списку.
              // W3C APG: кожен слайд має role="group" + aria-roledescription="slide".
              role="group"
              // aria-roledescription="slide" — людська назва для role="group".
              // Разом дають: скрінрідер оголошує "слайд 1 з 3" замість "елемент списку 1 з 3".
              // Примітка: label не має містити слово "slide" — aria-roledescription вже це робить.
              aria-roledescription="slide"
              style={slideTransform ? { ...slideStyle, transform: slideTransform } : slideStyle}
              className={clsx(styles.slide, slideClassName, isActive && 'slide-active')}
              // aria-hidden — приховує неактивні слайди від скрінрідера.
              // Без цього скрінрідер оголошує всі слайди підряд навіть невидимі.
              aria-hidden={!isActive}
              // inert — повністю вимикає неактивний слайд: Tab, клік, скрінрідер.
              // Без inert: посилання і кнопки всередині прихованого слайда
              // все одно потрапляють в Tab порядок — користувач натискає Tab
              // і фокус "зникає" на невидимому елементі.
              // Підтримка: всі сучасні браузери з 2023 року.
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

 */