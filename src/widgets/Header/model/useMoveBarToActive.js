import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

export function useMoveBarToActive(listRef) {
  const [activeBar, setActiveBar] = useState({
    left: 0, width: 0, top: 0, height: 0, linkLeft: 0
  })
  const location = useLocation()

  const moveBarToActive = useCallback(() => {
    const linkEl = listRef.current
      ?.querySelector('[aria-current="page"]') ?? null

    if (!linkEl) return

    const listItemEl = linkEl.closest('li')

    setActiveBar({
      left: listItemEl.offsetLeft,
      width: listItemEl.offsetWidth,
      top: listItemEl.offsetTop + linkEl.offsetTop,
      height: linkEl.offsetHeight,
    })
  }, [listRef])
  // ref об'єкт ({ current: ... }) не змінюється між рендерами, React гарантує це. Технічно його не обов'язково вказувати в deps. Але ESLint правило exhaustive-deps вимагає вказувати всі зовнішні змінні. Залишай — це нешкідливо і код чистий.

  useEffect(() => {
    const raf = requestAnimationFrame(moveBarToActive)
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, moveBarToActive])

  return { activeBar }
}