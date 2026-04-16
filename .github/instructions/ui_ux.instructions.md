# 🎨 Temple Registry — UI/UX Design System Reference

> A complete reference for every design decision: colors, typography, spacing, component styling, and interaction patterns.

---

## 1. Color System

All colors use **HSL format** via CSS custom properties in `index.css`.

### 1.1 Light Mode

| Token | HSL Value | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `40 33% 98%` | `#faf9f7` | Page background |
| `--foreground` | `30 10% 15%` | `#282522` | Primary text |
| `--card` | `0 0% 100%` | `#ffffff` | Card surfaces |
| `--card-foreground` | `30 10% 15%` | `#282522` | Card text |
| `--primary` | `36 80% 50%` | `#e6a817` | Primary actions, CTA buttons |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--secondary` | `30 20% 95%` | `#f5f1ec` | Secondary surfaces |
| `--secondary-foreground` | `30 10% 25%` | `#3d3630` | Secondary text |
| `--muted` | `35 15% 93%` | `#eeebe6` | Muted backgrounds |
| `--muted-foreground` | `30 8% 50%` | `#867f77` | Placeholder/helper text |
| `--accent` | `24 70% 55%` | `#d97a2b` | Accent highlights, saffron |
| `--accent-foreground` | `0 0% 100%` | `#ffffff` | Text on accent |
| `--destructive` | `0 72% 51%` | `#dc2626` | Error states, delete actions |
| `--border` | `35 20% 90%` | `#e8e2da` | Borders, dividers |
| `--input` | `35 20% 90%` | `#e8e2da` | Input borders |
| `--ring` | `36 80% 50%` | `#e6a817` | Focus ring |

### 1.2 Dark Mode

| Token | HSL Value | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `30 15% 8%` | `#171412` | Page background |
| `--foreground` | `35 20% 90%` | `#e8e2da` | Primary text |
| `--card` | `30 12% 12%` | `#221f1b` | Card surfaces |
| `--primary` | `36 80% 55%` | `#e6b52e` | Primary actions (slightly brighter) |
| `--primary-foreground` | `30 15% 8%` | `#171412` | Text on primary (dark) |
| `--secondary` | `30 10% 18%` | `#312c27` | Secondary surfaces |
| `--muted` | `30 8% 16%` | `#2b2724` | Muted backgrounds |
| `--muted-foreground` | `35 12% 55%` | `#9a8e82` | Placeholder text |
| `--border` | `30 8% 20%` | `#373230` | Borders |

### 1.3 Sidebar Colors

| Token | Light HSL | Usage |
|---|---|---|
| `--sidebar-background` | `30 15% 12%` | Sidebar bg (always dark) |
| `--sidebar-foreground` | `35 20% 85%` | Sidebar text |
| `--sidebar-primary` | `36 80% 50%` | Active nav item bg |
| `--sidebar-accent` | `30 12% 18%` | Hover state bg |
| `--sidebar-border` | `30 10% 20%` | Sidebar dividers |

### 1.4 Semantic / Status Colors

| Token | HSL | Usage |
|---|---|---|
| `--success` | `152 60% 42%` | Approved badges, success toasts |
| `--warning` | `38 92% 50%` | Warning badges, pending states |
| `--info` | `210 80% 55%` | Info badges, informational states |
| `--destructive` | `0 72% 51%` | Errors, rejected badges, delete |

### 1.5 Custom Temple Tokens

| Token | HSL | Usage |
|---|---|---|
| `--temple-gold` | `36 80% 50%` | Gold accents, branding |
| `--temple-saffron` | `24 85% 55%` | Saffron highlights |
| `--temple-warm` | `35 40% 96%` | Warm surface tint |
| `--temple-dark` | `30 15% 12%` | Dark surface (sidebar) |

### 1.6 Gradients

| Name | Value | Usage |
|---|---|---|
| `gradient-gold` | `135deg, gold → saffron` | CTA buttons, logo bg, KPI icons |
| `gradient-warm` | `135deg, warm → background` | Section backgrounds |
| `gradient-dark` | `135deg, dark → darker` | Dark overlays |

### 1.7 Shadows

| Class | Value | Usage |
|---|---|---|
| `shadow-soft-sm` | `0 1px 2px` at 4% opacity | Subtle card resting |
| `shadow-soft-md` | `0 4px 12px` at 8% opacity | Elevated cards |
| `shadow-soft-lg` | `0 12px 32px` at 12% opacity | Modals, popovers |
| `shadow-gold` | `0 4px 20px` gold at 25% | Gold CTA glow effect |

---

## 2. Typography

### 2.1 Font Families

