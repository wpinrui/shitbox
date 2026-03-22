# Shitbox — Brand & Design Guide

Reference for all implementers. Styling in React/Electron should use CSS custom properties defined in a single `tokens.css` file, with reusable component classes. Mockups in `design/` are the visual source of truth.

---

## 1. Design Principles

1. **The photo is the star.** Full-bleed location photos fill the viewport. UI floats on top as frosted glass. The photo is never blurred or darkened globally — only the glass panels frost what's behind them via `backdrop-filter`.
2. **One panel, not many.** Each screen uses a single glass panel (Tier 1) inset from screen edges. No multi-panel layouts.
3. **Black glass, white text.** The glass is black-based (`rgba(0,0,0,...)`), not blue. The primary text colour is white. There is no gold, no yellow.
4. **Turquoise is a fill, never a border.** The accent colour (`#2DD4BF`) is used sparingly as a background fill for emphasis elements (badges, current-location highlight). Never on borders, glows, or outlines.
5. **Grey is for de-emphasis only.** Grey text (`--text-2`, `--text-3`) is only used to reduce clutter when other text nearby needs to stand out. Standalone labels (region headers, section labels) are white.
6. **No monospace fonts.** The sans-serif system font stack is used everywhere, including numeric values.
7. **Proper casing.** Only section labels like "STATS" and "INVENTORY" use uppercase. Everything else (location names, activity names, button labels, player name) uses title/sentence case.
8. **Minimum 12px text.** No text in the UI may be smaller than `0.75rem` (12px at default browser font size).

---

## 2. CSS Custom Properties

All values below must be defined in `src/tokens.css` and referenced via `var(--token-name)` throughout the codebase. No hardcoded colour/spacing values in component CSS.

### 2.1 Glass Tiers

Three tiers create depth. Tier 1 is the outermost container, Tier 3 is the innermost detail.

| Token | Value | Usage |
|---|---|---|
| `--glass-1-bg` | `rgba(0, 0, 0, 0.78)` | Main panel, modals |
| `--glass-1-blur` | `16px` | `backdrop-filter: blur()` on Tier 1 panels |
| `--glass-1-border` | `1px solid rgba(255, 255, 255, 0.08)` | Tier 1 border |
| `--glass-1-radius` | `16px` | Tier 1 corners |
| `--glass-1-shadow` | `0 8px 32px rgba(0, 0, 0, 0.4)` | Tier 1 shadow |
| `--glass-2-bg` | `rgba(255, 255, 255, 0.06)` | Activity cards, location cards, player sub-card |
| `--glass-2-border` | `1px solid rgba(255, 255, 255, 0.10)` | Tier 2 border |
| `--glass-2-radius` | `12px` | Tier 2 corners |
| `--glass-2-shadow` | `0 4px 16px rgba(0, 0, 0, 0.25)` | Tier 2 shadow |
| `--glass-3-bg` | `rgba(255, 255, 255, 0.04)` | Stat rows, result rows, detail elements |
| `--glass-3-border` | `1px solid rgba(255, 255, 255, 0.06)` | Tier 3 border |
| `--glass-3-radius` | `8px` | Tier 3 corners |

### 2.2 Colours

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#2DD4BF` | Turquoise — fill only (badges, current-location card bg) |
| `--earn` | `#4ADE80` | Green — money earned, energy recovered, positive stat gains |
| `--spend` | `#F87171` | Red — money spent, energy spent, negative outcomes |
| `--energy-color` | `#FBBF24` | Amber — energy icon, energy bar gradient end |
| `--danger` | `#EF4444` | Destructive actions (Quit button) |

### 2.3 Text

| Token | Value | Usage |
|---|---|---|
| `--text-1` | `#F5F5F5` | Primary text, headings, values, standalone labels |
| `--text-2` | `rgba(245, 245, 245, 0.7)` | Descriptions, secondary info, de-emphasised text next to primary |
| `--text-3` | `rgba(245, 245, 245, 0.45)` | Tertiary labels (e.g., "Day" label), tags, travel info |

