const debug = process.env.NODE_ENV === 'development'
  ? (...args) => console.log(...args)
  : () => {}