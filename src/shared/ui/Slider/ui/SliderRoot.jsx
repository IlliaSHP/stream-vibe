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


  // Для loop=false — обмежуємо межами масиву
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

  // Для loop=true — дозволяємо виходити за межі,
  // SliderTrack телепортує після завершення анімації
  const loopGoToNext = useCallback(() => {
    setCurrentIndex(prev => prev + 1)
  }, [])

  const loopGoToPrev = useCallback(() => {
    setCurrentIndex(prev => prev - 1)
  }, [])

  const goToSlide = useCallback(index => {
    setCurrentIndex(index)
  }, [])



  const registerSlides = useCallback(count => {
    setSlidesCount(count)
  }, [])

  // Публічні методи — те що виходить назовні через ref і контекст
  const publicGoToNext = loop ? loopGoToNext : goToNext
  const publicGoToPrev = loop ? loopGoToPrev : goToPrev



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
    goToNext: publicGoToNext,
    goToPrev: publicGoToPrev,
    goToSlide,
  }), [publicGoToNext, publicGoToPrev, goToSlide])

  useEffect(() => {
    if (!autoplay || prefersReducedMotion) return

    timerRef.current = setInterval(publicGoToNext, autoplayDelay)
    return () => clearInterval(timerRef.current)

  }, [autoplay, autoplayDelay, publicGoToNext, prefersReducedMotion])

  return (
    <SliderContext.Provider value={{
      currentIndex,
      slidesCount,
      direction,
      slidesPerView,
      loop,
      goToNext: publicGoToNext,   // ← кнопки в контексті теж отримують правильні
      goToPrev: publicGoToPrev,
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