/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Couleurs palette luxe turquoise pastel
      colors: {
        'accent': '#8FD5D1',
        'accent-clair': '#1A2528',
        'bordure': 'rgba(143, 213, 209, 0.2)',
        'fond-casse': '#12110E',
        'heavens-noir': '#060606',
        'heavens-gris': '#9A9288',
      },
      // Polices
      fontFamily: {
        'great-vibes': ['Great Vibes', 'cursive'],
        'cormorant': ['Cormorant Garamond', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      // Transitions uniformes
      transitionDuration: {
        DEFAULT: '300ms',
      },
      // Espacements personnalisés
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Aspect ratios produits
      aspectRatio: {
        'product': '1 / 1',
        'category': '3 / 4',
        'hero': '4 / 5',
      },
      // Box shadows luxe
      boxShadow: {
        'product': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'cart': '0 8px 40px rgba(10, 10, 10, 0.15)',
        'modal': '0 20px 60px rgba(10, 10, 10, 0.2)',
      },
      // Animation shimmer (skeleton loader)
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-up': 'fadeUp 0.3s ease',
      },
    },
  },
  plugins: [],
};
