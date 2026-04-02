import styles from '../Header.module.scss'
import Icon from '@/shared/ui/Icon'
import { Link } from 'react-router-dom'
import Menu from './Menu'
import Logo from '@/shared/ui/Logo/Logo'
import {useHeaderScroll} from '@/widgets/Header/model/useHeaderScroll'


const Header = () => {
  const headerRef = useHeaderScroll({
    startPoint: 1,
    showOnScrollUp: false,
  })

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <div className={styles.headerLogo}>
          <Link to="/" className={styles.headerLogo}>
            <Logo className={styles.headerLogoIcon} />
          </Link>
        </div>

        <Menu />

        <div className={styles.headerActions}>
          <Link
            to="/search-movie"
            className={styles.headerActionsLink}
          >
            <Icon
              name="search"
              label="search movie"
              title="search movie"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header