### 2.4 Surfaces

| Token | Value | Usage |
|---|---|---|
| `--divider` | `rgba(255, 255, 255, 0.08)` | Horizontal dividers, section separators |
| `--shadow-text` | `0 1px 3px rgba(0, 0, 0, 0.5)` | Applied to all text for legibility on translucent backgrounds |

### 2.5 Font

| Token | Value |
|---|---|
| `--font-sans` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |

This is the only font stack. No monospace.

---

## 3. Typography Scale

All sizes are in `rem`. Minimum is `0.75rem` (12px).

| Role | Size | Weight | Colour | Usage |
|---|---|---|---|---|
| Page title | `1.5rem` | 700 | `--text-1` | Location name in header, modal titles |
| Card title | `1rem` – `1.1rem` | 600 | `--text-1` | Activity card names, player name |
| Body | `0.9rem` | 400 | `--text-2` | Descriptions, location subtitles |
| Detail | `0.85rem` | 400–600 | `--text-1` or `--text-2` | Cost rows, stat values, result values |
| Label | `0.75rem` | 400–600 | `--text-3` (inline) or `--text-1` (standalone) | "STATS", "INVENTORY", "Day", region headers |
| Resource values | `1rem` | 600 | `--text-1` | Day counter, clock, money in header |

### Text rules

- `text-shadow: var(--shadow-text)` on all text rendered on translucent backgrounds.
- `text-transform: uppercase` + `letter-spacing: 0.15em` only on section labels ("STATS", "INVENTORY", region names).
- Everything else uses default casing.

---

## 4. Layout

### 4.1 Screen Structure

Every game screen follows the same structure:

```
┌─ Viewport (100vw × 100vh, background: #000) ──────────────┐
│  Background photo (position: fixed, object-fit: cover)      │
│  Vignette overlay                                           │
│                                                             │
│  ┌─ Shell (padding: 5vh 5vw) ───────────────────────────┐  │
│  │  ┌─ Panel (Tier 1 glass, flex: 1) ────────────────┐  │  │
│  │  │  Header row (border-bottom divider)             │  │  │
│  │  │  Body (flex row: player card + content area)    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- The background photo is **not** blurred or darkened. Only `backdrop-filter` on glass panels creates the frosting effect.
- A vignette (`radial-gradient`) is applied over the photo.
- The shell provides `5vh` / `5vw` inset so the photo is visible around the panel edges.

### 4.2 Header

Consistent across all screens:
- Left: title + subtitle (or Back button + title on map)
- Right: Day counter, clock, money, energy bar
- Height: auto (content-driven, `padding: 14px 24px`)
- Dividers (`1px × 24px`) separate resource groups

### 4.3 Body

- `display: flex; gap: 20px`
- Player sub-card on the left (240px fixed width, stretches to full height)
- Content area fills remaining space

### 4.4 Player Sub-Card

A Tier 2 glass card, always present on the left side of the body. Contains:
1. Player name
2. Divider
3. "STATS" label + 5 stat rows (Tier 3)
4. Divider
5. "INVENTORY" label + inventory rows (Tier 3)
6. Menu button (pushed to bottom via `margin-top: auto`)

### 4.5 Content Area

Screen-specific content fills this area:
- **Location screen:** Activity cards in a responsive grid (`repeat(auto-fill, minmax(260px, 1fr))`), followed by a divider, then universal action cards (Nap, Sleep, Leave).
- **Map screen:** Location cards in a responsive grid (`repeat(auto-fill, minmax(390px, 1fr))`), grouped by region (North, West, East, South) with white uppercase region labels.

---

## 5. Interactive States

### 5.1 Cards (Tier 2)

| State | Background | Border | Shadow | Transform |
|---|---|---|---|---|
| Default | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.10)` | `0 4px 16px rgba(0,0,0,0.25)` | none |
| Hover | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.20)` | `0 4px 20px rgba(0,0,0,0.3)` | `translateY(-1px)` |
| Active | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.30)` | — | `translateY(0) scale(0.99)` |

