# TwinBuddy v3 — Neon Pulse Frontend Design Specification

> Version: 1.0.0
> Date: 2026-04-17
> Theme: Neon Pulse (Dark Neon Aesthetic)
> Framework: React + Vite + TypeScript + Tailwind CSS

---

## 1. Color System

### M3 Color Tokens

All colors follow Material 3 design system principles, adapted for Neon Pulse dark theme.

```css
/* === Background Layer === */
--color-bg-base:       #11131e;  /* Deep navy — page background */
--color-bg-surface:     #1a1b2e;  /* Card/panel background */
--color-bg-elevated:   #22243a;  /* Elevated elements, modals */
--color-bg-overlay:    rgba(17, 19, 30, 0.85); /* Overlay backdrop */

/* === Primary — Neon Pink === */
--color-primary:        #ffb3b6;  /* Main brand color */
--color-primary-light: #ffd4d7;  /* Hover / light variant */
--color-primary-dark:  #e8888e;  /* Pressed / dark variant */
--color-primary-glow:  rgba(255, 179, 182, 0.35); /* Neon glow shadow */

/* === Secondary — Neon Cyan === */
--color-secondary:     #affffb;  /* Secondary actions, highlights */
--color-secondary-light:#d4fffc;
--color-secondary-dark:#7eeee7;
--color-secondary-glow: rgba(175, 255, 251, 0.35);

/* === Tertiary — Neon Gold === */
--color-tertiary:       #eec224;  /* Accent, warnings, special states */
--color-tertiary-light: #f5d04a;
--color-tertiary-dark:  #c9a01e;

/* === Semantic === */
--color-success:        #4ade80;
--color-error:          #f87171;
--color-warning:        #fbbf24;
--color-info:           #60a5fa;

/* === Text === */
--color-text-primary:  #f0f0f5;  /* Primary text */
--color-text-secondary:#a0a0b8;  /* Secondary / muted text */
--color-text-disabled:  #5a5a70;  /* Disabled text */
--color-text-inverse:  #11131e;  /* Text on bright backgrounds */

/* === Border === */
--color-border:         rgba(255, 255, 255, 0.08);
--color-border-subtle:  rgba(255, 255, 255, 0.04);
--color-border-glow:    rgba(255, 179, 182, 0.5); /* Neon border glow */

/* === Glass Panel === */
--color-glass-bg:       rgba(26, 27, 46, 0.6);
--color-glass-border:   rgba(255, 255, 255, 0.1);
--color-glass-blur:     blur(20px) saturate(180%);
```

### Tailwind Extended Colors (tailwind.config.js)

```js
// Register custom colors as Tailwind extended palette
colors: {
  neon: {
    bg:        '#11131e',
    surface:   '#1a1b2e',
    elevated:  '#22243a',
    primary:   '#ffb3b6',
    'primary-light': '#ffd4d7',
    'primary-dark':  '#e8888e',
    secondary: '#affffb',
    'secondary-light': '#d4fffc',
    tertiary:  '#eec224',
    'tertiary-light': '#f5d04a',
    text:      '#f0f0f5',
    'text-secondary': '#a0a0b8',
    'text-disabled':  '#5a5a70',
    border:    'rgba(255,255,255,0.08)',
    'border-subtle': 'rgba(255,255,255,0.04)',
  }
}
```

### Glow / Neon Shadow Tokens

```css
--glow-primary:   0 0 20px rgba(255, 179, 182, 0.4), 0 0 40px rgba(255, 179, 182, 0.15);
--glow-secondary: 0 0 20px rgba(175, 255, 251, 0.4), 0 0 40px rgba(175, 255, 251, 0.15);
--glow-tertiary:  0 0 20px rgba(238, 194, 36, 0.4),  0 0 40px rgba(238, 194, 36, 0.15);
--glow-card:      0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
```

---

## 2. Typography

### Font Family

```css
/* Primary: Inter — clean, modern, legible */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Accent headings: Orbitron (optional, for logo/brand moments only) */
font-family: 'Orbitron', 'Inter', sans-serif;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-7xl` | 4.5rem / 72px | 800 (ExtraBold) | 1.0 | Hero headlines |
| `text-5xl` | 3rem / 48px | 700 (Bold) | 1.1 | Page titles |
| `text-3xl` | 1.875rem / 30px | 700 (Bold) | 1.2 | Section headers |
| `text-2xl` | 1.5rem / 24px | 600 (Semibold) | 1.3 | Card titles |
| `text-xl`  | 1.25rem / 20px | 600 (Semibold) | 1.4 | Sub-headings |
| `text-lg`  | 1.125rem / 18px | 500 (Medium) | 1.5 | Body text |
| `text-base`| 1rem / 16px | 400 (Regular) | 1.6 | Default body |
| `text-sm`  | 0.875rem / 14px | 400 (Regular) | 1.5 | Secondary text |
| `text-xs`  | 0.75rem / 12px | 400 (Regular) | 1.4 | Captions, labels |
| `text-[10px]`| 0.625rem / 10px | 500 (Medium) | 1.3 | Micro labels |

