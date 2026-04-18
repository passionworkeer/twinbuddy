# Design System Strategy: The Introspective Horizon

## 1. Overview & Creative North Star
This design system is built for the "Traveler"—not just one who moves through physical space, but one who navigates the internal landscape of the psyche. Our Creative North Star is **"The Introspective Horizon."** 

To move beyond the "template" look of standard survey tools, this system embraces high-end editorial aesthetics. We reject the rigid, centered layout in favor of intentional asymmetry. By leveraging extreme typographic scales, overlapping glass layers, and a stark monochromatic core contrasted against atmospheric neutrals, we create an experience that feels cinematic, premium, and starkly modern.

## 2. Colors: Tonal Depth & High-Contrast Minimalism
The color philosophy has shifted from muted earth tones to a high-contrast, "Black & White" editorial foundation supported by deep obsidian neutrals.

*   **The "No-Line" Rule:** Sectioning must never be achieved with 1px solid lines. Instead, use background transitions. A section using `surface-container-low` sitting on the base `background` (#1A1D1E) creates a sophisticated boundary.
*   **Monochromatic Impact:** 
    *   **Primary:** `primary` (#ffffff) is used for maximum clarity and impact on interactive elements.
    *   **Secondary:** `secondary` (#000000) provides the deep anchor for secondary actions or high-contrast reversals.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical panes. 
    *   **Base:** `neutral` (#1A1D1E).
    *   **Cards:** `surface-container-high` with 60% opacity for glass effects.
*   **Signature Textures:** Use a subtle linear gradient on primary CTAs, transitioning from white to a soft silver-grey. This provides a "soul" that flat hex codes lack.

## 3. Typography: Editorial Authority
We utilize two distinct typefaces to create a dialogue between the "Grand Scale" of travel and the "Detail" of a survey.

*   **Display & Headlines (Epilogue):** These are your landmarks. Use `display-lg` for personality results and `headline-lg` for survey questions. The bold, wide stance of Epilogue in white (#ffffff) provides an authoritative, high-fashion editorial feel.
*   **Body & Labels (Manrope):** These are your guides. Manrope offers exceptional legibility at small scales. Use `body-md` for question descriptions. 
*   **Visual Hierarchy:** Establish "Depth of Field" by using pure white for primary text and tertiary-derived greys (#8CA0B0) for secondary text to create a natural focus.

## 4. Elevation & Depth: The Layering Principle
We move away from traditional Material shadows in favor of "Atmospheric Perspective."

*   **Tonal Stacking:** Depth is achieved by placing lighter containers on darker backgrounds. 
*   **The "Ghost Border":** Use an "ultra-thin" border. This is defined as a 0.5px or 1px border using `outline-variant` at 15% opacity. This creates a "glint" on the edge of the glass without boxing in the content.
*   **Glassmorphism:** All survey cards should utilize surface variants at 40% alpha with a `backdrop-filter: blur(12px)`. This integrates the UI into the "Traveler" background image, making the interface feel like a HUD (Heads-Up Display) for a journey.

## 5. Components

### Glassmorphism Cards
*   **Style:** Translucent surface at 40% opacity, 12px blur, 1px Ghost Border.
*   **Radius:** Moderate (`roundedness: 2`)—balanced corners that feel architectural rather than organic or sharp.
*   **Spacing:** `spacing: 2` (Normal). Content follows a standard rhythm that balances density with breathing room, moving away from the previous spacious/editorial extreme for better functional flow.

### Primary Action Buttons
*   **Color:** `primary` (#ffffff) with `on-primary` (dark) text.
*   **Shape:** Moderate rounding (`roundedness: 2`) to match the system-wide architectural feel.
*   **Interaction:** On hover/tap, transition to a subtle tertiary glow (#8CA0B0).

### Selection Chips (MBTI Options)
*   **Unselected:** `surface-container-high` with 10% `outline`.
*   **Selected:** `primary` (#ffffff) fill with `secondary` (#000000) text for maximum visibility of the chosen path.

### Progress Indicator
*   **Style:** A horizontal track using `surface-container-lowest`. The active fill should be a gradient of white to `tertiary` (#8CA0B0), representing the "horizon line."

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical white space. Allow the background imagery to breathe through the 4th column of your grid.
*   **Do** maintain the "Compact to Normal" density (`spacing: 2`) to ensure survey questions remain grouped and legible.
*   **Do** apply `backdrop-blur` to any element that sits over a background image to maintain legibility.

### Don't:
*   **Don't** use 100% opaque borders. It breaks the "Ghost Glass" illusion.
*   **Don't** use "Spacious" (Level 3) padding anymore; stick to the "Normal" (Level 2) scale for a more grounded, functional interface.
*   **Don't** use standard "Drop Shadows." Use tonal shifts and ghost borders instead.
*   **Don't** use dividers. Use the Spacing Scale to separate questions.