Transition: `all 0.2s ease` (default), `all 0.1s ease` (active).

### 5.2 Rows (Tier 3)

Hover only: background shifts from `rgba(255,255,255,0.04)` to `rgba(255,255,255,0.08)`. No transform.

### 5.3 Current Location (Map)

The card for the player's current location:
- Background: `rgba(45, 212, 191, 0.25)` (turquoise fill)
- No hover effect, `cursor: default`
- "You are here" badge (see §6.2)

---

## 6. Components

### 6.1 Buttons

**Primary (default action):**

| Property | Value |
|---|---|
| Background | `rgba(255, 255, 255, 0.10)` |
| Border | `1px solid rgba(255, 255, 255, 0.20)` |
| Colour | `--text-1` |
| Border-radius | `8px` |
| Padding | `10px 20px` (sidebar) or `12px 20px` (modal) |
| Hover bg | `rgba(255, 255, 255, 0.16)` |
| Hover border | `rgba(255, 255, 255, 0.25)` |

**Secondary (ghost):**

| Property | Value |
|---|---|
| Background | `transparent` |
| Border | `1px solid rgba(255, 255, 255, 0.12)` |
| Colour | `--text-2` |
| Hover bg | `rgba(255, 255, 255, 0.06)` |
| Hover colour | `--text-1` |

**Danger:**

| Property | Value |
|---|---|
| Background | `rgba(239, 68, 68, 0.12)` |
| Border | `1px solid rgba(239, 68, 68, 0.3)` |
| Colour | `#F87171` |
| Hover bg | `rgba(239, 68, 68, 0.22)` |
| Hover border | `rgba(239, 68, 68, 0.5)` |
| Hover colour | `#FCA5A5` |

**Nav (small, inline):**

| Property | Value |
|---|---|
| Background | `rgba(255, 255, 255, 0.08)` |
| Border | `1px solid rgba(255, 255, 255, 0.15)` |
| Padding | `6px 14px` |
| Font-size | `0.85rem` |

All buttons: `border-radius: 8px`, `transition: all 0.2s ease`, active `transform: scale(0.98)`.

### 6.2 Badge

Used for "You are here" indicator on the map.

| Property | Value |
|---|---|
| Background | `var(--accent)` (solid turquoise fill) |
| Colour | `#fff` |
| Font-size | `0.75rem` |
| Font-weight | 600 |
| Padding | `2px 6px` |
| Border-radius | `4px` |
| Position | Absolute, top-right of card |

### 6.3 Energy Bar

| Element | Properties |
|---|---|
| Track | `120px × 8px`, `rgba(255,255,255,0.12)` bg, `1px solid rgba(255,255,255,0.15)` border, `4px` radius |
| Fill | `linear-gradient(90deg, var(--earn), var(--energy-color))`, `4px` radius |
| Icon | `⚡`, `var(--energy-color)`, `0.9rem` |
| Value text | `0.8rem`, `--text-2` |

### 6.4 Location Card (Map)

Tier 2 glass card with:
1. Photo strip (100px height, `object-fit: cover`, gradient overlay fading to dark at bottom)
2. Body: name (`1rem`, 600), description (`0.85rem`, `--text-2`), tags, travel info
3. Tags: `0.75rem`, `--text-3`, `rgba(255,255,255,0.06)` bg, `3px` radius
4. Travel: `0.75rem`, `--text-3`, showing distance + walk time/energy + drive time

### 6.5 Activity Card (Location Screen)

Tier 2 glass card with `20px` padding:
1. Name (`1rem`, 600)
2. Description (`0.9rem`, `--text-2`)
3. Divider
4. Cost rows: icon + label, each `0.85rem`. Time icon uses `--text-2`, energy icon uses `--energy-color`, money icon uses `--earn` or `--spend`

---

