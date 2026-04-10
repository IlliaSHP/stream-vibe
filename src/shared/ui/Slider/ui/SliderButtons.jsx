import clsx from 'clsx'
import { useSlider } from './SliderContext'

export const SliderPrevButton = ({ className, children = '‹' }) => {
  const { goToPrev, realActiveIndex, loop } = useSlider()

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

export const SliderNextButton = ({ className, children = '›' }) => {
  const { goToNext, realActiveIndex, slidesCount, loop } = useSlider()

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