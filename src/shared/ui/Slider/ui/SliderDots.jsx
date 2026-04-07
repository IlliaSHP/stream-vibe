import { useCallback } from 'react'
import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'

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

  return (
    <div
      aria-label={`${label} pagination`}
      className={clsx('slider-pagination', className)}
    >
      {/* length в map це вбудована поведінка методу.
      Він спеціально шукає length і створює стільки елементів.*/}
      {Array.from({ length: slidesCount }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-pressed={index === currentIndex}
          aria-label={slideLabels[index] ?? `Slide ${index + 1}`}
          // React делегує всі події на рівень #root — тобто в реальному DOM
          // це не 50 окремих addEventListener, а один обробник на корені додатку.
          // Тому onClick на кожній кнопці не створює накладних витрат порівняно
          // з delegation на контейнері — різниця є тільки у внутрішній таблиці React,
          // і для 50 статичних елементів вона практично нульова.
          // Перевага цього підходу: простіший код, немає closest/dataset,
          // немає ESLint warnings на non-interactive div.
          onClick={() => goToSlide(index)}
          className={clsx(
            'slider-pagination-dot',
            dotClassName,
            index === currentIndex && 'dot-active',
            // { [styles.dotActive]: index === currentIndex },
            { 'slider-pagination-dot-active': index === currentIndex },
          )}
        />
      ))}
    </div>
  )
}

export default SliderDots