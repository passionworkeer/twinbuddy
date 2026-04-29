---
name: Synapse Kinetic
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#24695c'
  on-secondary: '#ffffff'
  secondary-container: '#acf0df'
  on-secondary-container: '#2c6f62'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#370922'
  on-tertiary-container: '#b1718c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#acf0df'
  secondary-fixed-dim: '#91d3c4'
  on-secondary-fixed: '#00201b'
  on-secondary-fixed-variant: '#005045'
  tertiary-fixed: '#ffd8e6'
  tertiary-fixed-dim: '#fbb1cf'
  on-tertiary-fixed: '#370922'
  on-tertiary-fixed-variant: '#6b354e'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  question-serif:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  card-gap: 20px
  container-padding: 24px
  section-margin: 48px
---

## Brand & Style
Synapse Kinetic is a high-energy, academic accelerator designed for the modern student. The visual identity merges **Neo-Brutalism** with a **Clean-Tech** aesthetic. It uses high-contrast borders and vibrant, candy-coated surfaces to create a sense of urgency and engagement, while maintaining a sophisticated clarity through professional typography.

The brand personality is authoritative yet playful—treating complex subjects like biology with the vibrancy of a social app. The UI relies on bold strokes, significant whitespace, and "pop" colors to differentiate study modules and track progress dynamically.

## Colors
The palette is built on a foundation of stark blacks and pure whites, punctuated by high-saturation pastels that function as functional "zones." 

- **Primary Black (#000000):** Used for critical boundaries, primary text, and high-emphasis buttons to ground the floating pastel elements.
- **Secondary Mint (#A3E6D6):** Reserved for core syllabus and progress-related modules.
- **Tertiary Pink (#FFB5D3):** Used for AI-driven features and creative session triggers.
- **Surface Neutrals:** Backgrounds remain light (#F9F9F9) to allow the card containers to stand out with depth and clarity.

## Typography
The system employs a dual-font strategy to balance technical precision with literary authority. 

- **Space Grotesk** is the hero face, used for headlines and all-caps labels. Its geometric, slightly quirky characters reinforce the "science and tech" nature of the product.
- **Inter** provides a neutral, highly readable canvas for body copy and long-form descriptions.
- **Newsreader** is utilized as a specialized "display serif" for pedagogical content or critical questions, adding a sense of academic gravitas to the otherwise modern interface.

## Layout & Spacing
The layout follows a **structured Bento-grid** approach. On desktop, a persistent navigation drawer provides a solid anchor, while the main content flows into a centered, maximum-width container. 

The vertical rhythm is driven by wide section margins (48px) to prevent the high-contrast elements from feeling cluttered. On mobile, the system transitions to a bottom-heavy interaction model with a floating search/input bar and a prominent navigation rail, ensuring all core study actions remain within thumb reach.

## Elevation & Depth
Depth in this system is achieved through **Tonal Stacking** and **Subtle Micro-Shadows**. 

- **Level 0 (Background):** Flat, neutral grey-whites.
- **Level 1 (Cards):** Use very soft, diffused shadows (`0 8px 30px rgba(0,0,0,0.04)`) to separate them from the background without creating harsh edges.
- **Interactive Depth:** Cards feature a hover state that involves a slight Y-axis lift and a slightly deeper shadow, simulating physical movement.
- **Glassmorphism:** Navigation bars and specific icon backdrops utilize backdrop blur (12px-16px) with semi-transparent white fills (white/30) to maintain context while overlaying content.

## Shapes
The shape language is consistently oversized and "chunky." 

- **Containers:** Standard cards use a 1rem (16px) radius, while larger structural components like the navigation drawer use a 2rem (32px) radius on leading edges.
- **Interactive Elements:** Buttons and tags are strictly **Pill-Shaped**, creating a distinct "capsule" look that contrasts with the rectangular nature of the bento grid. 
- **Icons:** Enclosed in circular or rounded-square containers to reinforce the friendly, approachable geometry.

## Components

### Buttons
- **Primary:** High-contrast black background with white text, all-caps, pill-shaped.
- **Secondary/Outlined:** White background with a 2px solid `outline-subtle` border.
- **Ghost/Icon:** No background, utilizing a circular blur-glass effect when placed over colored cards.

### Cards
- **Bento Cards:** Feature a consistent internal padding (24px). Headings are placed at the top left, with primary actions anchored to the bottom.
- **Activity Rows:** Flat list items with hover-active states (background color shifts) and trailing chevron icons.

### Inputs
- **Search Bar:** Fully pill-shaped with a 2px primary border. It uses a leading icon and a trailing "action" circle button.

### Progress Bars
- **Integrated:** Specifically designed to sit within card containers, utilizing a high-contrast track (white/40) and a primary-colored fill to show completion.

### Navigation
- **Top Bar (Web):** Bordered, slim, with tight tracking on the logo.
- **Bottom Bar (Mobile):** High-density, backdrop-blurred, with active states indicated by a "filled" pill around the icon/label combination.