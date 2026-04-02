import { useState, useEffect } from 'react'
import { bodyLockToggle } from '@/shared/utils/bodyLock'


export function useMenuOpen() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => {
    setIsOpen(prev => !prev)
    bodyLockToggle()
  }

  useEffect(() => {
    document.documentElement.toggleAttribute('data-fls-menu-open', isOpen)
  }, [isOpen])

  //* Другий аргумент
  // — це умова. Якщо isOpen = true — атрибут додається,
  // якщо false — видаляється. Це скорочення замість:
  //
  // if (isOpen) {
  //   document.documentElement.setAttribute('data-fls-menu-open', '')
  // } else {
  //   document.documentElement.removeAttribute('data-fls-menu-open')
  // }

  return { isOpen, toggle }
}