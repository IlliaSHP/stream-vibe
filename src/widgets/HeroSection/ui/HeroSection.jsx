import styles from '../HeroSection.module.scss'
import clsx from 'clsx'
import Slider from '@/shared/ui/Slider'
import img1 from '@assets/img/heroSection/1.jpg'
import img2 from '@assets/img/heroSection/2.jpg'
import img3 from '@assets/img/heroSection/3.jpg'
import img4 from '@assets/img/heroSection/4.jpg'
import img5 from '@assets/img/heroSection/5.jpg'
import {useRef} from 'react'

const HeroSection = (props) => {
  const {
    className,
  } = props

  const movies = [
    {url: img1, title: 'image-1'},
    {url: img2, title: "image-2"},
    {url: img3, title: "image-3"},
    {url: img4, title: "image-4"},
    {url: img5, title: "image-5"},
  ]

  const sliderRef = useRef(null)

  return (
    <section
      aria-label="Latest movies showcase"
      aria-roledescription="carousel"
      className={clsx(className, 'hero-section')}
    >
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => sliderRef.current?.goToPrev()}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => sliderRef.current?.goToNext()}
      >
        ›
      </button>
      <div>
        <Slider
          ref={sliderRef}
          direction="vertical"
          classNames={{
            // Змінюємо анімацію треку
            track: styles.customTrack,
            // Свої стилі для слайдів
            slide: styles.reviewSlide,
            // Абсолютне позиціонування кнопок для цього конкретного слайдера
            btn: styles.reviewBtn,
            btnPrev: styles.reviewBtnPrev,
            btnNext: styles.reviewBtnNextqwewq,
            // Кастомна пагінація
            dot: styles.reviewDot,
          }}
          slides={movies.map(movie => (
            <img key={movie.title} src={movie.url} alt={movie.title} />
          ))}
          label="Featured movies"
          slideLabels={movies.map(m => m.title)}
        >
          <p>hello</p>
        </Slider>
      </div>
    </section>
  )
}

export default HeroSection