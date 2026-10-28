/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'hsl(216, 58%, 24%)',
          subtle: 'hsl(216, 58%, 95%)',
        },
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--foreground)',
        },
        'accent-gap': 'var(--accent-gap)',
        'accent-ok': 'var(--accent-ok)',
        oatmeal: {
          50: '#fdfcf9',
          100: '#f8f4ed', // hsl(38, 30%, 96%)
          200: '#f0ebe1', // hsl(38, 32%, 92%)
          300: '#dfdcd7', // hsl(36, 16%, 86%)
          400: '#cac4bb',
          500: '#9e9689',
        },
        navy: {
          950: '#0e1626',
          900: '#17223a', // hsl(216, 40%, 15%)
          850: '#1c2d4e',
          800: '#204079', // hsl(216, 58%, 30%)
          700: '#274e94',
          600: '#3463b8',
          100: '#e5ecf6',
          50: '#f1f5fa',
        },
      },
    },
  },
  plugins: [],
}
