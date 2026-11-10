import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#B91C1C',    // Rojo Carmesí Institucional
          secondary: '#DC2626',  // Rojo Vibrante Secundario
          accent: '#F59E0B',     // Dorado / Ámbar de Contraste
          danger: '#EF4444',
          dark: '#0F172A',
          light: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#B91C1C',
          hover: '#991B1B',
          light: '#FEF2F2',
        },
        secondary: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
      },
      boxShadow: {
        'brand': '0 10px 30px -5px rgba(185, 28, 28, 0.25)',
        'card-hover': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
