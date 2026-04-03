// matchMedia — це правильний браузерний API для реакції на зміну брейкпоінту.
// Він точно відповідає тому що робить CSS медіазапит, на відміну від window.innerWidth + resize.

import { useState, useEffect } from 'react'
import {MOBILE_BREAKPOINT} from '@/shared/constants'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}