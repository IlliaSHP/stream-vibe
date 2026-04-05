import './HeroSection.scss'
import clsx from 'clsx'
import styles from '@/shared/ui/Slider/Slider.module.scss'

const HeroSection = (props) => {
  const {
    className,
  } = props

  const slides = [
    {url: 'http://localhost:3000/image-1.webp', title: "image-1"},
    {url: 'http://localhost:3000/image-1.webp', title: "image-2"},
    {url: 'http://localhost:3000/image-1.webp', title: "image-3"},
    {url: 'http://localhost:3000/image-1.webp', title: "image-4"},
    {url: 'http://localhost:3000/image-1.webp', title: "image-5"},
  ]

  const containerStyles = {
    width: '500px',
    height: '280px',
    margin: '0 auto'
  }

  return (
    <section
      aria-label="Latest movies showcase"
      aria-roledescription="carousel"
      className={clsx(className, 'hero-section')}
    >
      <div>
        {/*<div style={containerStyles}>*/}
        {/*  <ColumnSlider slides={slides} parentWidth={500} />*/}
        {/*</div>*/}
      </div>
    </section>
  )
}