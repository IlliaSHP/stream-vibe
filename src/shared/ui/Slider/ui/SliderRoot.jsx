import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { normalizeIndex } from '../lib/normalizeIndex'
import clsx from 'clsx'
import { SliderContext } from './SliderContext'
import styles from '../Slider.module.scss'
import { useResponsiveProps } from '@/shared/ui/Slider/model/useResponsiveProps'
import { usePrefersReducedMotion } from '@/shared/ui/Slider/lib/usePrefersReducedMotion'

const DEFAULT_TRANSITION = { duration: 400, easing: 'ease-in-out' }

// Відповідає тільки за логіку: currentIndex, autoplay, навігація.
// Не рендерить жодної розмітки слайдів — тільки обгортковий div і Provider.
/**
 * @prop {Object} classNames - Кастомні класи для частин слайдера
 * @prop {string} classNames.root       - Кореневий контейнер (SliderRoot)
 * @prop {string} classNames.viewport   - Viewport (overflow: hidden)
 * @prop {string} classNames.wrapper    - Flex-контейнер слайдів
 * @prop {string} classNames.slide      - Кожен слайд (li елемент)
 * @prop {string} classNames.prevBtn    - Кнопка "назад"
 * @prop {string} classNames.nextBtn    - Кнопка "вперед"
 * @prop {string} classNames.dotsWrap   - Контейнер пагінації
 * @prop {string} classNames.dot        - Одна точка пагінації
 *
 * @prop {Object} [breakpoints] - Адаптивні налаштування за шириною екрана.
 *   Ключі — мінімальна ширина в px, значення — об'єкт з пропсами що перевизначаються.
 *   ВАЖЛИВО: цей об'єкт має бути memoized (через useMemo або винесений за компонент),
 *   інакше підписки на media queries будуть ре-створюватись кожен рендер.
 */
