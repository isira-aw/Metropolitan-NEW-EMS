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
        // Two-color brand system - do not add further brand colors.
        'brand': '#7b9acc',             // Primary - nav, buttons, active states, id backgrounds
        'cream': '#FCF6F5',             // Secondary - page background, card surfaces, button text

        // Legacy token names kept so existing classes keep working, remapped to the two-color system.
        'corporate-blue': '#7b9acc',
        'soft-blue': '#7b9acc',
        'pure-black': '#000000',
        'light-bg': '#FCF6F5',

        primary: {
          DEFAULT: '#7b9acc',
          hover: '#7b9acc',
          light: '#7b9acc',
        },
        secondary: {
          DEFAULT: '#7b9acc',
          hover: '#7b9acc',
        },
      },
      boxShadow: {
        // Custom shadow for modals
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
