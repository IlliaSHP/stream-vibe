import styles from '../HeroSection.module.scss'
import clsx from 'clsx'
import img1 from '@assets/img/heroSection/1.jpg'
import img2 from '@assets/img/heroSection/2.jpg'
import img3 from '@assets/img/heroSection/3.jpg'
import img4 from '@assets/img/heroSection/4.jpg'
import img5 from '@assets/img/heroSection/5.jpg'
import {useRef} from 'react'
import { SliderRoot, SliderTrack, SliderPrevButton, SliderNextButton, SliderDots } from '@/shared/ui/Slider'

const HeroSection = (props) => {
  const {
    className,
  } = props

  const movies = [
    { id: 1, url: img1, title: 'image-1' },
    { id: 2, url: img2, title: 'image-2' },
    { id: 3, url: img3, title: 'image-3' },
    // { id: 4, url: img4, title: 'image-4' },
    // { id: 5, url: img5, title: 'image-5' },
    // { id: 6, url: img5, title: 'image-6' },
    // { id: 7, url: img5, title: 'image-7' },
    // { id: 8, url: img5, title: 'image-8' },
    // { id: 9, url: img5, title: 'image-9' },
    // { id: 10, url: img5, title: 'image-10' },
    // { id: 11, url: img5, title: 'image-11' },
    // { id: 12, url: img5, title: 'image-12' },
    // { id: 13, url: img5, title: 'image-13' },
    // { id: 14, url: img5, title: 'image-14' },
    // { id: 15, url: img5, title: 'image-15' },
    // { id: 16, url: img5, title: 'image-16' },
  ]

  const sliderRef = useRef(null)

  return (
    <section
      aria-label="Latest movies showcase"
      className={clsx(className, 'hero-section')}
    >

      {/* Кнопки винесені за межі SliderRoot */}
      <button onClick={() => sliderRef.current?.goToPrev()}>‹</button>
      <button onClick={() => sliderRef.current?.goToNext()}>›</button>

      <SliderRoot ref={sliderRef} direction="vertical" loop={false} slidesPerView={1} label="Hero">
        <SliderTrack
          slides={movies.map(m => <img key={m.id} src={m.url} alt={m.title} />)}
          slideLabels={movies.map(m => m.title)}
        />
        <SliderDots />
      </SliderRoot>
    </section>
  )
}

export default HeroSection