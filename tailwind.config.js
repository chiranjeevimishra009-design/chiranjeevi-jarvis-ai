/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#050816',
        panel: '#0b1220',
        neon: '#69e3ff',
        accent: '#8b5cf6',
        mint: '#34d399'
      },
      boxShadow: {
        glow: '0 0 20px rgba(105, 227, 255, 0.4)'
      },
      backgroundImage: {
        aurora: 'radial-gradient(circle at top, rgba(105, 227, 255, 0.25), transparent 45%), linear-gradient(135deg, #060b16 0%, #111827 40%, #070b14 100%)'
      }
    }
  },
  plugins: []
};
