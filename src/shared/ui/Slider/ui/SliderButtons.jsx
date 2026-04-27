import clsx from 'clsx'
import { useSlider } from './SliderContext'

export const SliderPrevButton = ({ className, children = '‹', hideWhenSingleSlide = true }) => {
  const { goToPrev, realActiveIndex, slidesCount, loop } = useSlider()

  if (hideWhenSingleSlide && slidesCount <= 1) return null

  return (
    <button
      type="button"
      className={clsx('slider-btn', 'slider-btn-prev', className)}
      onClick={goToPrev}
      aria-label="Previous slide"
      disabled={!loop && realActiveIndex === 0}
    >
      {children}
    </button>
  )
}

export const SliderNextButton = ({ className, children = '›', hideWhenSingleSlide = true }) => {
  const { goToNext, realActiveIndex, slidesCount, loop } = useSlider()

  if (hideWhenSingleSlide && slidesCount <= 1) return null

  return (
    <button
      type="button"
      className={clsx('slider-btn', 'slider-btn-next', className)}
      onClick={goToNext}
      aria-label="Next slide"
      disabled={!loop && realActiveIndex === slidesCount - 1}
    >
      {children}
    </button>
  )
}