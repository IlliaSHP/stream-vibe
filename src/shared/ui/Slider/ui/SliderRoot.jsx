// import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
// import clsx from 'clsx'
// import { SliderContext } from './SliderContext'
// import styles from '../Slider.module.scss'
//
// /**
//  * SliderRoot — кореневий компонент слайдера.
//  * Створює контекст з усією логікою — дочірні компоненти
//  * (SliderTrack, SliderPrevButton, SliderNextButton, SliderDots)
//  * читають з нього автоматично без передачі пропсів вручну.
//  *
//  * Патерн: Compound Components (Radix UI, shadcn/ui використовують те саме).
//  *
//  * @param {ReactNode}  children
//  *
//  * @param {string}     [direction='horizontal']
//  * @param {boolean}    [autoplay=false]
//  * @param {number}     [autoplayDelay=4000]
//  * @param {boolean}    [loop=true]
//  * @param {string}     [label='Slider']       - aria-label для кореневого елемента
//  * @param {string}     [className]
//  * @param {React.Ref}  ref                    - Надає goToNext, goToPrev, goToSlide ззовні
//  */
// const SliderRoot = forwardRef(({
//    children,
//    direction = 'horizontal',
//    slidesPerView = 1,
//    autoplay = false,
//    autoplayDelay = 4000,
//    loop = true,
//    label = 'Slider',
//    className,
//  }, ref) => {
//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [slidesCount, setSlidesCount] = useState(0)
//   const timerRef = useRef(null)
//
//   const prefersReducedMotion =
//     typeof window !== 'undefined'
//       ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
//       : false
//
//
//   // Для loop=false — обмежуємо межами масиву
//   const goToNext = useCallback(() => {
//     setCurrentIndex(prev => {
//       const isLast = prev === slidesCount - 1
//       if (!loop && isLast) {
//         return prev
//       }
//       return isLast ? 0 : prev + 1
//     })
//   }, [loop, slidesCount])
//
//   const goToPrev = useCallback(() => {
//     setCurrentIndex(prev => {
//       const isFirst = prev === 0
//       if (!loop && isFirst) {
//         return prev
//       }
//       return isFirst ? slidesCount - 1 : prev - 1
//     })
//   }, [loop, slidesCount])
//
//   // Для loop=true — дозволяємо виходити за межі,
//   // SliderTrack телепортує після завершення анімації
//   const loopGoToNext = useCallback(() => {
//     setCurrentIndex(prev => prev + 1)
//   }, [])
//
//   const loopGoToPrev = useCallback(() => {
//     setCurrentIndex(prev => prev - 1)
//   }, [])
//
//   const goToSlide = useCallback(index => {
//     setCurrentIndex(index)
//   }, [])
//
//
//
//   const registerSlides = useCallback(count => {
//     setSlidesCount(count)
//   }, [])
//
//   // Публічні методи — те що виходить назовні через ref і контекст
//   const publicGoToNext = loop ? loopGoToNext : goToNext
//   const publicGoToPrev = loop ? loopGoToPrev : goToPrev
//
//
//
//   // useImperativeHandle контролює що саме потрапляє в ref.current
//   // коли батьківський компонент робить: const sliderRef = useRef()
//   //                                      <SliderRoot ref={sliderRef} />
//   //
//   // Без цього хука ref.current вказував би на DOM елемент <div>.
//   // З ним — ref.current містить об'єкт з методами які ми самі визначили.
//   //
//   // Використання ззовні:
//   //   sliderRef.current.goToNext()
//   //   sliderRef.current.goToPrev()
//   //   sliderRef.current.goToSlide(2)
//   //
//   // ref — приходить через forwardRef(({ ... }, ref) => ...)
//   // Другий аргумент () => ({...}) — фабрика що повертає публічний API
//   // Третій аргумент — залежності як в useCallback, оновлює API при їх зміні
//   useImperativeHandle(ref, () => ({
//     goToNext: publicGoToNext,
//     goToPrev: publicGoToPrev,
//     goToSlide,
//   }), [publicGoToNext, publicGoToPrev, goToSlide])
//
//   useEffect(() => {
//     if (!autoplay || prefersReducedMotion) return
//
//     timerRef.current = setInterval(publicGoToNext, autoplayDelay)
//     return () => clearInterval(timerRef.current)
//
//   }, [autoplay, autoplayDelay, publicGoToNext, prefersReducedMotion])
//
//   return (
//     <SliderContext.Provider value={{
//       currentIndex,
//       slidesCount,
//       direction,
//       slidesPerView,
//       loop,
//       goToNext: publicGoToNext,   // ← кнопки в контексті теж отримують правильні
//       goToPrev: publicGoToPrev,
//       goToSlide,
//       registerSlides,
//       label,
//     }}>
//       <div
//         aria-label={label}
//         aria-roledescription="carousel"
//         className={clsx(styles.sliderRoot, className)}
//       >
//         {children}
//       </div>
//     </SliderContext.Provider>
//   )
// })
//
// // displayName явно задає ім'я компонента для React DevTools.
// // forwardRef і memo збивають автовизначення імені —
// // без цього рядка в DevTools буде відображатись 'ForwardRef'
// // замість зрозумілого 'SliderRoot', що ускладнює дебагінг.
// SliderRoot.displayName = 'SliderRoot'
//
// export default SliderRoot




