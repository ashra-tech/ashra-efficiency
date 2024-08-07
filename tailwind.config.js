/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
          'ui-white-title': '#858585',
          'ui-white-text': '#A5A5A5',
          'ui-orange': '#FF8C00',
          'ui-purple': '#cc00cc',
          'ui-blue': '#00BBFF',
          'ui-light-blue': '#b0ddff',
          'ui-light-gray': '#36393e',
          'ui-medium-gray': '#282b30',
          'ui-dark-gray': '#1e2124',
          'ui-cloud': 'rgb(30, 31, 34)',
          'ui-bg': 'rgb(49, 51, 56)',
          'ui-ground': '#000000',
          'ui-hamburger': 'rgb(43, 45, 49)',
        },
    },
  },
  plugins: [],
}