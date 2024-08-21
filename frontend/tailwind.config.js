/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        earth: {
          "primary": "#0B2631",
          "secondary": "#73A6B1",
          "accent": "#C7D243",
          "neutral": "#F2F4E4",
          "base-100": "#F2F4E4",
          "info": "#73A6B1",
          "success": "#00760C",
          "warning": "#C7D243",
          "error": "#0B2631",
        }
      },
    ],
  },
}

