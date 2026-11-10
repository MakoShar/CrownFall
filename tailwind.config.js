/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kingdom: {
          gold: "#f59e0b",
          goldLight: "#fbbf24",
          goldDark: "#b45309",
          silver: "#94a3b8",
          silverLight: "#cbd5e1",
          silverDark: "#475569",
          stone: "#1e293b",
          darkStone: "#0f172a",
          obsidian: "#090d16",
          blood: "#dc2626",
          mana: "#38bdf8",
          emerald: "#10b981",
          amethyst: "#a855f7"
        }
      },
      fontFamily: {
        fantasy: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'regal-gold': '0 0 25px rgba(245, 158, 11, 0.4)',
        'regal-silver': '0 0 25px rgba(148, 163, 184, 0.4)',
        'siege': '0 0 30px rgba(220, 38, 38, 0.5)',
      }
    },
  },
  plugins: [],
}

