import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * @param {'opacity' | 'persistent'} mode
 *   'opacity'    — highlight з'являється при hover, зникає при виході
 *   'persistent' — highlight завжди видимий, при виході повертається до active
 */
export function useMenuHighlight(activeLinkClass, mode = 'opacity') {
  const listRef = useRef(null)
  const [highlight, setHighlight] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: mode === 'opacity' ? 0 : 1,
  })

  const moveHighlight = useCallback((el) => {
    if (!el || !listRef.current) return
    setHighlight(prev => ({
      ...prev,
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      ...(mode === 'opacity' && { opacity: 1 }),
    }))
  }, [mode])

  const getActiveEl = useCallback(() => {
    return listRef.current
      ?.querySelector('[aria-current="page"]')
      ?.closest('li') ?? null
  }, [activeLinkClass])

  const moveToActive = useCallback(() => {
    const activeEl = getActiveEl()
    if (activeEl) moveHighlight(activeEl)
    return activeEl
  }, [getActiveEl, moveHighlight])

  const hideHighlight = useCallback(() => {
    if (mode === 'persistent') {
      // RAF щоб NavLink встиг оновити активний клас
      requestAnimationFrame(moveToActive)
      return
    }
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