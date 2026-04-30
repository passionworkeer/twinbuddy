# Design System Document: The Global Nomad Framework

## 1. Overview & Creative North Star
**Creative North Star: "The Ethereal Monolith"**

This design system evolves the "Vivid Monolith" into a high-key, minimalist editorial experience. We treat the UI as an "Ethereal Monolith"—a stark, light-drenched structural framework that prioritizes clarity and subtle tonal shifts over heavy chromatic backgrounds.

The aesthetic is driven by **Modernist Brutalism**: we use bold, oversized typography and rigid structural logic, but soften it through maximum roundedness (`pill` contours), high-contrast layering, and the piercing clarity of electric blue accents. By moving to a more balanced spacing model, we create a digital companion that feels efficient, premium, and architecturally sound.

---

## 2. Colors: The High-Key Palette
Our palette is a dialogue between a stark, light-filled foundation and high-performance technical accents.

### The Foundation (Neutrals)
*   **Surface & Background (`#f7f7f7`):** Our "Primary Mist." A clean, near-white grey that serves as the dominant surface color, creating a seamless, "liquid" interface feel.
*   **On-Surface / Neutral (`#1A1A1A`):** Our "Carbon." A deep, near-black used for grounding the UI and ensuring razor-sharp legibility.
*   **Secondary (`#212121`):** A supporting dark tone for high-contrast UI elements, chips, and secondary actions.

### The Accents (The Electric)
*   **Tertiary (`#0097ff`):** An "Electric Azure." Use this for "Social" features, interactive highlights, and status indicators to provide a punch of digital energy against the neutral base.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Use "Tonal Transitions" instead.
*   To separate a profile header from a feed, transition from the primary light surface to a slightly deeper neutral container.
*   Boundaries are felt through shifts in depth and typography, not drawn with lines.

### Signature Textures & Glass
To maintain the "Ethereal" feel, use a subtle **linear gradient** on interactive elements: from `primary` (#f7f7f7) to a slightly cooler white. This keeps buttons feeling tactile and "elevated" without introducing unnecessary color.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface system to balance authority with approachability.

*   **Display & Headlines (Plus Jakarta Sans):** Our "Voice." This geometric sans-serif is used in large scales (`display-lg` to `headline-sm`) with tight letter-spacing (-2%). Use `headline-lg` for destination names to make them feel like professional travel journals.
*   **Body & Labels (Manrope):** Our "Function." Manrope provides exceptional legibility. Use `body-lg` for traveler stories and `label-sm` for technical metadata.

**Typographic Intent:** Prioritize clarity. With the move to balanced spacing (level 2), typography must be perfectly aligned to maintain the system's "premium" feel.

---

## 4. Elevation & Depth: Tonal Stacking
We do not use shadows to represent physical height; we use **Tonal Stacking**.

*   **The Layering Principle:** 
    1.  Base Level: `neutral` (#1A1A1A) for background elements.
    2.  Section Level: `primary` (#f7f7f7) for content containers.
    3.  Interactive Level: `secondary` (#212121) for high-contrast action points.

*   **Ambient Shadows:** If a floating action button (FAB) or a "Q-version" avatar requires a shadow, it must be `neutral_color_hex` at 5% opacity with a `32px` blur. It should look like a soft atmospheric glow.
*   **Glassmorphism:** For navigation bars, use `primary` at 85% opacity with a `20px` backdrop-blur to allow vivid travel photography to bleed into the frame.

---

## 5. Components: Modern Primitives

### Q-Version Avatar Containers
Digital humans use a **rounded-full** pill shape. Overlap the avatar slightly over the edge of its container to break the grid and add personality.

### Buttons
*   **Primary:** `rounded-full`, `primary` background (#f7f7f7), `secondary` (#212121) text.
*   **Secondary:** `rounded-full`, `secondary` background (#212121), `primary` text.
*   **Tertiary (Accent):** `rounded-full`, `tertiary` (#0097ff) background, white text.

### Cards & Lists
*   **The "No-Divider" Rule:** Lists must not use horizontal lines. Use 12px of vertical spacing (Standard spacing level 2) to distinguish items.
*   **Travel Cards:** Use a "High-Contrast" style. 100% width imagery with `primary` (#f7f7f7) typography overlays.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use maximum roundedness (pill shapes) for all buttons and image containers to contrast with the rigid typography.
*   **Do** embrace the light-grey-on-dark-grey aesthetic for a sophisticated, technical travel look.
*   **Do** use `tertiary` (#0097ff) sparingly to draw the eye to critical user path conversions.

### Don't:
*   **Don't** use standard "vibrant" colors for the primary surface. Stick to the Alabaster/Mist (#f7f7f7) foundation.
*   **Don't** use 100% black (#000000). Use the `neutral` (#1A1A1A) or `secondary` (#212121) tokens to maintain the high-end editorial look.
*   **Don't** use excessive whitespace. Stick to the level 2 spacing to ensure the "Monolith" feels solid and compact.