const SliderRoot = forwardRef( (props, ref) => {
  const { breakpoints, children, className, ...rest} = props

  const effectiveProps = useResponsiveProps(rest, breakpoints)
  const {
    direction    = 'horizontal',
    slidesPerView = 1,
    autoplay     = false,
    autoplayDelay = 4000,
    loop         = true,
    centeredSlides = false,
    label        = 'Slider',
    transition,
  } = effectiveProps

  const [currentIndex, setCurrentIndex] = useState(0)
  const [slidesCount, setSlidesCount]   = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const timerRef = useRef(null)
  const isAnimatingRef = useRef(false)

  // ─── Transition resolution ────────────────────────────────────────────────
  // 1. Мерджимо з дефолтами щоб користувач міг передати тільки duration
  //    або тільки easing і не зламати інше.
  // 2. При reduced motion → duration = 0 (миттєво, без анімації).
  // 3. useMemo щоб transitionConfig мав стабільну refequality між рендерами
  //    якщо нічого не змінилось — інакше contextValue буде новим щоразу.
  const transitionConfig = useMemo(() => {
    const duration = transition?.duration ?? DEFAULT_TRANSITION.duration
    const easing = transition?.easing ?? DEFAULT_TRANSITION.easing
    return {
      duration: prefersReducedMotion ? 0 : duration,
      easing,
    }
  }, [transition?.duration, transition?.easing, prefersReducedMotion])

  // ─── Navigation ───────────────────────────────────────────────────────────
  // При loop=true currentIndex росте/падає необмежено.
  // Нормалізація до [0, N-1] відбувається в SliderTrack після transitionEnd —
  // це дозволяє швидко листати без стрибків.
  //
  // При loop=false — жорсткі межі через Math.min/max.
  const goToNext = useCallback(() => {
    setCurrentIndex(prev =>
      loop ? prev + 1 : Math.min(prev + 1, slidesCount - 1)
    )
  }, [loop, slidesCount])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev =>
      loop ? prev - 1 : Math.max(prev - 1, 0)
    )
  }, [loop])

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index)
  }, [])

  const registerSlides = useCallback(count => setSlidesCount(count), [])

  // ─── Зовнішній API через ref ─────────────────────────────────────────────────
  // useImperativeHandle дозволяє батьківському компоненту викликати
  // goToNext/goToPrev/goToSlide напряму через ref — як в HeroSection.
  // ─────────────────────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    goToNext,
    goToPrev,
    goToSlide,
  }), [goToNext, goToPrev, goToSlide])

  // ─── Autoplay ─────────────────────────────────────────────────────────────
  // При reduced motion autoplay блокуємо повністю — це WCAG 2.2.2 вимога
  // (рухомий контент має бути зупинимий або автоматично зупинятись).
  const startAutoplay = useCallback(() => {
    if (!autoplay || prefersReducedMotion) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(goToNext, autoplayDelay)
  }, [autoplay, autoplayDelay, goToNext, prefersReducedMotion])

  const stopAutoplay = useCallback(() => {
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    startAutoplay()
    return stopAutoplay
  }, [startAutoplay, stopAutoplay])

  // ─── Page Visibility (зупинка autoplay при неактивній вкладці) ────────────
  useEffect(() => {
    if (!autoplay) return
    const onVisibilityChange = () => {
      if (document.hidden) stopAutoplay()
      else startAutoplay()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [autoplay, startAutoplay, stopAutoplay])

  // ─── Context value ───────────────────────────────────────────────────────────
  // useMemo критично важливий тут: без нього при кожному рендері SliderRoot
  // (а він рендериться при кожній зміні currentIndex) створюється новий об'єкт
  // контексту → всі споживачі (SliderDots, SliderButtons, SliderTrack)
  // ре-рендеряться навіть якщо їх пропси не змінились.
  //
  // realActiveIndex — нормалізований індекс для споживачів.
  // Dots і Buttons мають бачити [0, N-1], а не необмежено зростаючий currentIndex.
  // SliderTrack отримує сирий currentIndex бо він потрібен для getSlideOffset.
  // ─────────────────────────────────────────────────────────────────────────────
  const realActiveIndex = normalizeIndex(currentIndex, slidesCount)

  const contextValue = useMemo(() => ({
    currentIndex,      // сирий — для SliderTrack (getSlideOffset, translate)
    realActiveIndex,   // нормалізований — для Dots, Buttons
    slidesCount,
    direction,
    slidesPerView,
    loop,
    centeredSlides,
    transition: transitionConfig,
    setAnimating: (val) => isAnimatingRef.current = val,
    goToNext,
    goToPrev,
    goToSlide,
    registerSlides,
    startAutoplay,
    stopAutoplay,
    label,
  }), [
    currentIndex,
    realActiveIndex,
    slidesCount,
    direction,
    slidesPerView,
    loop,
    centeredSlides,
    transitionConfig,
    goToNext,
    goToPrev,
    goToSlide,
    registerSlides,
    startAutoplay,
    stopAutoplay,
    label,
  ])

  // CSS variables передаємо тут, щоб діти бачили їх через каскад.
  const rootStyle = useMemo(() => ({
    '--slider-duration': `${transitionConfig.duration}ms`,
    '--slider-easing': transitionConfig.easing,
  }), [transitionConfig])

  return (
    <SliderContext.Provider value={contextValue}>
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        // role="region" — створює landmark (точку входу для скрінрідера).
        // Для роботи region як landmark обов'язковий aria-label або aria-labelledby —
        // інакше скрінрідер не вважає його landmark. Тому label валідується нижче.
        role="region"
        // aria-label — людино-читана назва каруселі ("Hero", "Featured products").
        // Скрінрідер прочитає її при навігації по landmarks.
        // ВАЖЛИВО: не повинно містити слово "carousel" — aria-roledescription вже про це каже.
        aria-label={label}
        // aria-roledescription="carousel" — кастомізація як скрінрідер промовляє роль.
        // Замість "Hero, region" буде "Hero, carousel".
        aria-roledescription="carousel"
        // клавіатурна навігація стрілками потребує фокусованого елемента.
        // Якщо слайдер не може отримати фокус — стрілки не працюватимуть.
        className={clsx(styles.sliderRoot, className)}
        style={rootStyle}
        // onMouseEnter/Leave — зупиняємо autoplay при hover.
        // WCAG 2.1 критерій 2.2.2: рухомий контент можна зупинити.
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
        onFocus={stopAutoplay}
        onBlur={startAutoplay}  // (ловимо щоб не autoplay-нути коли фокус ще в каруселі)
        // preventDefault() — запобігає скролу сторінки при навігації стрілками.
        onKeyDown={(e) => {
          const isVertical = direction === 'vertical'
          const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
          const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'
          if (e.key === nextKey) { e.preventDefault(); goToNext() }
          if (e.key === prevKey) { e.preventDefault(); goToPrev() }
        }}
      >
        <div
          // role="status" + aria-live="polite" = слухач AT почує зміни тексту тут
          // ВАЖЛИВО: не використовуй aria-live="assertive" — переб'є інші повідомлення
          role="status"
          aria-live="polite"
          // Visually hidden — користувач не бачить, але AT читає
          className={clsx(styles.sliderLiveRegion, "visually-hidden")}
        >
          {`Slide ${realActiveIndex + 1} of ${slidesCount}`}
        </div>
        {children}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </SliderContext.Provider>
  )
})

// displayName явно задає ім'я компонента для React DevTools.
// forwardRef і memo збивають автовизначення імені —
// без цього рядка в DevTools буде відображатись 'ForwardRef'
// замість зрозумілого 'SliderRoot', що ускладнює дебагінг.
SliderRoot.displayName = 'SliderRoot'
export default SliderRoot