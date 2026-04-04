import './Button.scss'
import clsx from 'clsx'

const Button = (props) => {
  const {
    className,
  } = props

  return (
    <div
      className={clsx(className, 'button')}
    >
      Button
    </div>
  )
}