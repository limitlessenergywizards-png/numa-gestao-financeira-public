import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          muted: "hsl(var(--sidebar-muted))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Extended Numa Brand Palette - Verde Profundo
        numa: {
          50: "#E8F0EE",
          100: "#D1E1DD",
          200: "#A3C3BB",
          300: "#1B3B34",
          400: "#17322C",
          500: "#132925",
          600: "#0F201D",
          deep: "#1B3B34",
          light: "#E5E5E5",
          gold: "#C5A059",
        },
        // Extended Gold Palette - Dourado Metálico
        gold: {
          50: "#FCF9F3",
          100: "#F7EFDD",
          200: "#E7CF99",
          300: "#D6B879",
          400: "#C5A059",
          500: "#A98A4A",
          600: "#8D733D",
          DEFAULT: "#C5A059",
        },
        // Verde Metálico - Nova escala
        metallic: {
          50: "hsl(var(--metallic-green-50))",
          100: "hsl(var(--metallic-green-100))",
          200: "hsl(var(--metallic-green-200))",
          300: "hsl(var(--metallic-green-300))",
          400: "hsl(var(--metallic-green-400))",
          500: "hsl(var(--metallic-green-500))",
          600: "hsl(var(--metallic-green-600))",
          700: "hsl(var(--metallic-green-700))",
          800: "hsl(var(--metallic-green-800))",
          900: "hsl(var(--metallic-green-900))",
          950: "hsl(var(--metallic-green-950))",
        },
        // Superfícies escuras
        dark: {
          void: "hsl(var(--dark-void))",
          base: "hsl(var(--dark-base))",
          surface: "hsl(var(--dark-surface))",
          elevated: "hsl(var(--dark-elevated))",
          border: "hsl(var(--dark-border))",
        },
        // Glass surfaces - now uses CSS variables for theme support
        glass: {
          void: "var(--glass-void)",
          base: "var(--glass-base)",
          surface: "var(--glass-surface)",
          elevated: "var(--glass-elevated)",
          highlight: "var(--glass-highlight)",
          border: "var(--glass-border)",
          "border-light": "var(--glass-border-light)",
        },
        // Semantic with glow
        semantic: {
          success: "hsl(160 84% 39%)",
          "success-glow": "hsla(160 84% 39% / 0.3)",
          warning: "hsl(38 92% 50%)",
          "warning-glow": "hsla(38 92% 50% / 0.3)",
          danger: "hsl(0 84% 60%)",
          "danger-glow": "hsla(0 84% 60% / 0.3)",
          info: "hsl(199 89% 48%)",
          "info-glow": "hsla(199 89% 48% / 0.3)",
        },
        // Cores extras para status vibrantes
        indigo: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        violet: {
          DEFAULT: "hsl(var(--violet))",
          foreground: "hsl(var(--violet-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          light: "hsl(var(--brand-light))",
          dark: "hsl(var(--brand-dark))",
          foreground: "hsl(var(--brand-foreground))",
          muted: "hsl(var(--brand-muted))",
          glow: "hsl(var(--brand-glow))",
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C5A059 0%, #D6B879 50%, #A98A4A 100%)',
        'numa-gradient': 'linear-gradient(135deg, #1B3B34 0%, #17322C 100%)',
        // Glass gradients
        'glass-gradient': 'linear-gradient(135deg, hsla(0 0% 100% / 0.08) 0%, hsla(0 0% 100% / 0.02) 100%), hsla(168 37% 8% / 0.7)',
        'glass-shine': 'linear-gradient(135deg, hsla(0 0% 100% / 0.08) 0%, hsla(0 0% 100% / 0.02) 50%, hsla(0 0% 0% / 0.1) 100%)',
        'glass-warm': 'linear-gradient(135deg, hsla(42 50% 56% / 0.08) 0%, hsla(42 50% 56% / 0.02) 100%)',
        // Gold gradients
        'gold-shimmer': 'linear-gradient(135deg, #A88441 0%, #C5A059 25%, #E0C89A 50%, #C5A059 75%, #A88441 100%)',
        'gold-subtle': 'linear-gradient(135deg, hsla(42 50% 56% / 0.15) 0%, hsla(42 50% 56% / 0.05) 100%)',
        // Ambient backgrounds
        'ambient-glow': 'radial-gradient(ellipse at 30% 20%, hsla(168 37% 17% / 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsla(42 50% 56% / 0.1) 0%, transparent 50%)',
        'hero-mesh': 'radial-gradient(ellipse at 20% 50%, hsla(42 50% 56% / 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsla(168 37% 17% / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, hsla(199 89% 48% / 0.08) 0%, transparent 40%)',
        // Verde Metálico - Gradientes
        'metallic-gradient': 'linear-gradient(135deg, hsl(152 38% 18%) 0%, hsl(150 35% 27%) 50%, hsl(142 25% 42%) 100%)',
        'metallic-shine': 'linear-gradient(135deg, hsl(150 35% 27%) 0%, hsl(145 35% 36%) 30%, hsl(98 40% 62%) 50%, hsl(145 35% 36%) 70%, hsl(150 35% 27%) 100%)',
        'metallic-surface': 'linear-gradient(160deg, hsla(152 38% 18% / 0.9) 0%, hsla(150 35% 27% / 0.8) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at 30% 20%, hsla(150 35% 27% / 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsla(145 35% 36% / 0.1) 0%, transparent 50%)',
      },
      boxShadow: {
        // Glass shadows
        'glass-sm': '0 2px 8px hsla(168 37% 5% / 0.3), inset 0 1px 0 hsla(0 0% 100% / 0.05)',
        'glass-md': '0 4px 16px hsla(168 37% 5% / 0.4), inset 0 1px 0 hsla(0 0% 100% / 0.08)',
        'glass-lg': '0 8px 32px hsla(168 37% 5% / 0.5), inset 0 1px 0 hsla(0 0% 100% / 0.1)',
        'glass-xl': '0 16px 48px hsla(168 37% 5% / 0.6), inset 0 1px 0 hsla(0 0% 100% / 0.12)',
        // Gold glow
        'gold-glow': '0 0 20px hsla(42 50% 56% / 0.3), 0 0 40px hsla(42 50% 56% / 0.15)',
        'gold-glow-sm': '0 0 10px hsla(42 50% 56% / 0.2)',
        'gold-glow-intense': '0 0 30px hsla(42 50% 56% / 0.4), 0 0 60px hsla(42 50% 56% / 0.2), 0 0 90px hsla(42 50% 56% / 0.1)',
        // Green glow
        'green-glow': '0 0 20px hsla(168 37% 17% / 0.5), 0 0 40px hsla(168 37% 17% / 0.3)',
        // Card shadows
        'card-float': '0 10px 40px hsla(168 37% 5% / 0.4), 0 2px 10px hsla(168 37% 5% / 0.2)',
        // Verde Metálico - Sombras
        'metallic-sm': '0 2px 8px hsla(162 35% 10% / 0.3), inset 0 1px 0 hsla(98 40% 62% / 0.1)',
        'metallic-md': '0 4px 16px hsla(162 35% 10% / 0.4), inset 0 1px 0 hsla(98 40% 62% / 0.15)',
        'metallic-lg': '0 8px 32px hsla(162 35% 10% / 0.5), inset 0 1px 0 hsla(98 40% 62% / 0.2)',
        'metallic-glow': '0 0 20px hsla(150 35% 27% / 0.4), 0 0 40px hsla(150 35% 27% / 0.2)',
        'metallic-glow-intense': '0 0 30px hsla(145 35% 36% / 0.5), 0 0 60px hsla(145 35% 36% / 0.3), 0 0 90px hsla(145 35% 36% / 0.1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        'out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-subtle': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 15px hsl(42 50% 56% / 0.3)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 25px hsl(42 50% 56% / 0.5)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(197,160,89,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(197,160,89,0.7)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px hsla(42 50% 56% / 0.2)" },
          "50%": { boxShadow: "0 0 30px hsla(42 50% 56% / 0.4)" },
        },
        "glow-breathe": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "parallax-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "spotlight": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "scroll-x": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "glass-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glass-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-8px) rotate(1deg)" },
          "75%": { transform: "translateY(4px) rotate(-1deg)" },
        },
        "glass-pulse": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "orbital": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "aurora": {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0) scale(1)" },
          "50%": { opacity: "0.5", transform: "translateY(-5%) scale(1.05)" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", filter: "blur(40px)" },
          "50%": { transform: "scale(1.1)", filter: "blur(50px)" },
        },
        "magnetic-float": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(10px, -10px)" },
        },
        "glass-shatter": {
          "0%": { opacity: "0", transform: "scale(0.9) rotate(-5deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "row-enter": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "glow-breathe": "glow-breathe 4s ease-in-out infinite",
        "count-up": "count-up 1.5s ease-out",
        "parallax-float": "parallax-float 6s ease-in-out infinite",
        "spotlight": "spotlight 3s linear infinite",
        "scroll-x": "scroll-x 30s linear infinite",
        "glass-shimmer": "glass-shimmer 3s ease-in-out infinite",
        "glass-float": "glass-float 6s ease-in-out infinite",
        "glass-pulse": "glass-pulse 4s ease-in-out infinite",
        "orbital": "orbital 20s linear infinite",
        "orbital-slow": "orbital 30s linear infinite",
        "orbital-reverse": "orbital 25s linear infinite reverse",
        "aurora": "aurora 8s ease-in-out infinite",
        "breathe": "breathe 6s ease-in-out infinite",
        "magnetic-float": "magnetic-float 5s ease-in-out infinite",
        "glass-shatter": "glass-shatter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "row-enter": "row-enter 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        heading: ["var(--font-syne)", "system-ui", "sans-serif"],
        syne: ["var(--font-syne)", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        'xs': '4px',
        '2xl': '40px',
        '3xl': '60px',
        '4xl': '80px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom Glassmorphism utilities
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        // Light mode glass
        '.glass-premium': {
          background: 'linear-gradient(135deg, hsla(0 0% 100% / 0.9) 0%, hsla(0 0% 100% / 0.8) 100%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(150%)',
          border: '1px solid hsla(168 30% 30% / 0.1)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px hsla(168 37% 17% / 0.08), inset 0 1px 0 hsla(0 0% 100% / 0.9)',
        },
        '.dark .glass-premium': {
          background: 'linear-gradient(135deg, hsla(0 0% 100% / 0.08) 0%, hsla(0 0% 100% / 0.02) 100%), hsla(168 37% 8% / 0.7)',
          border: '1px solid hsla(0 0% 100% / 0.08)',
          boxShadow: '0 8px 32px hsla(168 37% 5% / 0.4), inset 0 1px 0 hsla(0 0% 100% / 0.08)',
        },
        '.glass-premium-warm': {
          background: 'linear-gradient(135deg, hsla(42 50% 98% / 0.9) 0%, hsla(42 50% 95% / 0.8) 100%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(150%)',
          border: '1px solid hsla(42 50% 56% / 0.15)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px hsla(168 37% 17% / 0.08), inset 0 1px 0 hsla(0 0% 100% / 0.9)',
        },
        '.dark .glass-premium-warm': {
          background: 'linear-gradient(135deg, hsla(42 50% 56% / 0.08) 0%, hsla(42 50% 56% / 0.02) 100%), hsla(168 37% 8% / 0.7)',
          boxShadow: '0 8px 32px hsla(168 37% 5% / 0.4), inset 0 1px 0 hsla(42 50% 56% / 0.08)',
        },
        '.glass-subtle': {
          background: 'hsla(0 0% 100% / 0.7)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid hsla(168 30% 30% / 0.08)',
          borderRadius: '16px',
        },
        '.dark .glass-subtle': {
          background: 'hsla(168 37% 8% / 0.5)',
          border: '1px solid hsla(0 0% 100% / 0.05)',
        },
        '.glass-nav': {
          background: 'linear-gradient(180deg, hsla(0 0% 100% / 0.95) 0%, hsla(0 0% 100% / 0.9) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(24px) saturate(180%)',
          border: '1px solid hsla(168 30% 30% / 0.1)',
        },
        '.dark .glass-nav': {
          background: 'linear-gradient(180deg, hsla(168 37% 6% / 0.85) 0%, hsla(168 37% 6% / 0.95) 100%)',
          border: '1px solid hsla(0 0% 100% / 0.08)',
        },
        '.shine-overlay': {
          position: 'relative',
        },
        '.shine-overlay::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '50%',
          background: 'linear-gradient(180deg, hsla(0 0% 100% / 0.06) 0%, transparent 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        },
      });
    },
  ],
} satisfies Config;
