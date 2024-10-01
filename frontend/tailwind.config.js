/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}", "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        nature: {
          "primary": "#283106",
          "secondary": "#A3B18A",
          "accent": "#B7B7A4",
          "neutral": "#3A3A3A",
          "base-100": "#F4F4F4",
          "info": "#A3B18A",
          "success": "#4CAF50",
          "warning": "#FFC107",
          "error": "#F44336",
        }
      },
      {
        night: {
          "primary": "#A3B18A",
          "secondary": "#5A6B47",
          "accent": "#8A8E7D",
          "neutral": "#D1D1D1",
          "base-100": "#1E2419",
          "base-200": "#252D1F",
          "base-300": "#2C3625",
          "info": "#73A6B1",
          "success": "#4CAF50",
          "warning": "#FFC107",
          "error": "#F44336",
        }
      }
    ],
  },
}