| Role | Font | Tailwind Class | CSS Variable |
|---|---|---|---|
| **Headings** (h1–h4) | Playfair Display | `font-display` | `var(--font-display)` |
| **Body / UI** | DM Sans | `font-body` | `var(--font-body)` |

> Headings automatically use `font-display` via the base layer CSS rule on `h1, h2, h3, h4`.

### 2.2 Font Sizes & Weights

| Element | Size | Weight | Font | Line Height |
|---|---|---|---|---|
| **Page title (h1)** | `text-2xl` (24px) | `font-bold` (700) | Playfair Display | 1.3 |
| **Section title (h2)** | `text-lg` (18px) | `font-semibold` (600) | Playfair Display | 1.4 |
| **Card title (h3)** | `text-base` (16px) | `font-semibold` (600) | Playfair Display | 1.4 |
| **Subsection (h4)** | `text-sm` (14px) | `font-semibold` (600) | Playfair Display | 1.5 |
| **Body text** | `text-sm` (14px) | `font-normal` (400) | DM Sans | 1.5 |
| **Small / Helper** | `text-xs` (12px) | `font-normal` (400) | DM Sans | 1.5 |
| **Tiny labels** | `text-[11px]` | `font-medium` (500) | DM Sans | 1.4 |
| **KPI value** | `text-2xl` (24px) | `font-bold` (700) | DM Sans | 1.2 |

### 2.3 Text Colors

| Purpose | Class |
|---|---|
| Primary text | `text-foreground` |
| Secondary / helper | `text-muted-foreground` |
| On primary surfaces | `text-primary-foreground` |
| Links / interactive | `text-primary` |
| Error text | `text-destructive` |

---

## 3. Spacing System

Use Tailwind's default 4px grid. Standard spacing values used:

