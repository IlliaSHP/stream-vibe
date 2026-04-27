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

  // ─── Animation state (лежить тут, а не в ref) ─────────────────────────────
  // Раніше було isAnimatingRef — він не тригерив ре-рендер, тому autoplay-ефект
  // не міг "прокинутись" коли анімація завершилась. Тепер це справжній state:
  // setAnimating(true)  ← викликає Track при currentIndex change і drag snapback
  // setAnimating(false) ← викликає useSliderLoop.performNormalization (transitionend
  //                       або safety timer) та useSliderDrag.handlePointerDown (коли
  //                       перехоплює анімацію).
  // Завдяки тому, що це state, autoplay-ефект ре-планується автоматично коли
  // анімація завершується.
  const [isAnimating, setIsAnimating] = useState(false)

  // ─── Pause counter ────────────────────────────────────────────────────────
  // Decrementable counter, як у Embla: кожен джерело паузи (hover, focus,
  // drag, hidden tab) ставить +1, відпускання робить -1. autoplay-ефект
  // дивиться лише на `pauseCount > 0`. Counter (а не bool) потрібен бо
  // джерела можуть перетинатись: hover + drag → 2; lose hover → 1 (drag ще
  // тримає); drag end → 0.
  const [pauseCount, setPauseCount] = useState(0)
  const pauseAutoplay  = useCallback(() => setPauseCount(c => c + 1), [])
  const resumeAutoplay = useCallback(() => setPauseCount(c => Math.max(0, c - 1)), [])
  const autoplayPaused = pauseCount > 0

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

  // ─── goToSlide з shortest-path логікою (лише при loop=true) ───────────────
  // При loop=true currentIndex росте необмежено (5, 6, 7, ...). На екрані
  // користувач бачить normalizeIndex(currentIndex). Shortest path означає:
  // знайти, скільки кроків (в +/- сторону) треба додати до сирого currentIndex,
  // щоб видимий слайд став = target. У межах одного циклу [-N/2, +N/2] —
  // це і є найкоротший шлях. Loop-машинерія в Track підхопить telerort через
  // getSlideOffset так само, як і при ручному gotoNext().
  //
  // При loop=false shortest path неможливий — циклу немає. Просто переходимо
  // на index напряму (через всі слайди — це очікувана поведінка для not-loop).
  const goToSlide = useCallback((index) => {
    setCurrentIndex(prev => {
      if (!loop || slidesCount <= 1) return index
      const realCurrent = normalizeIndex(prev, slidesCount)
      let diff = index - realCurrent
      if (diff >  slidesCount / 2) diff -= slidesCount
      else if (diff < -slidesCount / 2) diff += slidesCount
      return prev + diff
    })
  }, [loop, slidesCount])

  // Технічний raw-сетер для useSliderLoop.
  // goToSlide має shortest-path логіку для UI-навігації, але performNormalization
  // потребує "тупо постав state у це значення" — інакше React не оновить DOM
  // після teleport-snap, бо думатиме що нічого не змінилось.
  const setIndexRaw = useCallback((indexOrUpdater) => {
    setCurrentIndex(indexOrUpdater)
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

  // ─── Autoplay як "wait-for-transition" state machine ──────────────────────
  // Інваріант: реальний цикл = (час анімації) + (autoplayDelay).
  // autoplayDelay — час спокою на слайді. Те саме як у Swiper.
  //
  // Як це працює:
  //  1. isAnimating=false, не paused → планується setTimeout на autoplayDelay.
  //  2. Таймер вистрелив → currentIndex++ → Track запускає анімацію.
  //  3. Track викликає setAnimating(true) у своєму ефекті [currentIndex].
  //  4. Зміна isAnimating ре-рендерить Root → cleanup старого ефекту
  //     (там нема чого чистити, таймер уже відпрацював) → новий ефект
  //     бачить isAnimating=true → нічого не планує.
  //  5. Анімація закінчилась → performNormalization() в useSliderLoop
  //     викликає setAnimating(false).
  //  6. Знов ре-рендер → ефект бачить isAnimating=false → планує таймер.
  //
  // Чому це краще за setInterval з фіксованим інтервалом:
  //  • Якщо duration > autoplayDelay (рідкісний кейс, але буває) — autoplay
  //    не намагається стартувати анімацію поверх вже існуючої.
  //  • transitionend та safety timer (вже існують у useSliderLoop) дають
  //    точне знання "анімація завершилась" — нам не треба дублювати
  //    їх через окремий setTimeout(duration + buffer).
  //  • Drag паузить через pauseAutoplay (з Track-у): поки палець на слайдері,
  //    цикл стоїть; відпустив — продовжився.
  useEffect(() => {
    if (!autoplay || prefersReducedMotion) return
    if (slidesCount <= 1) return
    if (isAnimating) return
    if (autoplayPaused) return

    const id = setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      // Завжди інкремент. Strategy B: при loop=false useSliderLoop підхопить
      // вихід за межі і плавно "телепортує" перший слайд — без різкого
      // звороту назад через всі слайди.
    }, autoplayDelay)

    return () => clearTimeout(id)
  }, [autoplay, prefersReducedMotion, slidesCount, isAnimating, autoplayPaused, autoplayDelay])


  // ─── Page Visibility (зупинка autoplay при неактивній вкладці) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoplay) return
    const onVisibilityChange = () => {
      if (document.hidden) pauseAutoplay()
      else resumeAutoplay()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [autoplay, pauseAutoplay, resumeAutoplay])

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
    setAnimating: setIsAnimating,
    pauseAutoplay,                  // Track викликає на drag start
    resumeAutoplay,                 // Track викликає на drag end
    goToNext,
    goToPrev,
    goToSlide,
    setIndexRaw,
    registerSlides,
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
    pauseAutoplay,
    resumeAutoplay,
    goToNext,
    goToPrev,
    goToSlide,
    setIndexRaw,
    registerSlides,
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
        onMouseEnter={autoplay ? pauseAutoplay : undefined}
        onMouseLeave={autoplay ? resumeAutoplay : undefined}
        onFocus={autoplay ? pauseAutoplay : undefined}
        onBlur={autoplay ? resumeAutoplay : undefined}  // (ловимо щоб не autoplay-нути коли фокус ще в каруселі)
        // preventDefault() — запобігає скролу сторінки при навігації стрілками.
        onKeyDown={(e) => {
          if (slidesCount <= 1) return
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