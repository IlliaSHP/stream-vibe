import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import styles from './Slider.module.scss'

/**
 * Універсальний слайдер
 *
 * @param {ReactNode[]} slides                   - Масив JSX елементів — контент кожного слайду
 * @param {string[]}    [slideLabels=[]]          - aria-label для кожного слайду (для screen reader)
 * @param {string}      [direction='horizontal']  - 'horizontal' | 'vertical'
 * @param {boolean}     [autoplay=false]          - Вмикає автоматичне перемикання
 * @param {number}      [autoplayDelay=4000]      - Інтервал autoplay в мс
 * @param {boolean}     [loop=true]               - Зациклює слайди
 * @param {boolean}     [showArrows=true]         - Показує кнопки prev/next
 * @param {boolean}     [showDots=true]           - Показує пагінацію (dots)
 * @param {string}      [className]               - Зовнішній клас для кастомізації
 * @param {string}      [label='Slider']          - aria-label (має бути унікальним якщо
 *                                                  на сторінці декілька слайдерів)
 */
const Slider = ({
  slides,
  slideLabels = [],
  direction = 'horizontal',
  autoplay = false,
  autoplayDelay = 4000,
  loop = true,
  showArrows = true,
  showDots = true,
  className,
  label = 'Slider',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)

  // typeof window — захист від SSR (Next.js).
  // В Vite/CRA можна писати просто: window.matchMedia(...).matches
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const isVertical = direction === 'vertical'

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const isLast = prev === slides.length - 1
      if (!loop && isLast) {
        return prev
      }
      return isLast ? 0 : prev + 1
    })
  }, [loop, slides.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => {
      const isFirst = prev === 0
      if (!loop && isFirst) {
        return prev
      }
      return isFirst ? slides.length - 1 : prev - 1
    })
  }, [loop, slides.length])

  // Autoplay вимикається при prefers-reduced-motion — автоматичний рух
  // може викликати дискомфорт у людей з вестибулярними порушеннями.
  // Перемикання по кліку залишається завжди.
  // prefers-reduced-motion в reset.css
  useEffect(() => {
    if (!autoplay || prefersReducedMotion) {
      return
    }
    timerRef.current = setInterval(goToNext, autoplayDelay)
    return () => clearInterval(timerRef.current)
  }, [autoplay, autoplayDelay, goToNext, prefersReducedMotion])

  const trackStyle = {
    transform: isVertical
      ? `translateY(${-currentIndex * 100}%)`
      : `translateX(${-currentIndex * 100}%)`,
  }

  const handlePaginationClick = useCallback(e => {
    const dot = e.target.closest('[data-index]')
    if (!dot) return
    setCurrentIndex(Number(dot.dataset.index))
  }, [])

  return (
    // aria-roledescription="carousel" — screen reader каже "carousel"
    // label — має бути унікальним якщо на сторінці декілька слайдерів,
    // інакше всі будуть однаково називатись "Slider"
    <div
      aria-roledescription="carousel"
      aria-label={label}
      className={clsx(styles.slider, className)}
    >
      <ul
        className={clsx(styles.track, {
          // [styles.trackVertical] — обчислюваний ключ об'єкта.
          // Записується так бо значення береться зі змінної,
          // а не є літеральним рядком.
          [styles.trackVertical]: isVertical,
        })}
        style={trackStyle}
      >
        {slides.map((slideContent, index) => (
          // role="group" + aria-roledescription="slide" —
          // screen reader оголошує "slide 1 of 5, group"
          // aria-hidden — приховує неактивні слайди від screen reader,
          // щоб він не читав контент поза екраном
          <li
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabels[index] ?? `Slide ${index + 1} of ${slides.length}`}
            aria-hidden={index !== currentIndex}
            className={styles.slide}
          >
            {/* Тут може бути будь-який JSX — img, відео, текст, картки */}
            {slideContent}
          </li>
        ))}
      </ul>
      {showArrows && (
        <>
          <button
            type="button"
            className={clsx(styles.btn, styles.btnPrev)}
            onClick={goToPrev}
            aria-label="Previous slide"
            disabled={!loop && currentIndex === 0}
          >
            ‹
          </button>
          <button
            type="button"
            className={clsx(styles.btn, styles.btnNext)}
            onClick={goToNext}
            aria-label="Next slide"
            disabled={!loop && currentIndex === slides.length - 1}
          >
            ›
          </button>
        </>
      )}

      {showDots && (
        // role="tablist" — семантично правильна роль для групи перемикачів
        // aria-label береться з label пропса щоб бути унікальним
        <div
          role="tablist"
          aria-label={`${label} pagination`}
          className={styles.pagination}
          onClick={handlePaginationClick}
        >
          {slides.map((_, index) => (
            // role="tab" + aria-selected — screen reader оголошує активний dot
            // data-index — зчитується в handlePaginationClick (event delegation)
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={slideLabels[index] ?? `Slide ${index + 1}`}
              data-index={index}
              className={clsx(styles.dot, {
                [styles.dotActive]: index === currentIndex,
              })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Slider