| Context | Value | Class |
|---|---|---|
| Page padding | 24px | `p-6` |
| Card padding | 24px | `p-6` |
| Section gap | 24px | `gap-6` or `space-y-6` |
| Component inner gap | 16px | `gap-4` or `space-y-4` |
| Tight inner gap | 8px | `gap-2` or `space-y-2` |
| Form field gap | 16px | `space-y-4` |
| Inline element gap | 8–12px | `gap-2` or `gap-3` |

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-lg` | `0.75rem` (12px) | Cards, modals, large containers |
| `rounded-md` | `calc(0.75rem - 2px)` ≈ 10px | Buttons, inputs, badges |
| `rounded-sm` | `calc(0.75rem - 4px)` ≈ 8px | Small chips, tags |
| `rounded-full` | `9999px` | Avatars, notification dots |

---

## 5. Component Specifications

### 5.1 Buttons

| Variant | Background | Text | Border | Shadow | Usage |
|---|---|---|---|---|---|
| **Default (primary)** | `bg-primary` | `text-primary-foreground` | none | none | Primary actions |
| **Gold CTA** | `gradient-gold` | `text-primary-foreground` | none | `shadow-gold` | Hero CTA, important actions |
| **Secondary** | `bg-secondary` | `text-secondary-foreground` | none | none | Secondary actions |
| **Outline** | `bg-background` | `text-foreground` | `border-input` | none | Tertiary actions |
| **Ghost** | transparent | `text-foreground` | none | none | Toolbar actions, icon buttons |
| **Destructive** | `bg-destructive` | `text-destructive-foreground` | none | none | Delete, reject |
| **Link** | transparent | `text-primary` | none | none | Inline links |

**Sizes:**

| Size | Height | Padding | Font Size |
|---|---|---|---|
| `sm` | 36px (`h-9`) | `px-3` | 14px |
| `default` | 40px (`h-10`) | `px-4` | 14px |
| `lg` | 44px (`h-11`) | `px-8` | 14px |
| `icon` | 40×40px | centered | — |

**States:** Hover = `opacity/90`. Focus = `ring-2 ring-ring ring-offset-2`. Disabled = `opacity-50`.

### 5.2 Inputs & Form Fields

| Property | Value |
|---|---|
| Height | `h-10` (40px) |
| Border | `border-input` (1px) |
| Border radius | `rounded-md` |
| Background | `bg-background` |
| Focus | `ring-2 ring-ring` |
| Placeholder color | `text-muted-foreground` |
| Label | `text-sm font-medium`, placed above input with `space-y-2` |
| Error text | `text-sm text-destructive`, below input |

### 5.3 Cards

| Property | Value |
|---|---|
| Background | `bg-card` |
| Border | `border border-border` |
| Radius | `rounded-lg` |
| Padding | `p-6` |
| Shadow (resting) | `shadow-soft-sm` |
| Shadow (hover) | `shadow-soft-md` (with `transition-shadow`) |
| Title font | `font-display text-base font-semibold` |
| Description | `text-sm text-muted-foreground` |

### 5.4 Tables

| Property | Value |
|---|---|
| Header bg | `bg-muted/50` |
| Header text | `text-xs text-muted-foreground font-medium uppercase tracking-wider` |
| Row border | `border-b border-border` |
| Row hover | `hover:bg-muted/30` |
| Cell padding | `px-4 py-3` |
| Cell text | `text-sm text-foreground` |
| Sticky header | `sticky top-0 z-10` |

### 5.5 Badges / Status Badges

| Status | Background | Text | Border |
|---|---|---|---|
| Draft | `bg-muted` | `text-muted-foreground` | none |
| Submitted | `bg-info/10` | `text-info` | none |
| Approved | `bg-success/10` | `text-success` | none |
| Rejected | `bg-destructive/10` | `text-destructive` | none |
| Warning | `bg-warning/10` | `text-warning-foreground` | none |

**Size:** `text-xs font-medium px-2.5 py-0.5 rounded-full`

### 5.6 Modals (Dialog)

| Property | Value |
|---|---|
| Overlay | `bg-black/50 backdrop-blur-sm` |
| Background | `bg-card` |
| Border | `border border-border` |
| Radius | `rounded-lg` |
| Shadow | `shadow-soft-lg` |
| Max width | `max-w-md` (small), `max-w-lg` (medium), `max-w-2xl` (large) |
| Padding | `p-6` |
| Animation | Fade + scale via Radix |
| Title | `font-display text-lg font-semibold` |
| Description | `text-sm text-muted-foreground` |
| Footer | `flex justify-end gap-2 pt-4` |

### 5.7 Sheets / Drawers

| Property | Value |
|---|---|
| Overlay | `bg-black/50` |
| Background | `bg-card` |
| Width | `w-[400px]` (default), `w-[600px]` (wide) |
| Padding | `p-6` |
| Animation | Slide from right (side = right) |
| Use case | Detail panels, forms, edit views |

### 5.8 Dropdowns / Select

| Property | Value |
|---|---|
| Trigger | Same as outline button |
| Content bg | `bg-popover` |
| Border | `border border-border` |
| Radius | `rounded-md` |
| Shadow | `shadow-soft-md` |
| Item padding | `px-3 py-2` |
| Item hover | `bg-accent text-accent-foreground` |

### 5.9 Tabs

| Property | Value |
|---|---|
| Tab list bg | `bg-muted` with `rounded-md` |
| Active tab | `bg-background text-foreground shadow-sm` |
| Inactive tab | `text-muted-foreground` |
| Tab padding | `px-3 py-1.5` |
| Font | `text-sm font-medium` |

### 5.10 Tooltips

| Property | Value |
|---|---|
| Background | `bg-popover` |
| Text | `text-popover-foreground text-xs` |
| Radius | `rounded-md` |
| Padding | `px-3 py-1.5` |
| Shadow | `shadow-soft-md` |
| Delay | 200ms |

### 5.11 KPI Cards

| Property | Value |
|---|---|
| Layout | Icon left, value + label right |
| Icon container | `w-12 h-12 rounded-lg` with `gradient-gold` or semantic bg |
| Value | `text-2xl font-bold font-body` |
| Label | `text-sm text-muted-foreground` |
| Trend | `text-xs` — green (`text-success`) for up, red (`text-destructive`) for down |
| Hover | `shadow-soft-md` transition |

### 5.12 Charts (Recharts)

| Property | Value |
|---|---|
| Area fill | `gradient-gold` (linearGradient from gold to transparent) |
| Line stroke | `hsl(var(--primary))` |
| Bar fill | `hsl(var(--primary))` or `hsl(var(--accent))` |
| Tooltip bg | `bg-card border border-border rounded-lg shadow-soft-md p-3` |
| Axis text | `text-xs text-muted-foreground` |
| Grid lines | `stroke: hsl(var(--border))` |
| Bar radius | `[4, 4, 0, 0]` (rounded top) |

---

## 6. Layout Rules

### 6.1 Page Structure

```
┌──────────────────────────────────────────┐
│ Sidebar (260px / 72px collapsed)         │
│  ┌────────────────────────────────────┐  │
│  │ TopBar (h-16, sticky)              │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Main Content (p-6, scroll)   │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 6.2 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | `< 640px` | Sidebar hidden, single column, hamburger menu |
| Tablet | `640–1024px` | Sidebar collapsed (72px), 2-col grids |
| Desktop | `> 1024px` | Sidebar expanded (260px), full layout |

### 6.3 Grid Layouts

