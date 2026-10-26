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
          primary: '#1E3A8A',
          secondary: '#D97706',
          accent: '#10B981',
          danger: '#EF4444',
          dark: '#0F172A',
          light: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
};

export default config;
