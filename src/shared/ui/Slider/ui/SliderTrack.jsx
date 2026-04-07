import { useEffect, useRef, useState } from 'react'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'
import clsx from 'clsx'

const SliderTrack = ({ slides, slideLabels = [], className, slideClassName }) => {
  const { currentIndex, direction, registerSlides, slidesPerView } = useSlider()
  const viewportRef = useRef(null)
  const [slideSize, setSlideSize] = useState(0)  // розмір одного слайду в пікселях

  const isVertical = direction === 'vertical'

  useEffect(() => {
    registerSlides(slides.length)
  }, [slides.length, registerSlides])

  // Вимірюємо реальний розмір контейнера як Swiper
  useEffect(() => {
    if (!viewportRef.current) return

    const measure = () => {
      const el = viewportRef.current
      if (!el) return

      if (slidesPerView === 'auto') {
        // При auto — вимірюємо перший слайд після рендеру.
        // Розмір задається CSS ззовні (через slideClassName), не через JS.
        const firstSlide = el.querySelector('li')
        if (!firstSlide) return
        const size = isVertical ? firstSlide.offsetHeight : firstSlide.offsetWidth
        setSlideSize(size)
        return
      }

      // читаємо реальні пікселі як updateSize() в Swiper
      const containerSize = isVertical
        ? el.clientHeight - parseFloat(getComputedStyle(el).paddingTop) - parseFloat(getComputedStyle(el).paddingBottom)
        : el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight)

      // розмір одного слайду як в updateSlides() в Swiper
      // slideSize = (containerSize - gaps між слайдами) / кількість слайдів у вікні
      setSlideSize(containerSize / slidesPerView)
    }

    measure()

    // перераховуємо при зміні розміру вікна — як ResizeObserver в Swiper
    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [isVertical, slidesPerView])

  const isReady = slideSize > 0

  const wrapperStyle = isReady
    ? isVertical
      ? {
        flexDirection: 'column',
        transform: `translate3d(0, ${-currentIndex * slideSize}px, 0)`,
        height: `${slides.length * slideSize}px`,
      }
      : {
        transform: `translate3d(${-currentIndex * slideSize}px, 0, 0)`,
      }
    : isVertical
      ? { flexDirection: 'column' }  // без transform і height — браузер сам розставить слайди
      : {}                           // без transform — слайди на початковій позиції

  const slideStyle = isReady
    ? { [isVertical ? 'height' : 'width']: `${slideSize}px` }
    : {}

  return (
    <div
      ref={viewportRef}
      className={clsx(styles.sliderViewport, isVertical && styles.sliderViewportVertical)}
    >
      <ul className={clsx(styles.sliderWrapper, className)} style={wrapperStyle}>
        {/*index в key це нормально для статичних об'єктів, які ніколи не змінюються*/}
        {slides.map((slideContent, index) => (
          <li
            key={index}
            style={slideStyle}
            className={clsx(styles.slide, slideClassName, index === currentIndex && 'slide-active')}
            aria-hidden={index !== currentIndex}
            aria-label={slideLabels[index] ?? `${index + 1} of ${slides.length}`}
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
        ))}
      </ul>
    </div>
  )
}

export default SliderTrack