| Content | Grid |
|---|---|
| KPI cards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` |
| Dashboard charts | `grid-cols-1 lg:grid-cols-2 gap-6` |
| Form layouts | `grid-cols-1 md:grid-cols-2 gap-4` |

---

## 7. Animation & Motion

Using **Framer Motion**.

| Animation | Duration | Easing | Usage |
|---|---|---|---|
| Fade-up (page enter) | 400ms | `ease-out` | Page content on mount |
| Slide-in-left | 300ms | `ease-out` | Sidebar items |
| Stagger children | 50–80ms delay | `ease-out` | Card grids, list items |
| Hover scale | 150ms | `ease-in-out` | Sidebar icons: `scale(1.1)` |
| Sidebar expand/collapse | 250ms | `easeInOut` | Sidebar width transition |
| Shimmer | 2s infinite | `linear` | Skeleton loaders |

**Standard page entry:**
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
```

**Stagger pattern:**
```tsx
// Parent
variants={{ show: { transition: { staggerChildren: 0.06 } } }}

// Child
variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
```

---

## 8. Loading & Empty States

### 8.1 Skeleton Loaders

| Property | Value |
|---|---|
| Background | `bg-muted` |
| Animation | `animate-shimmer` (2s linear infinite) |
| Radius | Match the element being loaded |
| Use | Always prefer skeletons over spinners |

### 8.2 Empty States

| Property | Value |
|---|---|
| Icon | `text-muted-foreground` Lucide icon, 48px |
| Title | `text-lg font-display font-semibold` |
| Description | `text-sm text-muted-foreground max-w-sm text-center` |
| CTA | Primary button below |
| Centering | `flex flex-col items-center justify-center py-16` |

---

## 9. Toast Notifications (Sonner)

| Type | Icon | Description |
|---|---|---|
| Success | ✓ check | Action completed |
| Error | ✕ x | Something failed |
| Info | ℹ info | Neutral message |
| Warning | ⚠ alert | Needs attention |

**Position:** Top-right. **Duration:** 4 seconds. **Styling:** Uses `bg-card border-border`.

---

## 10. Accessibility (WCAG AA)

| Rule | Requirement |
|---|---|
| Color contrast | 4.5:1 minimum for text |
| Focus indicators | `ring-2 ring-ring ring-offset-2` on all interactive elements |
| Touch targets | Minimum 44×44px on mobile |
| ARIA labels | On icon-only buttons and nav landmarks |
| Keyboard nav | Full tab order, Escape to close overlays |
| Screen readers | Semantic HTML (nav, main, header, section) |
| Reduced motion | Respect `prefers-reduced-motion` |

---

## 11. Sidebar Navigation

| Property | Value |
|---|---|
| Expanded width | `260px` |
| Collapsed width | `72px` |
| Background | `bg-sidebar` (always dark) |
| Active item | `bg-sidebar-primary text-sidebar-primary-foreground shadow-gold` |
| Inactive item | `text-sidebar-foreground/70` |
| Hover | `bg-sidebar-accent text-sidebar-foreground` |
| Item height | `py-2.5` |
| Icon size | `18×18px` |
| Font | `text-sm font-medium` (DM Sans) |

---

## 12. TopBar

| Property | Value |
|---|---|
| Height | `h-16` (64px) |
| Background | `bg-card/80 backdrop-blur-md` |
| Position | `sticky top-0 z-20` |
| Border | `border-b border-border` |
| Title | `text-lg font-semibold font-display` |
| Subtitle | `text-xs text-muted-foreground` |
| Search input | `h-9 w-64 bg-secondary/50` |

---

## 13. Icon Usage (Lucide React)

| Context | Size | Class |
|---|---|---|
| Nav items | 18×18px | `w-[18px] h-[18px]` |
| Buttons (inline) | 16×16px | `w-4 h-4` (auto via button) |
| KPI card icons | 20×20px | `w-5 h-5` |
| Empty state | 48×48px | `w-12 h-12` |
| Decorative small | 14×14px | `w-3.5 h-3.5` |

---

## 14. Do's and Don'ts

### ✅ Do

- Use semantic color tokens (`text-foreground`, `bg-primary`) — never raw hex/HSL in components
- Use `font-display` for headings, `font-body` for everything else
- Apply `rounded-lg` for containers, `rounded-md` for controls
- Use skeleton loaders for every async state
- Add hover transitions (`transition-colors`, `transition-shadow`)
- Maintain consistent `p-6` page padding and `gap-6` section spacing

### ❌ Don't

- Use hardcoded colors like `text-white`, `bg-black`, `bg-gray-200`
- Mix font families inconsistently
- Use spinners instead of skeletons
- Skip empty states or error states
- Use sharp corners (`rounded-none`)
- Create cluttered layouts — maintain generous whitespace
