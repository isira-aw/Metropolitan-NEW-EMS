/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary background - Dark slate/navy
        primary: {
          bg: '#0F172A',
        },
        // Using default Tailwind colors for most cases:
        // - slate: for text colors (slate-900, slate-600, slate-400)
        // - blue: for primary actions (blue-600, blue-700)
        // - red: for error states (red-50, red-200, red-700)
      },
      boxShadow: {
        // Custom shadow for modals
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
