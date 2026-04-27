import { useRef, useState } from 'react'

export const useSliderDrag = ({
  isVertical,
  loop,
  N,
  animStateRef,
  currentIndexRef,
  setIndex,                // ← було: goToNext, goToPrev
  getCurrentSlideSize,
  getCurrentStep,          // ← новий
  getComputedTranslate,
  setDOMTranslate,
  disableTransition,
  enableTransition,
  setAnimating,
}) => {
  const isDragging = useRef(false)
  const startPos   = useRef(0)
  const [dragOffset, setDragOffset]         = useState(0)
  const [isDraggingState, setIsDraggingState] = useState(false)

  // ─── Pointer events ───────────────────────────────────────────────────────
  const getEventPos = (e) => isVertical ? e.clientY : e.clientX

  const handlePointerDown = (e) => {
    if (N <= 1) return
    if (animStateRef.current !== 'idle') {
      // Перехоплюємо поточну CSS-позицію і миттєво зупиняємо анімацію
      const liveTranslate = getComputedTranslate()
      disableTransition()
      setDOMTranslate(liveTranslate)
      animStateRef.current = 'idle'
      setAnimating(false)
    }

    isDragging.current = true
    startPos.current = getEventPos(e)
    setIsDraggingState(true)
    // Захоплюємо pointer — всі наступні події приходять сюди
    // навіть якщо курсор вийшов за межі елемента
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return
    let offset = getEventPos(e) - startPos.current

    if (!loop) {
      const isAtStart = currentIndexRef.current === 0
      const isAtEnd   = currentIndexRef.current === N - 1
      if ((isAtStart && offset > 0) || (isAtEnd && offset < 0)) {
        offset = Math.sign(offset) * Math.pow(Math.abs(offset), 0.35) * 10
      }
    }

    setDragOffset(offset)
  }

  const handlePointerUp = (e) => {
    if (!isDragging.current) return
    isDragging.current = false

    const delta     = getEventPos(e) - startPos.current
    const slideSize = getCurrentSlideSize()
    const step      = getCurrentStep()
    const minDelta  = slideSize * 0.3   // 30% — нижній поріг "користувач справді хотів перемкнути"

    enableTransition()

    // Скільки слайдів пройшов палець. Знак "-" бо delta>0 (палець вправо)
    // = wrapper рухається вправо = ми йдемо НАЗАД (idx зменшується).
    //
    // Symmetric round (як у translateToIndex): JS Math.round(-0.5)=0,
    // що дає асиметрію між Next і Prev. Round half away from zero — правильніше.
    let stepsToMove = 0
    if (Math.abs(delta) >= minDelta && step > 0) {
      const ratio = -delta / step
      stepsToMove = ratio < 0 ? -Math.round(-ratio) : Math.round(ratio)
      // delta достатньо великий, але після округлення вийшов 0
      // (між threshold і 0.5*step) → мінімум 1 крок у бік delta
      if (stepsToMove === 0) stepsToMove = -Math.sign(delta)
    }

    if (stepsToMove !== 0) {
      animStateRef.current = 'sliding'
      setAnimating(true)
      // setIndex з updater — щоб не залежати від stale currentIndex.
      // При loop=false клампимо в [0, N-1]; при loop=true індекс росте необмежено,
      // нормалізація відбудеться у performNormalization після transitionend.
      setIndex(prev => {
        const next = prev + stepsToMove
        if (loop) return next
        return Math.max(0, Math.min(N - 1, next))
      })
    } else {
      animStateRef.current = 'snapback'
      setAnimating(true)
    }

    setIsDraggingState(false)
    setDragOffset(0)
  }

  return {
    dragOffset,
    isDraggingState,
    handlers: { handlePointerDown, handlePointerMove, handlePointerUp }
  }
}