### Letter Spacing

```css
--tracking-tight:  -0.02em;  /* Large headings */
--tracking-normal:  0em;     /* Body */
--tracking-wide:    0.05em;  /* Labels, badges */
--tracking-widest:  0.1em;   /* MBTI badges, ALL CAPS labels */
```

---

## 3. Component Naming Conventions

### File Naming

```
PascalCase for components:  OnboardingPage.tsx, TwinCard.tsx, RadarChart.tsx
camelCase for hooks:         useLocalStorage.ts, useOnboardingForm.ts
kebab-case for utilities:   mock-data.ts, api-client.ts
```

### Component Structure Pattern

```tsx
// File: components/XxxComponent.tsx
//
// 1. Import dependencies
// 2. Type definitions (Props, internal types)
// 3. Helper functions / constants (small, no external deps)
// 4. Sub-components (if any, defined above main component)
// 5. Main component
// 6. Styled variants (if exported)
// 7. Default export

import { useState } from 'react';
import type { XxxProps } from '../types/persona';

// ── Helper ────────────────────────────────────────────────

function formatLabel(value: number) { return `${value}%`; }

// ── Sub-component ──────────────────────────────────────────

function XxxBadge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

// ── Main component ─────────────────────────────────────────

export function XxxComponent({ name, score, onAction }: XxxProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel">
      {/* ... */}
    </div>
  );
}
```

---

## 4. Component Library

### 4.1 Glass Panel (Base)

**Class:** `.glass-panel`
**Implementation:**
```css
.glass-panel {
  background: rgba(26, 27, 46, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem; /* 24px */
}
```

**Usage:**
```tsx
<div className="glass-panel p-5">
```

### 4.2 Neon Border (Ghost Border)

**Class:** `.ghost-border`
**Implementation:**
```css
.ghost-border {
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.ghost-border:hover,
.ghost-border.active {
  border-color: rgba(255, 179, 182, 0.5);
  box-shadow: 0 0 16px rgba(255, 179, 182, 0.15);
}
```

### 4.3 Button System

#### Primary Button
```tsx
<button className="btn-primary">
  {/* Background: gradient from --color-primary to #e8888e */}
  {/* Neon glow on hover */}
  {/* Scale 0.98 on active */}
</button>
```

**CSS Classes:**
```css
.btn-primary {
  background: linear-gradient(135deg, #ffb3b6, #e8888e);
  color: #11131e;
  font-weight: 700;
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  transition: all 200ms ease;
  box-shadow: 0 4px 16px rgba(255, 179, 182, 0.3);
}
.btn-primary:hover {
  box-shadow: 0 0 24px rgba(255, 179, 182, 0.5), 0 4px 16px rgba(255, 179, 182, 0.3);
  transform: translateY(-1px) scale(1.01);
}
.btn-primary:active {
  transform: scale(0.98);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(175, 255, 251, 0.4);
  color: #affffb;
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  transition: all 200ms ease;
}
.btn-secondary:hover {
  border-color: #affffb;
  box-shadow: 0 0 16px rgba(175, 255, 251, 0.3);
  background: rgba(175, 255, 251, 0.05);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #a0a0b8;
  border-radius: 0.75rem;
  padding: 0.5rem 1rem;
  transition: all 200ms ease;
}
.btn-ghost:hover {
  color: #f0f0f5;
  background: rgba(255, 255, 255, 0.06);
}
```

#### Icon Button
```css
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #a0a0b8;
  transition: all 200ms ease;
}
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f5;
}
.btn-icon.liked {
  color: #ffb3b6;
  box-shadow: 0 0 16px rgba(255, 179, 182, 0.4);
}
```

