/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0f0c29',
        'secondary': '#302b63',
        'sidekick': '#24243e',
        'sidekick-dark': '#fca311',
      },
    },
  },
  plugins: [],
}
