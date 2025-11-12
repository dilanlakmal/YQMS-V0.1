/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        // We will now apply this animation class directly on hover
        shimmer: "shimmer 3s linear infinite"
      },
      colors: {
        'translator-background': 'var(--translator-background)',
        'translator-foreground': 'var(--translator-foreground)',
        'translator-card': 'var(--translator-card)',
        'translator-card-foreground': 'var(--translator-card-foreground)',
        'translator-primary': 'var(--translator-primary)',
        'translator-primary-foreground': 'var(--translator-primary-foreground)',
        'translator-muted': 'var(--translator-muted)',
        'translator-muted-foreground': 'var(--translator-muted-foreground)',
        'translator-destructive': 'var(--translator-destructive)',
        'translator-destructive-foreground': 'var(--translator-destructive-foreground)',
        'translator-border': 'var(--translator-border)',
        'translator-ring': 'var(--translator-ring)',
      }
    }
  },
  plugins: []
};
