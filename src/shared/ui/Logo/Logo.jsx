import LogoSvg from '@/shared/assets/img/icons/logo.svg?react'
import clsx from 'clsx'
import styles from '@/shared/ui/Logo/Logo.module.scss'

const Logo = ({ className }) => {
  return (
    <LogoSvg
      className= {clsx(className, styles.logo)}
      aria-label="Stream Vibe"
      role="img"
      focusable="false"
    />
  )
}

export default Logo