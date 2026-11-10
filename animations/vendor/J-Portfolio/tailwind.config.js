/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Portfolio color palette
        void: {
          DEFAULT: '#020202',
          light: '#080808',
        },
        terminal: {
          DEFAULT: '#f5f5f5', // daha açık
          muted: '#ededed',   // daha açık
          dark: '#bdbdbd',
        },
        alert: {
          DEFAULT: '#ff3333',
          glow: 'rgba(255, 51, 51, 0.3)',
        },
        // Legacy colors for compatibility
        primary: '#ffffff',
        secondary: '#ededed', // daha açık
        accent: '#ff3333',
        background: '#020202',
        surface: '#080808',
        'surface-light': '#111111',
        text: '#f5f5f5', // daha açık
        'text-muted': '#ededed', // daha açık
        border: 'rgba(255,255,255,0.15)',
        success: '#00ff88',
        warning: '#ffaa00',
        error: '#ff3333',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        tech: ['Share Tech Mono', 'monospace'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      animation: {
        'gradient': 'gradient 3s ease infinite',
        'shimmer': 'shimmer 2s infinite',
        'scanline': 'scanline 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 0.5s steps(10) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scanline: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse at center, transparent 0%, rgba(10,10,15,0.8) 70%, rgba(10,10,15,1) 100%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