import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { normalizeIndex } from '../lib/normalizeIndex'
import clsx from 'clsx'
import { SliderContext } from './SliderContext'
import styles from '../Slider.module.scss'

// Виносимо за межі компонента: це singleton-значення, воно не залежить від
// пропсів чи стейту — немає сенсу перераховувати при кожному рендері.
// Слухаємо зміну через MediaQueryList.addEventListener щоб реагувати в реальному
// часі (користувач може змінити налаштування ОС під час сесії).
let _prefersReducedMotion = false
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  _prefersReducedMotion = mq.matches
  mq.addEventListener('change', (e) => { _prefersReducedMotion = e.matches })
}

// Відповідає тільки за логіку: currentIndex, autoplay, навігація.
// Не рендерить жодної розмітки слайдів — тільки обгортковий div і Provider.
/**
 * @prop {Object} classNames - Кастомні класи для частин слайдера
 * @prop {string} classNames.root       - Кореневий контейнер (SliderRoot)
 * @prop {string} classNames.viewport   - Viewport (overflow: hidden)
 * @prop {string} classNames.wrapper    - Flex-контейнер слайдів
 * @prop {string} classNames.slide      - Кожен слайд (li елемент)
 * @prop {string} classNames.prevBtn    - Кнопка "назад"
 * @prop {string} classNames.nextBtn    - Кнопка "вперед"
 * @prop {string} classNames.dotsWrap   - Контейнер пагінації
 * @prop {string} classNames.dot        - Одна точка пагінації
 */
