import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C', // Color primario institucional
          800: '#991B1B',
          900: '#7F1D1D',
          primary: '#B91C1C',
          secondary: '#991B1B',
          accent: '#D97706',
          danger: '#DC2626',
          dark: '#09090B',
          light: '#FAFAFA',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#D97706',
        },
        semantic: {
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C',
        },
      },
      borderRadius: {
        sm: '0.375rem',   // 6px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.25rem', // 20px (máximo permitido para contenedores grandes)
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(9, 9, 11, 0.04)',
        card: '0 4px 12px -2px rgba(9, 9, 11, 0.06), 0 2px 4px -2px rgba(9, 9, 11, 0.04)',
        float: '0 16px 32px -8px rgba(9, 9, 11, 0.12), 0 4px 8px -4px rgba(9, 9, 11, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
