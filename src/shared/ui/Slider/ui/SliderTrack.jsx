import { useEffect } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from './Slider.module.scss'

/**
 * SliderTrack — рухома частина слайдера.
 * Читає стан з SliderContext — не потребує жодних пропсів крім slides.
 *
 * @param {ReactNode[]} slides         - Масив JSX елементів
 * @param {string[]}    [slideLabels]  - aria-label для кожного слайду
 * @param {string}      [className]    - Зовнішній клас для треку
 * @param {string}      [slideClassName] - Зовнішній клас для кожного слайду
 */
const SliderTrack = ({
  slides,
  slideLabels = [],
  className,
  slideClassName,
}) => {
  const { currentIndex, direction, registerSlides } = useSlider()

  const isVertical = direction === 'vertical'

  // Повідомляємо SliderRoot скільки слайдів — щоб він знав межі
  useEffect(() => {
    registerSlides(slides.length)
  }, [slides.length, registerSlides])

  const trackStyle = isVertical
    ? {
      flexDirection: 'column',
      height: `${slides.length * 100}%`,
      transform: `translateY(${-currentIndex * (100 / slides.length)}%)`,
    }
    : {
      transform: `translateX(${-currentIndex * 100}%)`,
    }

  return (
    <ul
      className={clsx(styles.track, className)}
      style={trackStyle}
    >
      {slides.map((slideContent, index) => (
        <li
          key={index}
          role="group"
          aria-roledescription="slide"
          aria-label={slideLabels[index] ?? `${index + 1} of ${slides.length}`}
          aria-hidden={index !== currentIndex}
          className={clsx(
            styles.slide,
            slideClassName,
            index === currentIndex && 'slide-active',
          )}
        >
          {slideContent}
        </li>
      ))}
    </ul>
  )
}

export default SliderTrack