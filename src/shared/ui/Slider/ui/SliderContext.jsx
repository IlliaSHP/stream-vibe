import { createContext, useContext } from 'react'

export const SliderContext = createContext(null)

/**
 * Хук для доступу до контексту слайдера.
 * Викидає помилку якщо компонент використовується поза SliderRoot.
 */
export const useSlider = () => {
  const ctx = useContext(SliderContext)
  if (!ctx) {
    throw new Error('useSlider must be used within SliderRoot')
  }
  return ctx
}