import type { Config } from 'tailwindcss'

export default {
  darkMode: "class",
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "on-surface": "#1b1b1b",
        "on-surface-variant": "#4c4546",
        "inverse-surface": "#303030",
        "inverse-on-surface": "#f1f1f1",
        "outline": "#7e7576",
        "outline-variant": "#cfc4c5",
        "surface-tint": "#5e5e5e",
        "primary": "#000000",
        "on-primary": "#ffffff",
        "primary-container": "#1b1b1b",
        "on-primary-container": "#848484",
        "inverse-primary": "#c6c6c6",
        "secondary": "#24695c",
        "on-secondary": "#ffffff",
        "secondary-container": "#acf0df",
        "on-secondary-container": "#2c6f62",
        "tertiary": "#000000",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#370922",
        "on-tertiary-container": "#b1718c",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#e2e2e2",
        "primary-fixed-dim": "#c6c6c6",
        "on-primary-fixed": "#1b1b1b",
        "on-primary-fixed-variant": "#474747",
        "secondary-fixed": "#acf0df",
        "secondary-fixed-dim": "#91d3c4",
        "on-secondary-fixed": "#00201b",
        "on-secondary-fixed-variant": "#005045",
        "tertiary-fixed": "#ffd8e6",
        "tertiary-fixed-dim": "#fbb1cf",
        "on-tertiary-fixed": "#370922",
        "on-tertiary-fixed-variant": "#6b354e",
        "background": "#f9f9f9",
        "on-background": "#1b1b1b",
        "surface-variant": "#e2e2e2"
      },
      fontFamily: {
        "h1": ["Space Grotesk", "sans-serif"],
        "h2": ["Space Grotesk", "sans-serif"],
        "question-serif": ["Newsreader", "serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-caps": ["Space Grotesk", "sans-serif"],
        "sans": ["Inter", "sans-serif"]
      },
      fontSize: {
        "h1": ["48px", { "lineHeight": "1.1" }],
        "h2": ["32px", { "lineHeight": "1.2" }],
        "question-serif": ["28px", { "lineHeight": "1.4" }],
        "body-lg": ["18px", { "lineHeight": "1.6" }],
        "body-md": ["16px", { "lineHeight": "1.5" }],
        "label-caps": ["12px", { "lineHeight": "1.0" }]
      },
      spacing: {
        "base": "8px",
        "gutter": "16px",
        "card-gap": "20px",
        "container-padding": "24px",
        "section-margin": "48px"
      },
      borderRadius: {
        "sm": "0.5rem",
        "DEFAULT": "1rem",
        "md": "1.5rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      boxShadow: {
        "brutalist-active": "4px 4px 0px 0px #000000",
        "soft-glow": "0 8px 30px rgba(0,0,0,0.04)"
      }
    }
  },
  plugins: []
} satisfies Config