### 4.4 Tag / Chip System

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px; /* pill */
  font-size: 0.8125rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #a0a0b8;
  transition: all 200ms ease;
  cursor: pointer;
  user-select: none;
}
.tag:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 179, 182, 0.3);
  color: #f0f0f5;
}
.tag.selected {
  background: rgba(255, 179, 182, 0.15);
  border-color: rgba(255, 179, 182, 0.5);
  color: #ffb3b6;
  box-shadow: 0 0 12px rgba(255, 179, 182, 0.2);
}
```

### 4.5 Card Variants

#### Video Card (Feed)
```tsx
<div className="relative w-full h-screen snap-center">
  {/* Full-screen video/cover */}
  {/* Bottom gradient overlay */}
  {/* Right-side interaction bar */}
</div>
```

#### Twin Card (3-layer expandable)
```tsx
<div className="glass-panel twin-card">
  {/* Layer 1: Preview — collapsed state */}
  {/* Layer 2: Negotiation detail — expanded */}
  {/* Layer 3: Success state — confirmed */}
</div>
```

#### City Card (Onboarding)
```tsx
<div className="city-card ghost-border cursor-pointer">
  {/* Image background */}
  {/* City name overlay */}
  {/* Selected state: neon glow border */}
</div>
```

### 4.6 Input System

```css
.neon-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #f0f0f5;
  font-size: 1rem;
  transition: all 200ms ease;
  outline: none;
}
.neon-input::placeholder {
  color: #5a5a70;
}
.neon-input:focus {
  border-color: rgba(255, 179, 182, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 179, 182, 0.1);
  background: rgba(255, 255, 255, 0.06);
}
.neon-input.error {
  border-color: rgba(248, 113, 113, 0.5);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}
