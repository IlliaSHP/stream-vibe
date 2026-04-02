import { useEffect, useRef } from 'react'

export function useHeaderScroll({
  startPoint = 1,
  showOnScrollUp = false,
  showTimer = 500,
} = {}) {
  const headerRef = useRef(null)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    let scrollDirection = 0
    let timer

    const handleScroll = () => {
      const scrollTop = window.scrollY
      clearTimeout(timer) //очистка при новому скролі

      if (scrollTop >= startPoint) {
        header.classList.add('--header-scroll')

        if (showOnScrollUp) {
          if (scrollTop > scrollDirection) {
            // скролл вниз — ховаємо
            header.classList.remove('--header-show')
          } else {
            // скролл вгору — показуємо
            header.classList.add('--header-show')
          }

          timer = setTimeout(() => {
            header.classList.add('--header-show')
          }, showTimer)
        }
      } else {
        header.classList.remove('--header-scroll')
        if (showOnScrollUp) {
          header.classList.remove('--header-show')
        }
      }

      scrollDirection = scrollTop <= 0 ? 0 : scrollTop
    }

    window.addEventListener('scroll', handleScroll)

    // очистка при розмонтуванні
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [startPoint, showOnScrollUp, showTimer])

  return headerRef
}