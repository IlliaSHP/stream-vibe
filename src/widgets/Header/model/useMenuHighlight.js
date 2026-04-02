import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * @param {string} activeLinkClass  — CSS-клас активного NavLink
 * @param {'opacity' | 'persistent'} mode
 *   'opacity'    — highlight з'являється при hover, зникає при виході
 *   'persistent' — highlight завжди видимий, при виході повертається до active
 */
export function useMenuHighlight(activeLinkClass, mode = 'opacity') {
  const listRef = useRef(null)

  // В 'persistent' opacity завжди 1, тому не кладемо його в стан
  const [highlight, setHighlight] = useState({
    left: 0,
    width: 0,
    opacity: mode === 'opacity' ? 0 : 1,
  })

  const moveHighlight = useCallback((el) => {
    if (!el || !listRef.current) return

    setHighlight(prev => ({
      ...prev,
      left: el.offsetLeft,
      width: el.offsetWidth,
      // opacity не чіпаємо — в 'persistent' він завжди 1
      ...(mode === 'opacity' && { opacity: 1 }),
    }))
  }, [mode])

  const getActiveEl = useCallback(() => {
    return listRef.current
      ?.querySelector(`.${activeLinkClass}`)
      ?.closest('li') ?? null
  }, [activeLinkClass])

  const moveToActive = useCallback(() => {
    const activeEl = getActiveEl()
    if (activeEl) moveHighlight(activeEl)
    return activeEl
  }, [getActiveEl, moveHighlight])

  const hideHighlight = useCallback(() => {
    if (mode === 'persistent') {
      // Завжди повертаємось до активного пункту
      moveToActive()
      return
    }

    // 'opacity' режим: зникаємо якщо немає активного
    const activeEl = moveToActive()
    if (!activeEl) {
      setHighlight(prev => ({ ...prev, opacity: 0 }))
    }
  }, [mode, moveToActive])

  const location = useLocation()

  useEffect(() => {
    const raf = requestAnimationFrame(moveToActive)
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, moveToActive])

  return { listRef, highlight, moveHighlight, hideHighlight }
}