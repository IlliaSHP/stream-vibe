import { useRef, useState } from 'react'

export const useSliderDrag = ({
  isVertical,
  loop,
  N,
  animStateRef,
  currentIndexRef,
  goToNext,
  goToPrev,
  getCurrentSlideSize,
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

    const delta= getEventPos(e) - startPos.current
    const threshold = getCurrentSlideSize() * 0.3

    enableTransition()

    const action =
      delta < -threshold ? goToNext :
      delta >  threshold ? goToPrev : null

    if (action) {
      animStateRef.current = 'sliding'
      setAnimating(true)
      action()
    } else {
      animStateRef.current = 'snapback' // йде анімація повернення на місце (користувач відпустив не дотягнувши)
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