/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bp: {
          normal: '#10b981',    // Emerald green for normal BP
          elevated: '#f59e0b',  // Amber for slightly elevated
          high1: '#f97316',     // Orange for Stage 1
          high2: '#ef4444',     // Red for Stage 2 / Hypertensive Crisis
        }
      },
      fontSize: {
        'senior-xl': ['1.75rem', { lineHeight: '2.25rem' }],
        'senior-2xl': ['2.25rem', { lineHeight: '2.5rem' }],
        'senior-3xl': ['3rem', { lineHeight: '1' }],
      }
    },
  },
  plugins: [],
}
