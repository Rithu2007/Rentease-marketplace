/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "hsl(var(--background))",
        surfaceCard: "hsl(var(--surface))",
        goldAccent: "hsl(var(--accent))",
        tealAccent: "hsl(var(--secondary))",
        borderGold: "hsl(var(--accent) / 0.2)",
        borderCard: "var(--border-card)",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
