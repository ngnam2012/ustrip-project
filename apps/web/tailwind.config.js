/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        travel: '#007AFF',
        mint: '#00D1A0',
        coral: '#FF7061',
        ink: '#191C1D',
        muted: '#667085',
        canvas: '#F1F3F5'
      },
      fontFamily: { sans: ['Be Vietnam Pro', 'sans-serif'] },
      boxShadow: { card: '0 4px 20px rgba(0,0,0,.05)', lift: '0 12px 36px rgba(0,88,188,.14)' }
    }
  },
  plugins: []
};
