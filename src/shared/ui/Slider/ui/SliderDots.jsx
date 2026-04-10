import clsx from 'clsx'
import { useSlider } from './SliderContext'

const SliderDots = ({ slideLabels = [], className, dotClassName }) => {
  const { realActiveIndex, slidesCount, goToSlide, label } = useSlider()

  return (
    <div
      role="tablist"
      aria-label={`${label} pagination`}
      className={clsx('slider-pagination', className)}
    >
      {/* length в map це вбудована поведінка методу.
      Він спеціально шукає length і створює стільки елементів.*/}
      {Array.from({ length: slidesCount }).map((_, index) => {
        const isActive = index === realActiveIndex

        return (
          <button
            key={index}
            type="button"
            role="tab"
            // aria-selected — семантично правильно для role="tab"
            // aria-pressed — для toggle buttons, тут не підходить

            // React делегує всі події на рівень #root — тобто в реальному DOM
            // це не 50 окремих addEventListener, а один обробник на корені додатку.
            // Тому onClick на кожній кнопці не створює накладних витрат порівняно
            // з delegation на контейнері — різниця є тільки у внутрішній таблиці React,
            // і для 50 статичних елементів вона практично нульова.
            // Перевага цього підходу: простіший код, немає closest/dataset,
            // немає ESLint warnings на non-interactive div.
            aria-selected={isActive}
            aria-label={slideLabels[index] ?? `Slide ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={clsx(
              'slider-pagination-dot',
              dotClassName,
              isActive && 'slider-pagination-dot-active',
            )}
          />
        )
      })}
    </div>
  )
}

export default SliderDots