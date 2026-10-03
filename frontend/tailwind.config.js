import {nextui} from '@nextui-org/theme'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      dropShadow: {
        glow: [
          "0 0px 40px rgba(255,255, 255, 0.35)",
          "0 0px 65px rgba(255, 255,255, 0.2)"
        ],
        "glow-md": [
          "0 10px 60px rgba(255,255, 255, 1)",
          "0 10px 65px rgba(255, 255,255, 1)"
        ]
      }
    },
    fontFamily:
    {
      sans: ['Montserrat']
    }
  },
  darkMode: "class",
  plugins: [nextui()],
}
