/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-grey': '#f3f4f5',
        'primary-dark-grey': '#e1e1e0',
        'secondary-white': '#fefeff',
        'secondary-light-black': '#342d2d',
        'dark-green': '#418740',
        'light-green': '#72b141',
        'icon-green': '#145f17',
        'button-yellow': '#ffc106',
        'heading-text-black': '#000000',
        'text-grey': '#5c5d5c',
        'button-text-black': '#000000',
        'sub-heading-text-grey': '#6e716e',
        'link-text-green': '#016501',
      },
      fontFamily: {
        body: "var(--font-muller2)",
        heading: "var(--font-muller)",
        malayalam: "var(--font-anek)",
      },
      // ✨ Add keyframes and animations here
      keyframes: {
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'slide-down': 'slide-down 0.2s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}