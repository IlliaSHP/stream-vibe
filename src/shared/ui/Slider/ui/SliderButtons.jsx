import clsx from 'clsx'
import { useSlider } from './SliderContext'
import styles from '../Slider.module.scss'

/**
 * SliderPrevButton — кнопка "попередній слайд".
 * Читає goToPrev і стан з SliderContext.
 * Можна розміщувати де завгодно всередині SliderRoot —
 * хоч всередині SliderRoot поряд з треком, хоч в header секції.
 *
 * @param {string}    [className]   - Клас для стилізації в конкретному місці
 * @param {ReactNode} [children]    - Кастомний вміст кнопки (іконка, текст)
 *                                    За замовчуванням: ‹
 */
export const SliderPrevButton = ({ className, children = '‹' }) => {
  const { goToPrev, currentIndex, loop } = useSlider()

  return (
    <button
      type="button"
      className={clsx('slider-btn', 'slider-btn-prev', className)}
      onClick={goToPrev}
      aria-label="Previous slide"
      disabled={!loop && currentIndex === 0}
    >
      {children}
    </button>
  )
}

/**
 * SliderNextButton — кнопка "наступний слайд".
 *
 * @param {string}    [className]
 * @param {ReactNode} [children]   - За замовчуванням: ›
 */
export const SliderNextButton = ({ className, children = '›' }) => {
  const { goToNext, currentIndex, slidesCount, loop } = useSlider()

  return (
    <button
      type="button"
      className={clsx('slider-btn', 'slider-btn-next', className)}
      onClick={goToNext}
      aria-label="Next slide"
      disabled={!loop && currentIndex === slidesCount - 1}
    >
      {children}
    </button>
  )
}