import clsx from 'clsx'
import styles from './Icon.module.scss'

const Icon = (props) => {
  const {
    name,
    hasFill = false,
    className,
    label,
    title,
    decorative,
  } = props


  // якщо decorative передано явно (true або false) — використовується воно.
  // Якщо не передано — визначається автоматично.
  const isDecorative = decorative ?? (!label && !title)

  return (
    <span
      className={clsx(styles.icon, className)}
    >
      {label && <span className="visually-hidden">{label}</span>}
      <svg
        fill={hasFill ? 'currentColor' : 'none'}
        stroke={hasFill ? 'none' : 'currentColor'}
        aria-hidden={isDecorative}
        role={!isDecorative ? 'img' : undefined}
        focusable="false"
      >
        {title && <title>{title}</title>}
        <use href={`#icon-${name}`} />
      </svg>
    </span>
  )
}

export default Icon


/*
сніпети ic, ic-d, ic-f

  Проп name:
    * ОБОВ'ЯЗКОВИЙ — назва файлу іконки без розширення ('arrow', 'search')
    * Працює через vite-plugin-svg-icons: плагін сканує папку src/shared/assets/icons,
    * збирає всі .svg файли в один спрайт і інжектує в DOM при старті.
    * Достатньо покласти файл arrow.svg в папку — і одразу можна писати name="arrow"

  Проп hasFill:
    * Визначає як іконка намальована в SVG файлі:
    * false (дефолт) = stroke іконка — намальована лініями/обводкою
    *                  відкрий .svg файл і шукай stroke="..." на path елементах
    * true           = fill іконка — суцільна заповнена фігура
    *                  відкрий .svg файл і шукай fill="..." без stroke
    * Колір в обох випадках береться автоматично з CSS властивості color батьківського елементу


Всі приклади використання:

  1. Декоративна іконка — є текст поруч, іконка лише для краси:
  <button>
    <Icon name="arrow" decorative />
    Далі
  </button>

  2. Значуща іконка — кнопка без тексту, скрінрідер має прочитати:
  <button>
    <Icon name="search" label="Пошук" />
  </button>

  3. Іконка з підказкою при наведенні:
  <Icon name="info" title="Додаткова інформація" />

  4. Іконка з label і title одночасно:
  <Icon
    name="delete"
    label="Видалити елемент"
    title="Видалити"
  />

  5. Немає тексту поруч — скрінрідер має прочитати що це
  <Icon
    name="search"
    size={24}
    label="Пошук"
    title="Пошук"
  />
  Тобто title і label не завжди обов'язкові — тільки коли іконка несе
  змістове навантаження без тексту поруч. Якщо є підпис — достатньо decorative.



  <title> в SVG
    Це SVG елемент — аналог alt для зображень.
    Показується як підказка при наведенні курсору і зчитується скрінрідерами.
    Це не HTML <title> з <head>.

  focusable="false"
    Фікс для старих браузерів (IE, старий Edge)
    де SVG елементи могли отримувати фокус при навігації клавіатурою.
    Без цього атрибуту користувач міг "застрягти" на іконці при навігації Tab.


  // role="img" — повідомляє скрінрідеру що SVG є зображенням.
  // Без цього атрибуту поведінка скрінрідерів непередбачувана:
  // одні читають вміст SVG як текст, інші ігнорують повністю.
  //
  // Стандарт WAI-ARIA (W3C) визначає ролі для нестандартних елементів.
  // Основне правило: використовуй нативні HTML теги де можливо (<button>, <nav>),
  // ARIA додавай тільки коли нативної семантики не вистачає.
  // SVG не має семантики зображення за замовчуванням — тому role="img".
  //
  // Коли role="img" встановлено — скрінрідер шукає опис елементу в:
  // 1. <title> всередині SVG  (реалізовано через проп title)
  // 2. aria-labelledby        (не використовується — див. нижче)
  // 3. aria-label             (не використовується — ненадійно при перекладі сторінки)
  // Замість aria-label використовуємо visually-hidden через проп label — надійніше.
  //
  // undefined як значення role — React не рендерить атрибут в DOM взагалі.
  // Для декоративних іконок role не потрібен бо aria-hidden ховає елемент повністю.

  role — це ARIA атрибут який повідомляє скрінрідеру що це за елемент. Значень дуже багато, ось найпоширеніші:

  Структурні:
    role="banner"       ← header сторінки
    role="main"         ← основний контент
    role="navigation"   ← навігація
    role="footer"       ← підвал
    role="aside"        ← бічна панель

    Інтерактивні:
    role="button"       ← кнопка
    role="link"         ← посилання
    role="menu"         ← меню
    role="menuitem"     ← пункт меню
    role="tab"          ← вкладка
    role="tabpanel"     ← панель вкладки
    role="dialog"       ← модальне вікно

    Форми:
    role="form"         ← форма
    role="textbox"      ← текстове поле
    role="checkbox"     ← чекбокс
    role="radio"        ← радіо кнопка
    role="combobox"     ← випадаючий список

    Контент:
    role="img"          ← зображення
    role="figure"       ← ілюстрація з підписом
    role="heading"      ← заголовок
    role="list"         ← список
    role="listitem"     ← елемент списку
    role="table"        ← таблиця

    Спеціальні:
    role="alert"        ← важливе повідомлення (зчитується одразу)
    role="status"       ← статус (зчитується коли є час)
    role="tooltip"      ← підказка
    role="presentation" ← декоративний елемент (як aria-hidden)
    role="none"         ← те саме що presentation

*/
