import styles from '../Menu.module.scss'
import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { useMenuOpen } from '@/widgets/Header/model/useMenuInit'
import {useMenuHighlight} from '@/widgets/Header/model/useMenuHighlight'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies & Shows' },
  { to: '/support', label: 'Support' },
  { to: '/subscriptions', label: 'Subscriptions' },
]

const Menu = () => {
  const { isOpen, toggle } = useMenuOpen()
  const { listRef, highlight, moveHighlight, hideHighlight } = useMenuHighlight(
    styles.headerMenuLinkActive,
    "persistent"
  )

  return (
    <>
      <button
        type="button"
        data-fls-menu
        className={styles.menuIcon}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 32 32">
          <path
            className={clsx(styles.line, styles.lineTopBottom)}
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          />
          <path
            className={styles.line}
            d="M7 16 27 16"
          />
        </svg>
      </button>

      <nav className={styles.headerMenu}>
        <ul
          ref={listRef}
          className={styles.headerMenuList}
          onMouseLeave={hideHighlight}
        >
          {/* підсвітка яка переміщується */}
          <span
            className={styles.headerMenuHighlight}
            style={{
              left: highlight.left,
              width: highlight.width,
              opacity: highlight.opacity,
            }}
          />
          {navLinks.map(({ to, label }, index) => (
            <li
              key={to}
              className={styles.headerMenuItem}
              style={{ '--i': index }}
              onMouseEnter={(e) => moveHighlight(e.currentTarget)}
              // onClick={(e) => moveHighlight(e.currentTarget)}
            >
              <NavLink
                to={to}
                className={({ isActive }) => clsx(
                  styles.headerMenuLink,
                  isActive && styles.headerMenuLinkActive
                )}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

export default Menu