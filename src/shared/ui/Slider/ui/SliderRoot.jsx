import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import clsx from 'clsx'
import { SliderContext } from './SliderContext'
import styles from '../Slider.module.scss'

/**
 * SliderRoot — кореневий компонент слайдера.
 * Створює контекст з усією логікою — дочірні компоненти
 * (SliderTrack, SliderPrevButton, SliderNextButton, SliderDots)
 * читають з нього автоматично без передачі пропсів вручну.
 *
 * Патерн: Compound Components (Radix UI, shadcn/ui використовують те саме).
 *
 * @param {ReactNode}  children
 *
 * @param {string}     [direction='horizontal']
 * @param {boolean}    [autoplay=false]
 * @param {number}     [autoplayDelay=4000]
 * @param {boolean}    [loop=true]
 * @param {string}     [label='Slider']       - aria-label для кореневого елемента
 * @param {string}     [className]
 * @param {React.Ref}  ref                    - Надає goToNext, goToPrev, goToSlide ззовні
 */
const SliderRoot = forwardRef(({
   children,
   direction = 'horizontal',
   slidesPerView = 1,
   autoplay = false,
   autoplayDelay = 4000,
   loop = true,
   label = 'Slider',
   className,
 }, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const [slidesCount, setSlidesCount] = useState(0)
  const timerRef = useRef(null)

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const isLast = prev === slidesCount - 1
      if (!loop && isLast) {
        return prev
      }
      return isLast ? 0 : prev + 1
    })
  }, [loop, slidesCount])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => {
      const isFirst = prev === 0
      if (!loop && isFirst) {
        return prev
      }
      return isFirst ? slidesCount - 1 : prev - 1
    })
  }, [loop, slidesCount])

  const goToSlide = useCallback(index => {
    setCurrentIndex(index)
  }, [])

  // Дозволяє SliderTrack повідомити скільки слайдів він отримав.
  // registerSlides — публічний метод для SliderTrack щоб повідомити
  // скільки слайдів він отримав. Виглядає як обгортка над setSlidesCount,
  // але це свідоме рішення:
  //
  // 1. Інкапсуляція: setSlidesCount — внутрішній setter React стану,
  //    він не повинен виходити назовні через контекст. registerSlides
  //    описує намір ("зареєструй кількість"), а не деталь реалізації.
  //
  // 2. Розширюваність: якщо в майбутньому при зміні кількості слайдів
  //    потрібно скинути поточний індекс або виконати іншу логіку —
  //    змінюємо тільки registerSlides, SliderTrack не чіпаємо.
  const registerSlides = useCallback(count => {
    setSlidesCount(count)
  }, [])

  // useImperativeHandle контролює що саме потрапляє в ref.current
  // коли батьківський компонент робить: const sliderRef = useRef()
  //                                      <SliderRoot ref={sliderRef} />
  //
  // Без цього хука ref.current вказував би на DOM елемент <div>.
  // З ним — ref.current містить об'єкт з методами які ми самі визначили.
  //
  // Використання ззовні:
  //   sliderRef.current.goToNext()
  //   sliderRef.current.goToPrev()
  //   sliderRef.current.goToSlide(2)
  //
  // ref — приходить через forwardRef(({ ... }, ref) => ...)
  // Другий аргумент () => ({...}) — фабрика що повертає публічний API
  // Третій аргумент — залежності як в useCallback, оновлює API при їх зміні
  useImperativeHandle(ref, () => ({
    goToNext,
    goToPrev,
    goToSlide,
  }), [goToNext, goToPrev, goToSlide])

  useEffect(() => {
    if (!autoplay || prefersReducedMotion) {
      return
    }
    timerRef.current = setInterval(goToNext, autoplayDelay)
    return () => clearInterval(timerRef.current)
  }, [autoplay, autoplayDelay, goToNext, prefersReducedMotion])

  return (
    <SliderContext.Provider value={{
      currentIndex,
      slidesCount,
      direction,
      slidesPerView,
      loop,
      goToNext,
      goToPrev,
      goToSlide,
      registerSlides,
      label,
    }}>
      <div
        aria-label={label}
        aria-roledescription="carousel"
        className={clsx(styles.sliderRoot, className)}
      >
        {children}
        {/* children містить і SliderTrack і SliderDots */}
        {/* SliderTrack сам відповідає за overflow: hidden через свій wrapper */}
      </div>
    </SliderContext.Provider>
  )
})

// displayName явно задає ім'я компонента для React DevTools.
// forwardRef і memo збивають автовизначення імені —
// без цього рядка в DevTools буде відображатись 'ForwardRef'
// замість зрозумілого 'SliderRoot', що ускладнює дебагінг.
SliderRoot.displayName = 'SliderRoot'

export default SliderRoot