import { useCallback } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from './Slider.module.scss'

/**
 * SliderDots — пагінація слайдера.
 * Читає стан з SliderContext.
 *
 * @param {string[]} [slideLabels]  - aria-label для кожного dot
 * @param {string}   [className]    - Клас для контейнера
 * @param {string}   [dotClassName] - Клас для кожного dot
 */
const SliderDots = ({ slideLabels = [], className, dotClassName }) => {
  const { currentIndex, slidesCount, goToSlide, label } = useSlider()

  const handleClick = useCallback(e => {
    const dot = e.target.closest('[data-dot-index]')
    if (!dot) {
      return
    }
    goToSlide(Number(dot.dataset.dotIndex))
  }, [goToSlide])

  const handleKeyDown = useCallback(e => {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return
    }
    const dot = e.target.closest('[data-dot-index]')
    if (!dot) {
      return
    }
    e.preventDefault()
    goToSlide(Number(dot.dataset.dotIndex))
  }, [goToSlide])

  return (
    <div
      role="tablist"
      aria-label={`${label} pagination`}
      className={clsx(styles.pagination, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: slidesCount }).map((_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === currentIndex}
          aria-label={slideLabels[index] ?? `Slide ${index + 1}`}
          data-dot-index={index}
          className={clsx(
            styles.dot,
            dotClassName,
            index === currentIndex && 'dot-active',
            { [styles.dotActive]: index === currentIndex },
          )}
        />
      ))}
    </div>
  )
}

export default SliderDots