const SliderRoot = forwardRef(({
   children,
   direction    = 'horizontal',
   slidesPerView = 1,
   autoplay     = false,
   autoplayDelay = 4000,
   loop         = true,
   centeredSlides = false,
   label        = 'Slider',
   className,
 }, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slidesCount, setSlidesCount]   = useState(0)

  const timerRef = useRef(null)

  // При loop=true currentIndex росте/падає необмежено.
  // Нормалізація до [0, N-1] відбувається в SliderTrack після transitionEnd —
  // це дозволяє швидко листати без стрибків.
  //
  // При loop=false — жорсткі межі через Math.min/max.
  const goToNext = useCallback(() => {
    setCurrentIndex(prev =>
      loop ? prev + 1 : Math.min(prev + 1, slidesCount - 1)
    )
  }, [loop, slidesCount])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev =>
      loop ? prev - 1 : Math.max(prev - 1, 0)
    )
  }, [loop])

  const goToSlide = useCallback(index => setCurrentIndex(index), [])

  const registerSlides = useCallback(count => setSlidesCount(count), [])

  // ─── Зовнішній API через ref ─────────────────────────────────────────────────
  // useImperativeHandle дозволяє батьківському компоненту викликати
  // goToNext/goToPrev/goToSlide напряму через ref — як в HeroSection.
  // ─────────────────────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    goToNext,
    goToPrev,
    goToSlide,
  }), [goToNext, goToPrev, goToSlide])

  // ─── Autoplay ────────────────────────────────────────────────────────────────
  // Зупиняємо при prefersReducedMotion — WCAG 2.1 вимога.
  // startAutoplay/stopAutoplay винесені в useCallback щоб передати в контекст
  // для pause on hover/focus з SliderRoot або будь-якого дочірнього компонента.
  // ─────────────────────────────────────────────────────────────────────────────
  const startAutoplay = useCallback(() => {
    if (!autoplay || _prefersReducedMotion) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(goToNext, autoplayDelay)
  }, [autoplay, autoplayDelay, goToNext])

  const stopAutoplay = useCallback(() => {
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    startAutoplay()
    return stopAutoplay
  }, [startAutoplay, stopAutoplay])

  // ─── Context value ───────────────────────────────────────────────────────────
  // useMemo критично важливий тут: без нього при кожному рендері SliderRoot
  // (а він рендериться при кожній зміні currentIndex) створюється новий об'єкт
  // контексту → всі споживачі (SliderDots, SliderButtons, SliderTrack)
  // ре-рендеряться навіть якщо їх пропси не змінились.
  //
  // realActiveIndex — нормалізований індекс для споживачів.
  // Dots і Buttons мають бачити [0, N-1], а не необмежено зростаючий currentIndex.
  // SliderTrack отримує сирий currentIndex бо він потрібен для getSlideOffset.
  // ─────────────────────────────────────────────────────────────────────────────
  const realActiveIndex = normalizeIndex(currentIndex, slidesCount)

  const contextValue = useMemo(() => ({
    currentIndex,      // сирий — для SliderTrack (getSlideOffset, translate)
    realActiveIndex,   // нормалізований — для Dots, Buttons
    slidesCount,
    direction,
    slidesPerView,
    loop,
    centeredSlides,
    goToNext,
    goToPrev,
    goToSlide,
    registerSlides,
    startAutoplay,
    stopAutoplay,
    label,
  }), [
    currentIndex,
    realActiveIndex,
    slidesCount,
    direction,
    slidesPerView,
    loop,
    centeredSlides,
    goToNext,
    goToPrev,
    goToSlide,
    registerSlides,
    startAutoplay,
    stopAutoplay,
    label,
  ])

  return (
    <SliderContext.Provider value={contextValue}>
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        // role="region" — семантично правильна роль для каруселі за W3C APG.
        // Створює landmark region — скрінрідер додає в список навігації по сторінці.
        // Лінтер (jsx-a11y) за замовчуванням не дозволяє tabIndex і onKeyDown
        // на "не-інтерактивних" ролях — але region є інтерактивним для навігації.
        // Вирішення: налаштувати лінтер в eslint.config.js додавши 'region' до
        // дозволених ролей для no-noninteractive-tabindex і no-noninteractive-element-interactions.
        // Це правильніше ніж hackувати семантику через role="application" чи eslint-disable.
        role="region"
        // aria-label — унікальна назва цієї каруселі на сторінці.
        // Споживач передає осмислену назву: "Hero", "Featured products", "Reviews".
        // Скрінрідер використовує для навігації між landmark regions.
        aria-label={label}
        // aria-roledescription="carousel" — каже скрінрідеру що це карусель.
        // W3C APG: розміщується на головному контейнері що охоплює всі елементи каруселі.
        // Скрінрідер оголосить: "Hero, carousel" замість просто "Hero, region".
        // Примітка: label не має містити слово "carousel" — aria-roledescription вже це робить.
        aria-roledescription="carousel"
        // клавіатурна навігація стрілками потребує фокусованого елемента.
        // Якщо слайдер не може отримати фокус — стрілки не працюватимуть.
        tabIndex={0}
        className={clsx(styles.sliderRoot, className)}
        // onMouseEnter/Leave — зупиняємо autoplay при hover.
        // WCAG 2.1 критерій 2.2.2: рухомий контент можна зупинити.
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
        onFocus={stopAutoplay}
        onBlur={startAutoplay}
        // Клавіатурна навігація — стрілки переключають слайди.
        // preventDefault() — запобігає скролу сторінки при навігації стрілками.
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToNext() }
          if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goToPrev() }
        }}
      >
        {children}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </SliderContext.Provider>
  )
})

// displayName явно задає ім'я компонента для React DevTools.
// forwardRef і memo збивають автовизначення імені —
// без цього рядка в DevTools буде відображатись 'ForwardRef'
// замість зрозумілого 'SliderRoot', що ускладнює дебагінг.
SliderRoot.displayName = 'SliderRoot'
export default SliderRoot