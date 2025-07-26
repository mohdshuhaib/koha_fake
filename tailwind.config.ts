/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-grey': '#fffdd1',
        'primary-dark-grey': '#e1e1e0',
        'secondary-white': '#3c041a',
        'secondary-light-black': '#342d2d',
        'dark-green': '#3c041a',
        'light-green': '#72b141',
        'icon-green': '#fffdd1',
        'button-yellow': '#ffc106',
        'heading-text-black': '#fffdd1',
        'text-grey': '#ffff',
        'button-text-black': '#000000',
        'sub-heading-text-grey': '#fffdd1',
        'link-text-green': '#016501',
      },
      fontFamily: {
        body: "var(--font-muller2)",
        heading: "var(--font-muller)",
        malayalam: "var(--font-anek)",
      },
    },
  },
  plugins: [],
}
