import defaultTheme from 'tailwindcss/defaultTheme'
import { theme } from './tailwind_plugins/theme'

const variantsVars = {
  'this-lighter': 'rgb(var(--this-lighter) / <alpha-value>)',
  'this-light': 'rgb(var(--this-light) / <alpha-value>)',
  'this': 'rgb(var(--this) / <alpha-value>)',
  'this-darker': 'rgb(var(--this-darker) / <alpha-value>)',
}

const surfaceColors = {
  'surface-1': 'rgb(var(--surface-1) / <alpha-value>)',
  'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
  'surface-3': 'rgb(var(--surface-3) / <alpha-value>)'
}

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {      
      fontFamily: {
        sans: ["Plus Jakarta Sans", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        tiny: ["0.625rem", "0.8125rem"],
        "tiny+": ["0.6875rem", "0.875rem"],
        "xs+": ["0.8125rem", "1.125rem"],
        "sm+": ["0.9375rem", "1.375rem"],
      },
      boxShadow: {
        // soft: "0 3px 10px 0 rgb(48 46 56 / 6%)",
        soft: "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
        "soft-dark": "0 3px 10px 0 rgb(25 25 25 / 30%)",
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        18: "4.5rem",
      },
      transitionTimingFunction: {
        elastic: 'cubic-bezier(0.53, 0.21, 0.29, 0.67)'
      },
      colors: {
        ...variantsVars,
        ...surfaceColors,
        // Palette étendue pour l'espace admin : les couleurs de marque
        // (orange/bleu) restent premières, complétées par 4 teintes terre
        // inspirées des textiles et poteries traditionnels d'Afrique de
        // l'Ouest — clay (terracotta), gold (fils dorés du kente), forest
        // (bogolan/feuillage), indigo (teinture adire) — utilisées en
        // accents ponctuels (PatternStrip, bordures, détails), jamais en
        // remplacement du bleu/orange de marque. Déclarées ici comme
        // tokens nommés (plutôt que `bg-[#...]` en dur comme le reste de
        // l'admin aujourd'hui) pour que ces nouvelles couleurs restent
        // faciles à réutiliser et à ajuster depuis un seul endroit.
        dbc: {
          orange: "#EE7115",
          blue: "#52A2DF",
          clay: "#B2461D",
          gold: "#D8A22C",
          forest: "#1B4332",
          indigo: "#2E1F5E",
        },
      },
      borderWidth: {
        3: '3px'
      },
      zIndex: {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5
      },
      animation: {
        shimmer: "shimmer 2s linear infinite"
      },
      keyframes: {
        shimmer: {
          from: {
            "backgroundPosition": "0 0"
          },
          to: {
            "backgroundPosition": "-200% 0"
          }
        }
      }
    },
  },
  corePlugins: {
    textOpacity: false,
    backgroundOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
  },
  plugins: [
    theme,
  ],
}

export default config

