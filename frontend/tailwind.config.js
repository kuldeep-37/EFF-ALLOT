/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        primary: '#3B82F6', // modern blue
        secondary: '#6366F1', // indigo
        dark: '#0F172A', // slate-900
        darker: '#020617', // slate-950
        panel: 'rgba(30, 41, 59, 0.7)', // glass panel slate-800
        accent: '#10B981', // emerald
        danger: '#F43F5E', // rose
      }
    },
  },
  plugins: [],
}
