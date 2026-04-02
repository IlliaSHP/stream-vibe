// Допоміжні модулі блокування прокручування та стрибка
export let bodyLockStatus = true
export const bodyLockToggle = (delay = 500) => {
  if (document.documentElement.hasAttribute("data-fls-scrolllock")) {
    bodyUnlock(delay)
  } else {
    bodyLock(delay)
  }
}
export const bodyUnlock = (delay = 500) => {
  if (bodyLockStatus) {
    const lockPaddingElements = document.querySelectorAll("[data-fls-lp]");
    setTimeout(() => {
      lockPaddingElements.forEach(lockPaddingElement => {
        lockPaddingElement.style.paddingRight = ''
      });
      document.body.style.paddingRight = ''
      document.documentElement.removeAttribute("data-fls-scrolllock")
    }, delay)
    bodyLockStatus = false
    setTimeout(function () {
      bodyLockStatus = true
    }, delay)
  }
}
export const bodyLock = (delay = 500) => {
  if (bodyLockStatus) {
    const lockPaddingElements = document.querySelectorAll("[data-fls-lp]")
    const lockPaddingValue = window.innerWidth - document.body.offsetWidth + 'px'
    lockPaddingElements.forEach(lockPaddingElement => {
      lockPaddingElement.style.paddingRight = lockPaddingValue
    });

    document.body.style.paddingRight = lockPaddingValue
    document.documentElement.setAttribute("data-fls-scrolllock", '')

    bodyLockStatus = false
    setTimeout(function () {
      bodyLockStatus = true
    }, delay)
  }
}