import clsx from 'clsx'
import { useSlider } from './SliderContext'

const SliderDots = ({ slideLabels = [], className, dotClassName }) => {
  const { realActiveIndex, slidesCount, goToSlide, label } = useSlider()

  return (
    <div
      // role="group" — групує dots як набір пов'язаних елементів.
      // Не role="tablist" — tablist вимагає keyboard pattern зі стрілками між табами,
      // що нетипово для dots і заплутує користувачів (підтверджено користувацьким тестуванням).
      role="group"
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
            // aria-current — правильніший атрибут для пагінації.
            // aria-selected — для tablist/listbox. aria-pressed — для toggle buttons.
            // aria-current="true" каже "цей елемент є поточним в наборі"
            // — саме те що потрібно для dot пагінації.

            // React делегує всі події на рівень #root — тобто в реальному DOM
            // це не 50 окремих addEventListener, а один обробник на корені додатку.
            // Тому onClick на кожній кнопці не створює накладних витрат порівняно
            // з delegation на контейнері — різниця є тільки у внутрішній таблиці React,
            // і для 50 статичних елементів вона практично нульова.
            // Перевага цього підходу: простіший код, немає closest/dataset,
            // немає ESLint warnings на non-interactive div.
            aria-current={isActive ? 'true' : undefined}
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