## 7. Modals

All modals share the same structure:

- **Backdrop:** `rgba(0,0,0,0.6)`, `backdrop-filter: blur(2px)`
- **Panel:** Tier 1 glass, `border-radius: 16px`, centred, `padding: 32px`
- **Game screen behind:** dimmed to `opacity: 0.3`, `pointer-events: none`

### 7.1 Pause Modal

- Width: `360px`
- Title: "Paused", `1.5rem`, 700, centred
- Buttons stacked vertically with `16px` gap: Resume (primary), Save Game (secondary), Load Game (secondary), divider, Quit to Menu (danger)

### 7.2 Activity Progress/Outcome Modal

- Width: `420px`
- **Phase 1 (progress):** Title, description, white progress bar (6px track), pulsing time label. Fades out after bar fills (~2.5s).
- **Phase 2 (outcome):** Title + subtitle slide up. Divider fades in. Result rows slide up with staggered 0.2s delay. Each result row is a Tier 3 element with icon + label + coloured value. "Close" button slides up last.

---

## 8. Backgrounds

### 8.1 Photo Treatment

- Full-bleed, `position: fixed`, `object-fit: cover`
- No blur, no darken overlay
- Vignette: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)`
- Frosting happens only through glass panels' `backdrop-filter`

### 8.2 Location Photos

All stored in `src/assets/backgrounds/`. One per location plus hero, map, and gameover:

| File | Location |
|---|---|
| `scrapyard.jpg` | Scrapyard |
| `school.jpg` | Driving School |
| `bank.jpg` | Bank |
| `gas_station.jpg` | Gas Station |
| `auction.jpg` | Auction House |
| `showroom.jpg` | Showroom |
| `garage.jpg` | Garage |
| `workshop.jpg` | Workshop |
| `car_wash.jpg` | Car Wash |
| `apartments.jpg` | Apartments (mid-tier) |
| `budget_house.jpg` | Budget Housing |
| `penthouse.jpg` | Penthouse |
| `parking_lot.jpg` | Parking Lot |
| `gym.jpg` | Gym |
| `film_school.jpg` | Film School |
| `hero.jpg` | Main menu |
| `map.jpg` | Map screen |
| `gameover.jpg` | Game over screen |

---

## 9. Implementation Notes for React/Electron

### 9.1 Token System

All design tokens in `src/tokens.css` as CSS custom properties on `:root`. Components reference these via `var()`. No hardcoded values.

### 9.2 Reusable Component Classes

Build shared CSS classes or styled components for:
- `.glass-1`, `.glass-2`, `.glass-3` — the three panel tiers
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-nav` — button variants
- `.row-3` — Tier 3 info row (stats, inventory, results)
- `.divider` — horizontal separator
- `.badge` — turquoise emphasis badge

### 9.3 Layout Components

- `<GamePanel>` — the single Tier 1 glass container used on every screen
- `<Header>` — location title + resources bar
- `<PlayerCard>` — the left sidebar sub-card
- `<Modal>` — backdrop + centred Tier 1 glass dialog

### 9.4 Animations

- Modal entry: `scale(0.95) translateY(10px)` → normal, `0.3s ease-out`
- Card hover: `translateY(-1px)`, `0.2s ease`
- Card active: `scale(0.99)`, `0.1s ease`
- Result row slide-in: `translateY(12px) opacity(0)` → normal, `0.4s ease-out`, staggered `0.2s`
- Progress bar: `width: 0%` → `100%`, `2.2s ease-in-out`

---

## 10. Mockup Reference

All mockups are in `design/` as self-contained HTML files:

| File | Screen |
|---|---|
| `mockup-1-scrapyard.html` | Location screen (Scrapyard) |
| `mockup-2-map.html` | Map screen |
| `mockup-3-pause.html` | Pause menu overlay |
| `mockup-4-activity.html` | Activity progress + outcome modal |

Open in a browser to see the exact intended look. These are the visual source of truth for implementation.
