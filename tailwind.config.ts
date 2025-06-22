/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0D0D0D',
        'secondary': '#5F4B8B',
        'sidekick': '#6BBBF6',
        'sidekick-dark': '#3F7EAF',
      },
    },
  },
  plugins: [],
}
