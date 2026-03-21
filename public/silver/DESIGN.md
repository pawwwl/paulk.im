```markdown
# Design System Document

## 1. Overview & Creative North Star: "The Architect’s Terminal"
This design system is built for the intersection of raw computational logic and high-end editorial sophistication. The North Star for this system is **"The Architect’s Terminal"**—a visual language that treats code not just as a tool, but as a prestigious medium of art. 

We move away from the "template" look of standard SaaS platforms by embracing **Absolute Geometry**. By utilizing a strict 0px border-radius across all components, we create a silhouette that feels intentional, architectural, and unapologetically tech-forward. The experience is defined by high-contrast voids, monospaced precision, and a "code-as-art" philosophy where data is displayed with the same reverence as a gallery headline.

---

## 2. Colors & Tonal Depth
The palette is rooted in a "Deep Charcoal" environment, punctuated by "Electric Blue" and "Syntax Highlighting" accents. It mimics the developer’s native environment but elevates it through professional layering.

### Surface Hierarchy & Nesting
To achieve a premium feel, we abandon traditional dividers. Structure is created through **Tonal Layering**.
*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background shifts. For example, a main content area using `surface` might contain a sidebar using `surface-container-low`.
*   **Layering Logic:** Treat the UI as stacked sheets of material. Use `surface-container-lowest` (#0e0e0e) for the base background, and `surface-container` (#201f1f) for interactive zones. This creates depth without visual clutter.
*   **The "Glass & Gradient" Rule:** To provide "soul" to the minimalism, floating elements (like modals or dropdowns) should use a backdrop-blur (12px-20px) combined with a semi-transparent `surface-bright` color. Use a subtle linear gradient from `primary` (#c3f5ff) to `primary_container` (#00e5ff) for high-impact CTAs to create a "glow" effect that feels alive.

---

## 3. Typography
The typography strategy creates a tension between the humanistic geometry of Space Grotesk and the rigid, functional beauty of monospaced data.

*   **Display & Headlines (Space Grotesk):** Use for all major headers. The wide apertures and geometric shapes feel modern and professional.
*   **Data & Accents (JetBrains Mono/Roboto Mono):** Used for labels, small metadata, and "code-as-art" elements. This is the "quirky" soul of the system.
*   **Body (Inter):** Used for long-form reading to ensure high legibility against the dark background.

**Editorial Scaling:** Use dramatic scale shifts. A `display-lg` headline should often sit next to a tiny `label-sm` monospaced timestamp to create an asymmetric, high-end layout.

---

## 4. Elevation & Depth
In this design system, elevation is a matter of light and tone, not physical shadows.

*   **The Layering Principle:** Depth is achieved by stacking surface tiers. Place a `surface-container-highest` card on a `surface-container-low` section to create a natural "lift."
*   **Ambient Shadows:** If a floating element requires a shadow, it must be massive and faint. Use a blur of 40px-60px with 4-6% opacity using a tint of the `primary` color rather than black.
*   **The Ghost Border:** If a boundary is required for accessibility, use the `outline_variant` (#3b494c) at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#c3f5ff) background, `on_primary` (#00363d) text. 0px radius.
*   **Secondary:** Ghost style. No background, `primary` text, and a `primary` "Ghost Border" (20% opacity).
*   **Interaction:** On hover, primary buttons should "glow" by adding a subtle outer shadow of the same color.

### Input Fields
*   **Structure:** No bottom line or full border. Use a `surface-container-high` background with a 0px radius.
*   **Labels:** Always use `label-md` in monospaced font. Place them above the input, left-aligned, often with a "prefix" like `01_` or `>` to lean into the terminal aesthetic.

### Cards & Lists
*   **No Dividers:** Separate list items with `spacing-4` or `spacing-5` and a subtle shift to `surface-container-low` on hover.
*   **Code-as-Art:** Cards should feature a monospaced "serial number" or "status code" in the top right corner using `secondary` (#5dff3b) for a playful, tech-forward touch.

### Chips
*   **Selection:** Use `surface-variant` with monospaced text. When selected, switch to `secondary` (#5dff3b) with `on_secondary` (#063900) text.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Align text to the left but leave large, "wasted" voids on the right to create an editorial feel.
*   **Use Monospaced Accents:** Sprinkle small monospaced data points (coordinates, hex codes, timestamps) near headers to reinforce the "Terminal" identity.
*   **Rigid Grids:** Use a 12-column grid but break it intentionally with elements that span 5 or 7 columns to avoid a "bootstrap" look.

### Don't:
*   **No Rounded Corners:** Never use a border-radius. Every element must have sharp 90-degree angles.
*   **No Standard Shadows:** Avoid heavy, dark drop-shadows that make elements look like they are "pasted" on.
*   **No Border Lines:** Do not use 1px lines to separate content sections; use the spacing scale and background tonal shifts instead.
*   **Avoid Pure White:** Never use #FFFFFF for text. Use `on_surface` (#e5e2e1) to reduce eye strain and maintain the premium dark aesthetic.

---

## 7. Signature Element: The "Command Cursor"
As a signature interaction, any active state or focused input should feature a blinking block cursor (mimicking a terminal). This small, quirky detail bridges the gap between a professional tool and a playful brand personality.```