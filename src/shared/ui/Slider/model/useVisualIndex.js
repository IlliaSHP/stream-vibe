// shared/ui/Slider/model/useVisualIndex.js
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * useVisualIndex — обчислює "де wrapper зараз ВІЗУАЛЬНО", як логічний індекс.
 *
 * ЧОМУ ВОНО ПОТРІБНЕ:
 * Render використовує getSlideOffset(slideIndex, idx, ...) щоб знати, які
 * слайди телепортувати на інший кінець каруселі для loop-ілюзії.
 * Якщо передавати туди currentIndex (target), то на кожному кліку слайди
 * стрибають МИТТЄВО — а wrapper їде до них ще секунду. Між цими двома
 * подіями користувач бачить порожній viewport / телепорт слайду.
 *
 * Замість currentIndex передаємо renderIndex — індекс, який відстає
 * від target і "наздоганяє" його разом з wrapper-ом. Він міняється
 * тільки тоді, коли wrapper фактично перетинає половину наступного слайду.
 * А на цій межі слайд, що змінює свій k у getSlideOffset, гарантовано
 * знаходиться поза видимою зоною (це математичний наслідок Math.round
 * у getSlideOffset і нашого тут — точки розриву збігаються).
 *
 * ТРИ ДЖЕРЕЛА VISUAL TRANSLATE:
 *  1. Drag — base + dragOffset (відомо з React state, без DOM read).
 *  2. Animation — wrapper їде, читаємо реальний transform через RAF.
 *  3. Idle / після teleport-нормалізації — useLayoutEffect синхронно
 *     зчитує wrapper після кожної зміни currentIndex, щоб уникнути
 *     одного "поганого" кадру.
 */
export const useVisualIndex = ({
   wrapperRef,
   isVertical,
   isReady,
   isAutoMode,
   isDraggingState,
   dragOffset,
   baseTranslate,
   currentIndex,
   N,
   slidePositionsRef,
   virtualSizeRef,
   gapRef,
   stepRef,
 }) => {
  // animTranslate — останнє відоме значення wrapper.transform у px.
  // Оновлюється або RAF-ом (під час анімації), або layoutEffect-ом
  // (після кожної зміни currentIndex — щоб синхронно підхопити snap).
  const [animTranslate, setAnimTranslate] = useState(0)
  const animTranslateRef = useRef(0)
  const rafRef = useRef(null)

  // Зчитує реальний computed transform wrapper-а в одному вимірі.
  // Викликається ТІЛЬКИ всередині ефектів (не в render) — інакше ESLint
  // правило `react-hooks/refs` справедливо ругається.
  const readTranslate = () => {
    const el = wrapperRef.current
    if (!el) return 0
    const matrix = new DOMMatrix(getComputedStyle(el).transform)
    return isVertical ? matrix.m42 : matrix.m41
  }

  // ── Layout sync: після КОЖНОЇ зміни currentIndex синхронно зчитуємо DOM ──
  // Це покриває два кейси:
  //   а) звичайна навігація — transition тільки-но почалось, wrapper ще
  //      стоїть на старій позиції; читаємо її, щоб renderIndex був узгоджений
  //      з тим, що користувач бачить ПЕРЕД першим кадром анімації.
  //   б) loop-нормалізація — performNormalization синхронно стрибнув
  //      wrapper на нову позицію; читаємо її, щоб НЕ було одного кадру
  //      з порожнім viewport (коли всі offset-и обчислені від нового
  //      currentIndex, а wrapper ще "думає" що на старому).
  // useLayoutEffect, а не useEffect, бо state оновлюється і тригерить
  // re-render ДО browser paint — користувач не бачить "поганого" кадру.
  useLayoutEffect(() => {
    if (!isReady) return
    if (isDraggingState) return
    const t = readTranslate()
    animTranslateRef.current = t
    setAnimTranslate(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isReady, isDraggingState])

  // ── RAF loop під час анімації ─────────────────────────────────────────
  // Поки wrapper їде до baseTranslate — кожен кадр читаємо реальний
  // transform і оновлюємо animTranslate. Зупиняємось коли wrapper
  // у межах 0.5px від цілі (нижче порогу людського сприйняття та
  // sub-pixel rounding-у).
  useEffect(() => {
    if (!isReady) return
    if (isDraggingState) return  // під час drag DOM read не потрібен

    const target = baseTranslate

    const tick = () => {
      const t = readTranslate()
      if (t !== animTranslateRef.current) {
        animTranslateRef.current = t
        setAnimTranslate(t)
      }
      if (Math.abs(t - target) < 0.5) {
        // Settled — фіксуємо точно на target щоб уникнути float-зайвини.
        animTranslateRef.current = target
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isReady, isDraggingState, baseTranslate])

  // ── Convert translate → logical index ─────────────────────────────────
  // Auto mode: знайти найближчий за позицією slide центру + кількість циклів.
  // Numeric mode: просте ділення на step з симетричним округленням.
  //
  // Чому "симетричне" Math.round? Стандартний JS Math.round заокруглює
  // 0.5 → 1, але -0.5 → 0 (а не -1). Це дає асиметричну поведінку при
  // листанні Next vs Prev. Для нашої задачі (точка переходу renderIndex
  // має бути рівно на половині step у обох напрямках) ми хочемо
  // "round half away from zero". Звідси sign-trick нижче.
  const translateToIndex = (translate) => {
    if (isAutoMode) {
      const cycleSize = virtualSizeRef.current + gapRef.current
      if (cycleSize <= 0) return currentIndex
      const cycles = Math.floor(-translate / cycleSize)
      const withinCycle = -translate - cycles * cycleSize
      const positions = slidePositionsRef.current
      if (!positions.length) return currentIndex
      let closestIdx = 0
      let minDist = Infinity
      for (let i = 0; i < positions.length; i++) {
        const d = Math.abs(positions[i] - withinCycle)
        if (d < minDist) {
          minDist = d
          closestIdx = i
        }
      }
      return cycles * N + closestIdx
    }
    if (stepRef.current === 0) return currentIndex
    const ratio = -translate / stepRef.current
    return ratio < 0 ? -Math.round(-ratio) : Math.round(ratio)
  }

  // ── Що віддаємо назовні ───────────────────────────────────────────────
  // visualTranslate обчислюється з трьох можливих джерел.
  // Render-only логіка — нічого не зчитує з DOM, лише з state і refs metrics.
  let visualTranslate
  if (!isReady) {
    visualTranslate = 0
  } else if (isDraggingState) {
    // Під час drag wrapper.transform = inline `translate(${base + dragOffset}px)` —
    // ми ЗНАЄМО це значення з React state, не треба DOM read.
    visualTranslate = baseTranslate + dragOffset
  } else {
    // Idle або animation — використовуємо останній зчитаний RAF/layout-ом.
    visualTranslate = animTranslate
  }

  return isReady ? translateToIndex(visualTranslate) : currentIndex
}