```

### 4.7 MBTI Badge

```css
.mbti-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  background: rgba(255, 179, 182, 0.1);
  border: 1px solid rgba(255, 179, 182, 0.3);
  color: #ffb3b6;
}
```

---

## 5. Animation Specifications

### Timing Tokens

```css
--duration-instant:  50ms;   /* Micro-interactions: checkbox, toggle */
--duration-fast:      150ms;  /* Hover states, button press */
--duration-normal:    200ms;  /* Standard transitions */
--duration-slow:      300ms;  /* Page transitions, modal open */
--duration-glacial:  500ms;  /* Dramatic reveals */
--ease-out:           cubic-bezier(0.16, 1, 0.3, 1);   /* Entrances */
--ease-in-out:        cubic-bezier(0.65, 0, 0.35, 1); /* Standard */
--ease-spring:        cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy */
```

### Animation Patterns

#### 1. Page Entrance
```tsx
// Staggered fade + translateY(12px) → translateY(0)
const pageEnter = {
  animation: 'pageEnter 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
};
// Stagger children by 60ms each

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 2. Card Expand (TwinCard Layer 1 → 2)
```tsx
// Scale from center + opacity
const cardExpand = {
  transition: `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
};
// Inner content: height auto with overflow hidden + max-height transition
```

#### 3. Neon Glow Pulse (Ambient)
```css
@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 179, 182, 0.4); }
  50%       { box-shadow: 0 0 32px rgba(255, 179, 182, 0.7); }
}
/* Applied to active/targeted cards */
.card-pulse {
  animation: neonPulse 2s ease-in-out infinite;
}
```

#### 4. Scroll Snap (Feed)
```css
.feed-container {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
.feed-item {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

#### 5. Like Heart Burst
```css
@keyframes heartBurst {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.4); }
  60%  { transform: scale(0.9); }
  80%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
/* Duration: 400ms */
```

#### 6. Stagger Children
```tsx
// On mount, stagger children with delay increments of 60ms
// Pattern: nth-child(1) → 0ms, nth-child(2) → 60ms, etc.
const staggerDelay = (index: number) => `${index * 60}ms`;
```

---

## 6. Layout Specifications

### Page Layout

| Page | Layout | Notes |
|------|--------|-------|
| `/onboarding` | Single column, centered max-w-lg | Steps with progress indicator |
| `/feed` | Full viewport height, snap scroll | No page scroll — card scroll only |
| `/result` | Single column, max-w-md centered | Success state after TwinCard confirm |

### Onboarding Steps

```
Step 1: MBTI Selection  (grid of 16 buttons)
Step 2: Interest Tags   (horizontal scroll pills)
Step 3: Voice Input     (microphone button + waveform)
Step 4: City Selection  (horizontal scroll city cards)
```

### Feed Layout

```
┌──────────────────────────────────────────┐
│  [Full-screen card — snap start]         │
│                                          │
│  [Video / Cover content area]            │
│                                          │
│  ┌─────────┐                             │
│  │ Avatar  │  ← Left bottom              │
│  │ Name    │                             │
│  │ MBTI    │                             │
│  └─────────┘                             │
│                         ┌──────┐         │
│                         │ Like │ ← Right │
│                         │ Cmt  │         │
│                         │ Share│         │
│                         │ Twin │ ← Trigger│
│                         └──────┘         │
│  ┌──────────────────────────────────┐    │
│  │  Bottom Navigation Bar            │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### Bottom Navigation

```
┌────┬────┬────┬────┐
│Feed│Search│Msg │ Me │   ← Fixed bottom, glass panel
└────┴────┴────┴────┘
Height: 4rem (64px)
Active indicator: neon primary glow dot
```

---

## 7. File Structure

```
twinbuddy/frontend/
├── docs/
│   └── DESIGN.md                    ← This file
│
├── src/
│   ├── pages/
│   │   ├── OnboardingPage.tsx       ← 4-step onboarding wizard
│   │   ├── FeedPage.tsx             ← TikTok-style snap feed
│   │   ├── TwinCardPage.tsx         ← Expanded TwinCard view
│   │   └── ResultPage.tsx           ← Success / match result
│   │
│   ├── components/
│   │   ├── ui/                      ← Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── GlassPanel.tsx
│   │   │   ├── NeonBadge.tsx
│   │   │   └── TagInput.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   ├── MBTIGrid.tsx         ← 16-type MBTI selection
│   │   │   ├── InterestTags.tsx      ← Horizontal scroll tags
│   │   │   ├── VoiceRecorder.tsx     ← Mic + waveform
│   │   │   └── CityCards.tsx         ← City selection cards
│   │   │
│   │   ├── feed/
│   │   │   ├── VideoCard.tsx         ← Full-screen video card
│   │   │   ├── InteractionBar.tsx   ← Right-side like/comment/share
│   │   │   └── BottomNav.tsx        ← Fixed bottom nav
│   │   │
│   │   └── twin-card/
│   │       ├── TwinCard.tsx          ← 3-layer expandable card
│   │       ├── RadarChart.tsx        ← SVG radar chart
│   │       ├── NegotiationThread.tsx  ← Chat log display
│   │       └── RedFlagsPanel.tsx     ← Warning badges
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts        ← Typed localStorage hook
│   │   ├── useOnboarding.ts          ← Onboarding form state
│   │   └── useFeedScroll.ts          ← Snap scroll position
│   │
│   ├── types/
│   │   └── index.ts                  ← All TypeScript types
│   │
│   ├── mocks/
│   │   ├── personas.json             ← 20 mock personas
│   │   ├── videos.json               ← 10 mock video feeds
│   │   └── negotiations.json         ← Pre-generated dialogues
│   │
│   ├── api/
│   │   └── client.ts                 ← API client with mock fallback
│   │
│   └── App.tsx                       ← React Router setup
│
├── public/
│   └── favicon.ico
│
├── package.json                       ← Vite + React + Tailwind
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── index.html
```

---

## 8. State & Persistence

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  onboarding: 'twinbuddy_onboarding_v3',   // OnboardingFormData
  feed_index: 'twinbuddy_feed_index_v3',  // number
  twin_cards_seen: 'twinbuddy_cards_seen', // string[]
  matched_personas: 'twinbuddy_matched',  // MatchResult[]
} as const;
```

### Onboarding State Shape

```typescript
interface OnboardingData {
  mbti: string;          // e.g. "ENFP"
  interests: string[];   // e.g. ["川西", "成都", "摄影"]
  voiceText: string;     // Transcribed voice input
  city: string;          // Selected city
  completed: boolean;
  timestamp: number;
}
```

---

## 9. Technical Constraints

- **No Rive dependency** — use CSS animations + SVG as fallback for avatar animations
- **CSS-only waveforms** — use CSS `conic-gradient` or SVG for voice visualization
- **Mobile-first** — all layouts must be responsive down to 320px
- **Snap scroll** — CSS `scroll-snap-type` only, no JS scroll libraries
- **No external animation libraries** — pure CSS + Framer Motion-like class toggling
- **Dark mode only** — no light mode toggle (Neon Pulse is dark by design)
- **TypeScript strict mode** — all components must be fully typed
- **No `any` types** — except where absolutely unavoidable (e.g., canvas refs)

---

## 10. Icon Strategy

Use **Lucide React** for all icons (already in dependency):
- Consistent 1.5px stroke weight
- Size: `w-5 h-5` (20px) for inline, `w-6 h-6` (24px) for standalone
- Color: inherit from parent `text-*` color class
- Custom SVG for: radar chart spokes, twin card layers, waveform animation

---

*Last updated: 2026-04-17*
*Lead Agent: agents-orchestrator*
