import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import clsx from 'clsx'
import { SliderContext } from './SliderContext'
import styles from './Slider.module.scss'

/**
 * SliderRoot — кореневий компонент слайдера.
 * Створює контекст з усією логікою — дочірні компоненти
 * (SliderTrack, SliderPrevButton, SliderNextButton, SliderDots)
 * читають з нього автоматично без передачі пропсів вручну.
 *
 * Патерн: Compound Components (Radix UI, shadcn/ui використовують те саме).
 *
 * @param {ReactNode}  children
 * @param {number}     [totalSlides]          - Кількість слайдів. Береться з SliderTrack
 *                                              автоматично, але можна передати явно.
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
  const registerSlides = useCallback(count => {
    setSlidesCount(count)
  }, [])

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
        className={clsx(styles.slider, className)}
      >
        {children}
      </div>
    </SliderContext.Provider>
  )
})

SliderRoot.displayName = 'SliderRoot'

export default SliderRoot