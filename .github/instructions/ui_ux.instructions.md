# 🏛️ Temple Registry & Management Portal — UI/UX Design Guidelines

> A comprehensive reference for every UI component, pattern, and interaction used in the application.
> Inspired by **Notion**, **Stripe Dashboard**, and **Linear App**.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens & Theme System](#2-design-tokens--theme-system)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Spacing & Layout](#5-spacing--layout)
6. [Buttons](#6-buttons)
7. [Inputs & Forms](#7-inputs--forms)
8. [Cards](#8-cards)
9. [Tables](#9-tables)
10. [Modals & Dialogs](#10-modals--dialogs)
11. [Drawers & Sheets](#11-drawers--sheets)
12. [Charts & Data Visualization](#12-charts--data-visualization)
13. [Navigation & Sidebar](#13-navigation--sidebar)
14. [Top Bar & Headers](#14-top-bar--headers)
15. [Badges & Status Indicators](#15-badges--status-indicators)
16. [KPI / Metric Cards](#16-kpi--metric-cards)
17. [Empty States](#17-empty-states)
18. [Loading States & Skeletons](#18-loading-states--skeletons)
19. [Toasts & Notifications](#19-toasts--notifications)
20. [Tooltips & Popovers](#20-tooltips--popovers)
21. [Tabs](#21-tabs)
22. [Dropdowns & Select](#22-dropdowns--select)
23. [Avatars](#23-avatars)
24. [Breadcrumbs](#24-breadcrumbs)
25. [Pagination](#25-pagination)
26. [Confirmation Dialogs](#26-confirmation-dialogs)
27. [Animations & Motion](#27-animations--motion)
28. [Responsive Design](#28-responsive-design)
29. [Accessibility](#29-accessibility)
30. [Dark Mode](#30-dark-mode)
31. [Do's and Don'ts](#31-dos-and-donts)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Every element must have a clear purpose. Remove anything that doesn't help the user. |
| **Consistency** | Use the same patterns, spacing, and colors everywhere. Never invent a new pattern when an existing one works. |
| **Delight** | Micro-interactions, smooth animations, and thoughtful feedback make the app feel alive. |
| **Hierarchy** | Use size, weight, color, and spacing to guide the user's eye to what matters most. |
| **Restraint** | Fewer elements, more whitespace. Let content breathe. |

### Aesthetic Direction

- **Clean & Modern**: Soft shadows, subtle gradients, rounded corners (0.75rem default radius)
- **Temple-Inspired**: Gold/saffron accent tones conveying warmth and tradition
- **Premium SaaS**: Enterprise-grade polish — not a generic admin panel
- **Airy Layouts**: Generous padding, controlled density, intentional negative space

---

## 2. Design Tokens & Theme System

All colors, shadows, and spacing are defined as **CSS custom properties** (HSL format) in `src/index.css` and mapped via `tailwind.config.ts`. Components **must never** use raw color values.

### Token Architecture

```
index.css (CSS Variables)
    ↓
tailwind.config.ts (Tailwind mappings)
    ↓
Components (Semantic classes only)
```

### Core Tokens

| Token | Light Mode (HSL) | Purpose |
|-------|------------------|---------|
| `--background` | `40 33% 98%` | Page background |
| `--foreground` | `30 10% 15%` | Primary text |
| `--card` | `0 0% 100%` | Card surfaces |
| `--primary` | `36 80% 50%` | Primary actions (gold) |
| `--accent` | `24 70% 55%` | Secondary actions (saffron) |
| `--muted` | `35 15% 93%` | Subdued backgrounds |
| `--muted-foreground` | `30 8% 50%` | Secondary text |
| `--destructive` | `0 72% 51%` | Error / danger |
| `--border` | `35 20% 90%` | Borders and dividers |
| `--ring` | `36 80% 50%` | Focus rings |

### Custom Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--temple-gold` | `36 80% 50%` | Brand gold accents |
| `--temple-saffron` | `24 85% 55%` | Brand saffron accents |
| `--temple-warm` | `35 40% 96%` | Warm background tint |
| `--success` | `152 60% 42%` | Positive states |
| `--warning` | `38 92% 50%` | Caution states |
| `--info` | `210 80% 55%` | Informational states |

### Gradient Tokens

| Token | Usage |
|-------|-------|
| `--gradient-gold` | `linear-gradient(135deg, gold → saffron)` — Primary CTAs, hero elements |
| `--gradient-warm` | `linear-gradient(135deg, warm → background)` — Subtle card backgrounds |
| `--gradient-dark` | `linear-gradient(135deg, dark shades)` — Sidebar, dark sections |

### Shadow Tokens

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation for inputs, small cards |
| `--shadow-md` | Medium elevation for cards, dropdowns |
| `--shadow-lg` | High elevation for modals, floating panels |
| `--shadow-gold` | Branded glow for primary CTAs |

### ❌ Never Do This

```tsx
// BAD — hardcoded colors
<div className="bg-white text-black border-gray-200">

// GOOD — semantic tokens
<div className="bg-card text-card-foreground border-border">
```

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| **Display / Headings** | Playfair Display | serif | All `h1`–`h4`, page titles, KPI values |
| **Body / UI** | DM Sans | sans-serif | Paragraphs, labels, buttons, inputs |

### Scale

| Element | Class | Size | Weight | Font |
|---------|-------|------|--------|------|
| Page Title (H1) | `text-2xl font-bold font-display` | 24px | 700 | Playfair Display |
| Section Title (H2) | `text-xl font-semibold font-display` | 20px | 600 | Playfair Display |
| Card Title (H3) | `text-lg font-semibold font-display` | 18px | 600 | Playfair Display |
| Subsection (H4) | `text-base font-semibold font-display` | 16px | 600 | Playfair Display |
| Body Text | `text-sm` | 14px | 400 | DM Sans |
| Small / Caption | `text-xs` | 12px | 400 | DM Sans |
| Tiny / Badge | `text-[11px]` | 11px | 500 | DM Sans |

### Rules

1. **One `H1` per page** — the page title in TopBar
2. **Never skip heading levels** — H1 → H2 → H3
3. **Line height**: Use Tailwind defaults (`leading-tight` for headings, `leading-normal` for body)
4. **Letter spacing**: `tracking-tight` on large headings for a premium feel
5. **Font display class**: Use `font-display` utility for any element needing Playfair Display
6. **Font body class**: Use `font-body` utility (already set on `body` element)

---

## 4. Color System

### Semantic Color Usage

| Purpose | Token | Light | Dark |
|---------|-------|-------|------|
| Primary Action | `bg-primary` | Temple Gold | Lighter Gold |
| Secondary Action | `bg-secondary` | Warm Gray | Dark Gray |
| Destructive | `bg-destructive` | Red | Dark Red |
| Success | `text-success` | Green | Green |
| Warning | `text-warning` | Amber | Amber |
| Info | `text-info` | Blue | Blue |

### Color Application Rules

1. **Background hierarchy**: `background` → `card` → `muted` (light to emphasis)
2. **Text hierarchy**: `foreground` → `muted-foreground` (primary to secondary)
3. **Interactive elements**: Use `primary` for main CTAs, `secondary` for less emphasis
4. **State colors**: Never use red/green/blue directly — always via `destructive`/`success`/`info`
5. **Opacity modifiers**: Use `bg-primary/10` for tinted backgrounds (e.g., icon containers)

### Contrast Requirements

- Body text on background: minimum **4.5:1** ratio
- Large text on background: minimum **3:1** ratio
- Interactive elements: clear visual distinction between default, hover, active, disabled

---

## 5. Spacing & Layout

### Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `gap-1` | 4px | Icon-text gap inside buttons |
| `gap-2` | 8px | Between related elements (badge dots, small groups) |
| `gap-3` | 12px | Between list items, form field groups |
| `gap-4` | 16px | Between cards, section padding |
| `gap-6` | 24px | Page-level padding, major section gaps |
| `gap-8` | 32px | Between major page sections |

### Layout Patterns

#### Page Layout
```
┌─────────────────────────────────────────────┐
│ Sidebar (w-64) │ Content Area              │
│                │ ┌──────────────────────┐   │
│ Logo           │ │ TopBar (h-16)        │   │
│ Navigation     │ ├──────────────────────┤   │
│                │ │ Main Content (p-6)   │   │
│                │ │                      │   │
│                │ │ KPI Cards (grid)     │   │
│                │ │ Charts               │   │
│                │ │ Tables               │   │
│                │ └──────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### Grid Systems
- **KPI Cards**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- **Chart Panels**: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- **Form Layouts**: `grid grid-cols-1 md:grid-cols-2 gap-4` for side-by-side fields

### Rules

1. **Page padding**: Always `p-6` on main content area
2. **Card internal padding**: `p-5` or `p-6`
3. **Section spacing**: `space-y-6` between major sections
4. **Consistent gaps**: Use `gap-4` for card grids, `gap-6` for section grids
5. **Max content width**: Consider `max-w-7xl mx-auto` for very wide screens

---

## 6. Buttons

### Variants

| Variant | Class | Usage | Example |
|---------|-------|-------|---------|
| **Default (Primary)** | `variant="default"` | Main actions — Save, Submit, Create | "Add Temple" |
| **Secondary** | `variant="secondary"` | Supporting actions | "Cancel", "Back" |
| **Outline** | `variant="outline"` | Tertiary actions, toggles | "Filter", "Export" |
| **Ghost** | `variant="ghost"` | Minimal emphasis, icon-only in toolbars | Sidebar nav items |
| **Destructive** | `variant="destructive"` | Dangerous actions | "Delete", "Reject" |
| **Link** | `variant="link"` | Text-style actions | "View all", "Learn more" |

### Sizes

| Size | Class | Height | Usage |
|------|-------|--------|-------|
| **Default** | `size="default"` | 40px (`h-10`) | Standard forms and actions |
| **Small** | `size="sm"` | 36px (`h-9`) | Compact spaces, table actions, inline |
| **Large** | `size="lg"` | 44px (`h-11`) | Hero CTAs, prominent page actions |
| **Icon** | `size="icon"` | 40×40px | Icon-only buttons (notifications, settings) |

### Golden CTA Pattern

For the most important action on a page:

```tsx
<Button className="rounded-lg gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
  <Plus className="w-4 h-4" />
  Add New Temple
</Button>
```

### States

| State | Visual Treatment |
|-------|-----------------|
| **Default** | Full color, standard shadow |
| **Hover** | Slightly darker (`hover:bg-primary/90`), cursor pointer |
| **Active/Pressed** | Scale down slightly or darker shade |
| **Focused** | Ring outline (`ring-2 ring-ring ring-offset-2`) |
| **Disabled** | 50% opacity, no pointer events |
| **Loading** | Show spinner icon, disable interaction |

### Button Rules

1. **One primary button per section** — don't compete for attention
2. **Icon + Label** for primary actions (icon alone only for compact/repeated actions)
3. **Consistent icon position**: Icon on the **left** for actions, **right** for navigation (→)
4. **Button groups**: Use `gap-2` between adjacent buttons
5. **Confirmation required** for destructive actions — never delete immediately
6. **Loading state**: Replace label with `<Loader2 className="animate-spin" />` + "Loading..."

---

## 7. Inputs & Forms

### Text Input

```tsx
<Input
  placeholder="Enter temple name..."
  className="h-10 rounded-md border-input bg-background"
/>
```

### Input Anatomy

| Part | Token / Class | Notes |
|------|---------------|-------|
| Border | `border-input` | Subtle border, blends with background |
| Background | `bg-background` | Matches page background |
| Text | `text-foreground` | High contrast for readability |
| Placeholder | `text-muted-foreground` | Low contrast, disappears on focus |
| Focus Ring | `ring-ring` | Gold ring on focus |
| Error | `border-destructive` | Red border + error message below |

### Form Layout Rules

1. **Labels above inputs** — never inline (except checkboxes/radio)
2. **Label component**: Use `<Label>` with `text-sm font-medium`
3. **Spacing**: `space-y-2` between label and input; `space-y-4` between field groups
4. **Validation messages**: Red text (`text-destructive text-sm`) below the input
5. **Required fields**: Asterisk on label (`<span className="text-destructive">*</span>`)
6. **Inline validation**: Validate on blur, show errors immediately
7. **Success feedback**: Green checkmark icon when valid (optional)
8. **Disabled fields**: `opacity-50 cursor-not-allowed`

### Form Components

| Component | Usage |
|-----------|-------|
| `Input` | Single-line text, email, numbers |
| `Textarea` | Multi-line text (descriptions, notes) |
| `Select` | Dropdowns with predefined options |
| `Checkbox` | Boolean toggles, multi-select lists |
| `RadioGroup` | Mutually exclusive options |
| `Switch` | On/off toggles (settings) |
| `Calendar` / `DatePicker` | Date selection |

### Form Patterns

#### Inline Filter Bar
```
┌─────────────────────────────────────────────┐
│ 🔍 Search input  │ [Status ▾] │ [Grade ▾]  │
└─────────────────────────────────────────────┘
```
- Search: `pl-9` with `Search` icon absolute-positioned
- Selects: `w-40` fixed width for filter dropdowns
- Wrap in `flex items-center gap-4`

#### Stacked Form
```
┌─────────────────────┐
│ Label               │
│ ┌─────────────────┐ │
│ │ Input           │ │
│ └─────────────────┘ │
│ Helper text         │
│                     │
│ Label               │
│ ┌─────────────────┐ │
│ │ Input           │ │
│ └─────────────────┘ │
└─────────────────────┘
```

---

## 8. Cards

### Card Anatomy

```
┌──────────────────────────────────────┐  ← border-border, rounded-xl
│  Card Header (p-6)                    │
│  ┌──────────────────────────────────┐ │
│  │ Title          [Action Button]   │ │
│  │ Description                      │ │
│  └──────────────────────────────────┘ │
│  Card Content (p-6 pt-0)             │
│  ┌──────────────────────────────────┐ │
│  │ Content body                     │ │
│  └──────────────────────────────────┘ │
│  Card Footer (p-6 pt-0)              │
│  ┌──────────────────────────────────┐ │
│  │ [Cancel]  [Save]                 │ │
│  └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Card Variants

| Variant | Styling | Usage |
|---------|---------|-------|
| **Default** | `bg-card border shadow-sm` | Content containers, form wrappers |
| **Elevated** | `bg-card shadow-md` | Featured content, highlighted sections |
| **Interactive** | `hover:shadow-md transition-shadow cursor-pointer` | Clickable cards (temple list items) |
| **KPI Card** | `bg-card border shadow-soft-sm` + gold bottom bar on hover | Dashboard metrics |
| **Ghost** | `bg-transparent border-none` | When card structure without visual container needed |

### Card Rules

1. **Rounded corners**: `rounded-xl` (12px) for standalone cards, `rounded-lg` for nested
2. **Border**: Always `border border-border` — don't rely on shadow alone
3. **Padding**: `p-5` for compact cards, `p-6` for standard
4. **Hover effects**: Only on interactive/clickable cards
5. **Header actions**: Align buttons to the right using `flex justify-between items-center`
6. **No nested cards** — use sections/dividers instead

---

## 9. Tables

### Table Anatomy

```
┌────────────────────────────────────────────────────┐
│ Header Row (bg-muted/50)                            │
│  Name ↕  │  Location  │  Grade  │  Status  │  ⋮    │
├────────────────────────────────────────────────────┤
│ Row 1 (hover:bg-muted/50)                           │
│  Chamundi │ Mysore    │ 🟡 A   │ ● Active │  ⋮    │
├────────────────────────────────────────────────────┤
│ Row 2                                               │
│  Dharma   │ Bangalore │ 🔵 B   │ ● Active │  ⋮    │
├────────────────────────────────────────────────────┤
│ Footer: Pagination                                  │
│  Showing 1-10 of 47       [← 1 2 3 4 5 →]         │
└────────────────────────────────────────────────────┘
```

### Table Styling

| Element | Class | Notes |
|---------|-------|-------|
| Header | `text-muted-foreground font-medium` | Subdued, uppercase optional |
| Header cell | `h-12 px-4` | Consistent height |
| Body cell | `p-4` | Comfortable padding |
| Row hover | `hover:bg-muted/50` | Subtle highlight |
| Row border | `border-b border-border` | Light dividers |
| Selected row | `bg-muted` | Highlighted state |

### Table Features to Include

1. **Sortable columns**: Click header to sort, show arrow indicator
2. **Row hover**: Always `hover:bg-muted/50`
3. **Sticky header**: For long tables, use `sticky top-0`
4. **Action column**: Last column with icon buttons or dropdown menu
5. **Status column**: Use `StatusBadge` component (color-coded)
6. **Empty state**: Show `EmptyState` component when no data
7. **Loading state**: Show `Skeleton` rows during fetch
8. **Pagination**: Below table with page controls

### Table Rules

1. **Left-align text**, right-align numbers
2. **Fixed column widths** where possible to prevent layout shift
3. **Truncate long text** with `truncate max-w-[200px]`
4. **Wrap in Card** — tables should always be inside a card container
5. **Row actions**: Use `DropdownMenu` with `MoreHorizontal` icon, not inline buttons
6. **Compact mode**: Reduce `p-4` to `p-2` for data-dense views

---

## 10. Modals & Dialogs

### Dialog Anatomy

```
┌─ Overlay (bg-black/80) ─────────────────────┐
│                                               │
│  ┌─ Dialog (bg-card, rounded-lg, shadow-lg) ─┐│
│  │                                            ││
│  │  Header                                    ││
│  │  ────────────────────────────────────────  ││
│  │  Title                          [✕]        ││
│  │  Description                               ││
│  │                                            ││
│  │  Content                                   ││
│  │  ┌──────────────────────────────────────┐  ││
│  │  │ Form fields / information            │  ││
│  │  └──────────────────────────────────────┘  ││
│  │                                            ││
│  │  Footer                                    ││
│  │  ────────────────────────────────────────  ││
│  │          [Cancel]  [Confirm]               ││
│  │                                            ││
│  └────────────────────────────────────────────┘│
│                                               │
└───────────────────────────────────────────────┘
```

### Dialog Sizes

| Size | Max Width | Usage |
|------|-----------|-------|
| Small | `max-w-sm` (384px) | Confirmations, simple inputs |
| Default | `max-w-lg` (512px) | Standard forms (1–5 fields) |
| Large | `max-w-2xl` (672px) | Complex forms, multi-step |
| Full | `max-w-4xl` (896px) | Data-heavy views, previews |

### Dialog Rules

1. **Always include a close button** (✕) in the header
2. **Click overlay to dismiss** for non-critical dialogs
3. **Trap focus** inside the dialog (handled by Radix)
4. **ESC to close** — always enabled
5. **Footer buttons**: Cancel (secondary/outline) on left, Confirm (primary) on right
6. **Loading state**: Disable buttons and show spinner during async operations
7. **Scroll**: Content area scrolls, header and footer remain fixed
8. **Animation**: Fade in overlay + scale up dialog (Radix default)
9. **Limit nesting**: Never open a dialog from within a dialog — use steps/tabs instead

---

## 11. Drawers & Sheets

### When to Use

| Component | Use Case |
|-----------|----------|
| **Dialog** | Short interactions, confirmations, simple forms |
| **Sheet (side drawer)** | Detail panels, edit forms, filters panel |
| **Drawer (bottom)** | Mobile-optimized actions, selections |

### Sheet Anatomy

```
┌────────────────────────────┬──────────────────┐
│                            │  Sheet (right)    │
│  Main Content              │  ┌──────────────┐│
│  (dimmed overlay)          │  │ Header       ││
│                            │  │ ────────────  ││
│                            │  │ Content      ││
│                            │  │              ││
│                            │  │              ││
│                            │  │ ────────────  ││
│                            │  │ Footer       ││
│                            │  └──────────────┘│
└────────────────────────────┴──────────────────┘
```

### Sheet Rules

1. **Width**: `w-[400px]` default, `w-[600px]` for complex content
2. **Slide animation**: Slide in from the side (right for LTR)
3. **Overlay**: Semi-transparent backdrop
4. **Scroll**: Sheet content scrolls independently
5. **Use for**: Temple detail view, devotee profile, donation receipt preview

---

## 12. Charts & Data Visualization

### Chart Library: Recharts

All charts use the Recharts library with custom theming via the shadcn `ChartContainer`.

### Chart Types & Usage

| Chart Type | Component | Usage |
|------------|-----------|-------|
| **Area Chart** | `<AreaChart>` | Donation trends over time, temple registrations |
| **Bar Chart** | `<BarChart>` | Grade distribution, monthly comparisons |
| **Line Chart** | `<LineChart>` | Performance metrics, growth tracking |
| **Pie / Donut** | `<PieChart>` | Category breakdowns, status distribution |

### Chart Color Palette

```typescript
const CHART_COLORS = {
  gold: "hsl(36, 80%, 50%)",      // Primary data series
  saffron: "hsl(24, 85%, 55%)",    // Secondary data series
  success: "hsl(152, 60%, 42%)",   // Positive metrics
  info: "hsl(210, 80%, 55%)",      // Informational series
  muted: "hsl(35, 15%, 75%)",      // Background/comparison data
};
```

### Chart Configuration Rules

1. **Always use `ChartContainer`** with a `chartConfig` for consistent theming
2. **Tooltip**: Use `<ChartTooltipContent>` — never raw HTML tooltips
3. **Responsive**: Use `<ResponsiveContainer width="100%" height={300}>`
4. **Grid lines**: Use `<CartesianGrid strokeDasharray="3 3" vertical={false} />` — horizontal only
5. **Axis labels**: `text-muted-foreground text-xs` — subtle, not distracting
6. **Legend**: Below chart, use `<ChartLegendContent>` component
7. **No 3D effects** — flat, modern chart style only
8. **Gradients in area charts**: Use gradient fills for visual richness

### Chart Sizing

| Context | Height | Width |
|---------|--------|-------|
| Dashboard card | 250–300px | 100% of card |
| Full-width panel | 350–400px | 100% of container |
| Compact/inline | 150–200px | 100% of card |

### Area Chart Pattern (Donation Trends)

```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(36, 80%, 50%)" stopOpacity={0.3} />
      <stop offset="95%" stopColor="hsl(36, 80%, 50%)" stopOpacity={0} />
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip content={<ChartTooltipContent />} />
  <Area
    type="monotone"
    dataKey="donations"
    stroke="hsl(36, 80%, 50%)"
    fill="url(#goldGradient)"
    strokeWidth={2}
  />
</AreaChart>
```

### Bar Chart Pattern (Grade Distribution)

```tsx
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="grade" />
  <YAxis />
  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
    {data.map((entry, i) => (
      <Cell key={i} fill={GRADE_COLORS[entry.grade]} />
    ))}
  </Bar>
</BarChart>
```

---

## 13. Navigation & Sidebar

### Sidebar Structure

```
┌──────────────────────────┐
│  🏛️ Temple Registry      │  ← Logo / brand area
│  Management Portal       │
│                          │
│  ─────────────────────── │
│                          │
│  📊 Dashboard       ←──── Active state (gold text, gold left border)
│  🏛️ Temples              │
│  🙏 Devotees             │
│  💰 Donations            │
│  📅 Events               │
│  ✅ Approvals            │
│                          │
│  ─────────────────────── │
│  ADMINISTRATION          │  ← Section label
│  👥 Users                │
│  ⚙️ Settings             │
│                          │
│  ─────────────────────── │
│                          │
│  [Logout]                │  ← Bottom-aligned
└──────────────────────────┘
```

### Sidebar Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-background` | Dark (`30 15% 12%`) | Sidebar BG |
| `--sidebar-foreground` | Light (`35 20% 85%`) | Default text |
| `--sidebar-primary` | Gold (`36 80% 50%`) | Active item text |
| `--sidebar-accent` | Slightly lighter dark | Hover item BG |
| `--sidebar-border` | Very dark | Dividers |

### Navigation Item States

| State | Visual |
|-------|--------|
| Default | `text-sidebar-foreground` — muted white |
| Hover | `bg-sidebar-accent text-sidebar-accent-foreground` — subtle highlight |
| Active | `text-sidebar-primary font-semibold` + left gold border bar |
| Disabled | `opacity-50 pointer-events-none` |

### Sidebar Rules

1. **Fixed width**: `w-64` (256px) expanded
2. **Collapsible**: Collapse to icon-only on mobile/tablet
3. **Active indicator**: Gold left border bar (`border-l-2 border-sidebar-primary`)
4. **Icons**: Always include Lucide icons (20×20px) next to labels
5. **Sections**: Group related items with `text-xs uppercase text-sidebar-foreground/50` headers
6. **Scroll**: Content area scrolls if navigation overflows
7. **Logo area**: Fixed at top, doesn't scroll
8. **Logout**: Fixed at bottom

---

## 14. Top Bar & Headers

### TopBar Anatomy

```
┌───────────────────────────────────────────────────────┐
│ Page Title                  🔍 Search │ 🔔 │ 👤 User │
│ Subtitle                                              │
└───────────────────────────────────────────────────────┘
```

### TopBar Specifications

| Element | Styling |
|---------|---------|
| Height | `h-16` (64px) |
| Background | `bg-card/80 backdrop-blur-md` — frosted glass |
| Border | `border-b border-border` |
| Position | `sticky top-0 z-20` |
| Title | `text-lg font-semibold font-display` |
| Subtitle | `text-xs text-muted-foreground` |

### TopBar Rules

1. **Always sticky** — remains visible on scroll
2. **Backdrop blur** for depth when content scrolls behind
3. **Search bar**: Hidden on mobile (`hidden md:block`)
4. **Notification bell**: Show dot indicator for unread (`bg-temple-saffron`)
5. **User avatar**: Show initials with `gradient-gold` background
6. **User info**: Hidden on small screens (`hidden lg:block`)

---

## 15. Badges & Status Indicators

### StatusBadge Component

The `StatusBadge` component provides consistent status indicators across the app.

### Variants

| Variant | Color | Dot Color | Usage |
|---------|-------|-----------|-------|
| `draft` | Muted BG + muted text | Gray | Unpublished records |
| `submitted` | Info/10 BG + info text | Blue | Awaiting review |
| `approved` | Success/10 BG + success text | Green | Approved records |
| `rejected` | Destructive/10 BG + red text | Red | Rejected records |
| `pending` | Warning/10 BG + amber text | Amber | Pending action |
| `active` | Success/10 BG + green text | Green | Active entities |
| `inactive` | Muted BG + muted text | Gray | Disabled entities |
| `grade-a` | Gold/15 BG + saffron text | Saffron | Top-grade temple |
| `grade-b` | Info/10 BG + blue text | Blue | Mid-grade temple |
| `grade-c` | Muted BG + muted text | Gray | Base-grade temple |

### Badge Anatomy

```
┌──────────────────┐
│ ● Status Label   │  ← Rounded-full pill with dot indicator
└──────────────────┘
```

### Badge Rules

1. **Always include a dot** (`dot={true}` default) for quick visual scanning
2. **Consistent mapping**: Same status → same variant everywhere
3. **Pill shape**: `rounded-full` — never square or rounded-md
4. **Size**: `text-xs px-2.5 py-1` — compact but readable
5. **Never use for counts** — use `Badge` component for numeric counts

---

## 16. KPI / Metric Cards

### KPI Card Anatomy

```
┌──────────────────────────────────────┐
│  Metric Label        [Icon]          │  ← text-muted-foreground
│  1,247                               │  ← text-2xl font-bold font-display
│  ↑ +12.3% from last month           │  ← text-success / text-destructive
│                                      │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │  ← Gold bar on hover (opacity transition)
└──────────────────────────────────────┘
```

### KPI Card Features

| Feature | Implementation |
|---------|---------------|
| **Enter animation** | `framer-motion` fade-up with staggered delay |
| **Icon container** | `w-10 h-10 rounded-lg bg-primary/10` |
| **Trend indicator** | `TrendingUp` / `TrendingDown` icons with color |
| **Bottom accent** | Gold gradient bar, `opacity-0 → opacity-100` on hover |
| **Hover shadow** | `shadow-soft-sm → shadow-soft-md` transition |

### KPI Card Rules

1. **Grid layout**: Always in a 4-column grid on desktop (`grid-cols-4`)
2. **Staggered animation**: Each card delays by `0.08s × index`
3. **Format numbers**: Use locale formatting (commas, currency symbols)
4. **Trend text**: Always include timeframe ("from last month", "vs last week")
5. **Icon choice**: Use meaningful icons (not generic) that represent the metric

---

## 17. Empty States

### Empty State Anatomy

```
┌──────────────────────────────────────┐
│                                      │
│           ┌──────────┐               │
│           │   📦     │               │  ← Icon in muted container
│           └──────────┘               │
│         No temples found             │  ← Title (font-semibold)
│    Add your first temple to get      │  ← Description (text-muted-foreground)
│           started                    │
│                                      │
│       [ + Add Temple ]               │  ← Optional action button
│                                      │
└──────────────────────────────────────┘
```

### Empty State Rules

1. **Center-aligned** both vertically and horizontally
2. **Icon**: Inside a `w-16 h-16 rounded-2xl bg-muted` container
3. **Generous padding**: `py-16` for breathing room
4. **Max width on description**: `max-w-xs` to prevent overly long lines
5. **Action button**: Use gold gradient CTA with `shadow-gold`
6. **Context-specific**: Every empty state should be unique to its context — don't reuse generic messages

### When to Show

- Table has no rows
- Filter returns no results (adjust messaging: "No results for your filters")
- Feature not yet configured
- First-time user experience

---

## 18. Loading States & Skeletons

### Skeleton Pattern

```
┌──────────────────────────────────────┐
│  ████████████             ██████     │  ← Animated shimmer
│  ██████████████████████████████████  │
│  ██████████████████████████          │
│  ████████████████                    │
└──────────────────────────────────────┘
```

### Skeleton Components

| Context | Component | Notes |
|---------|-----------|-------|
| Cards | `SkeletonCard` | Mimics card layout with header + content placeholders |
| Table rows | Inline `<Skeleton>` | Match column widths |
| Text | `<Skeleton className="h-4 w-[250px]" />` | Match expected text dimensions |
| Avatar | `<Skeleton className="h-10 w-10 rounded-full" />` | Circle shape |
| Chart | `<Skeleton className="h-[300px] w-full" />` | Full chart area |

### Loading Rules

1. **Skeletons over spinners** — always prefer skeleton loaders
2. **Match the layout**: Skeletons should mimic the shape of actual content
3. **Animation**: Use `animate-pulse` (built into shadcn Skeleton)
4. **Duration**: Show for at least 300ms to prevent flicker
5. **Never block the entire page** — only skeleton the loading section
6. **Spinners acceptable for**: Button loading states, inline saving indicators

### Spinner Usage (Exceptions)

```tsx
// Inside a button during form submission
<Button disabled>
  <Loader2 className="w-4 h-4 animate-spin" />
  Saving...
</Button>
```

---

## 19. Toasts & Notifications

### Toast Types

| Type | Icon | Color | Usage |
|------|------|-------|-------|
| **Success** | ✓ CheckCircle | Green | Record saved, action completed |
| **Error** | ✕ XCircle | Red | Validation failed, server error |
| **Warning** | ⚠ AlertTriangle | Amber | Non-critical issue, deprecation |
| **Info** | ℹ Info | Blue | General updates, tips |

### Toast Specifications

| Property | Value |
|----------|-------|
| Position | Bottom-right (default Sonner position) |
| Duration | 4 seconds (success), 6 seconds (error), manual dismiss (critical) |
| Width | ~360px max |
| Animation | Slide up + fade in |
| Stack | Maximum 3 visible, older ones pushed up |

### Toast Rules

1. **Use Sonner** (`toast()`) for simple notifications, **use-toast** for custom/complex
2. **Keep messages short**: Title (3–5 words) + optional description (1 sentence)
3. **Actionable**: Include undo action where possible (`toast("Deleted", { action: { label: "Undo", onClick: ... } })`)
4. **Don't toast on page load** — only on user actions
5. **Error toasts should explain** what went wrong and how to fix it
6. **Never use toasts for critical info** that the user must see — use inline alerts instead

### Toast Examples

```tsx
// Success
toast.success("Temple saved successfully");

// Error
toast.error("Failed to save temple", {
  description: "Please check your connection and try again."
});

// With action
toast("Donation record deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreDonation(id),
  },
});
```

---

## 20. Tooltips & Popovers

### Tooltip

| Property | Value |
|----------|-------|
| Delay | 300ms (don't show instantly) |
| Position | Top (default), auto-flip if clipped |
| Style | `bg-popover text-popover-foreground shadow-md rounded-md px-3 py-1.5 text-sm` |
| Max width | `max-w-xs` |
| Animation | Fade in + slight scale |

### Tooltip Rules

1. **For supplementary info only** — never hide critical information in tooltips
2. **Icon-only buttons must have tooltips** — accessibility requirement
3. **Keep text short**: 1–2 sentences maximum
4. **Don't tooltip things that are self-explanatory**
5. **Mobile**: Tooltips don't work on touch — ensure info is accessible elsewhere

### Popover

Use for richer interactive content (mini forms, filters, color pickers).

| Property | Value |
|----------|-------|
| Trigger | Click (never hover) |
| Style | `bg-popover shadow-lg rounded-lg border p-4` |
| Width | Content-dependent, `min-w-[200px]` |
| Dismiss | Click outside, ESC key |

---

## 21. Tabs

### Tab Styles

| Style | Usage |
|-------|-------|
| **Underline tabs** | Page-level section navigation (default shadcn) |
| **Pill tabs** | Inline filters, compact toggles |

### Tab Anatomy (Underline)

```
┌──────────────────────────────────────────────┐
│  [Overview]  [Details]  [History]  [Settings] │
│  ═══════════                                  │  ← Active underline (primary color)
├──────────────────────────────────────────────┤
│                                              │
│  Tab content area                            │
│                                              │
└──────────────────────────────────────────────┘
```

### Tab Rules

1. **Max 5–6 tabs** — use navigation for more sections
2. **Short labels**: 1–2 words each
3. **Icon + text** for primary tab bars
4. **Don't nest tabs** — use accordions or sections instead
5. **Preserve state**: Don't reset form inputs when switching tabs
6. **Active indicator**: Bold text + underline (primary color)
7. **URL sync**: Consider reflecting active tab in URL query params

---

## 22. Dropdowns & Select

### Select Component

```
┌─────────────────────────────┐
│  Select an option...     ▾  │  ← Trigger
└─────────────────────────────┘
         ↓ Opens ↓
┌─────────────────────────────┐
│  Option A                   │  ← hover:bg-accent
│  Option B                   │
│  Option C               ✓  │  ← Selected indicator
│  Option D                   │
└─────────────────────────────┘
```

### Dropdown Menu

Use for action menus (row actions, profile menu, bulk actions).

```
┌──────────────────────────┐
│  👁  View Details         │
│  ✏️  Edit                 │
│  📋  Duplicate            │
│  ──────────────────────  │  ← Separator
│  🗑  Delete          ⌘⌫  │  ← Destructive variant
└──────────────────────────┘
```

### Dropdown Rules

1. **Max 7 items** without grouping — use submenus or sections for more
2. **Destructive items last** with a separator above
3. **Keyboard shortcuts** shown right-aligned (when applicable)
4. **Icons on all items** for visual consistency
5. **Disabled items**: Show but gray out (`opacity-50`)
6. **Confirmation for destructive**: Open a confirmation dialog, don't execute immediately

---

## 23. Avatars

### Avatar Specifications

| Size | Class | Usage |
|------|-------|-------|
| XS | `w-6 h-6` | Compact lists, inline mentions |
| SM | `w-8 h-8` | TopBar user, table rows |
| MD | `w-10 h-10` | Card headers, profile previews |
| LG | `w-12 h-12` | Profile pages |
| XL | `w-16 h-16` | Hero profile section |

### Avatar Fallback

When no image is available:
- Show **initials** (first letter of first name + last name)
- Background: `gradient-gold`
- Text: `text-primary-foreground font-semibold`

### Avatar Rules

1. **Round shape**: Always `rounded-full`
2. **Border**: `border-2 border-primary/20` for distinction
3. **Groups**: Overlap with `-space-x-2` and `ring-2 ring-background` for separation
4. **Alt text**: Always include for accessibility

---

## 24. Breadcrumbs

### Breadcrumb Anatomy

```
Home  /  Temples  /  Chamundeshwari Temple
 ↑        ↑              ↑
Link    Link         Current (non-clickable)
```

### Breadcrumb Rules

1. **Text style**: `text-sm text-muted-foreground`
2. **Active item**: `text-foreground font-medium` (non-clickable)
3. **Separator**: `/` or `>` (use `ChevronRight` icon)
4. **Links**: `hover:text-primary` transition
5. **Max depth**: Show last 3 levels; truncate earlier with `...`
6. **Position**: Below TopBar, above page content

---

## 25. Pagination

### Pagination Anatomy

```
Showing 1–10 of 47 results

[←] [1] [2] [3] ... [5] [→]
         ↑
    Active page (bg-primary text-primary-foreground)
```

### Pagination Rules

1. **Show total count**: "Showing X–Y of Z results"
2. **Page buttons**: `size="icon"` buttons, max 5 visible + ellipsis
3. **Active page**: `bg-primary text-primary-foreground`
4. **Disabled arrows**: When on first/last page
5. **Position**: Below tables, right-aligned or centered
6. **Items per page**: Offer 10/25/50 selector when applicable

---

## 26. Confirmation Dialogs

### When to Confirm

| Action | Confirmation Required? |
|--------|----------------------|
| Delete record | ✅ Always |
| Reject submission | ✅ Always |
| Approve submission | ⚠️ Optional (low risk) |
| Save / Update | ❌ Never (just save) |
| Navigate away (unsaved) | ✅ Always |
| Bulk actions | ✅ Always |

### Confirmation Dialog Pattern

```
┌──────────────────────────────────────┐
│  ⚠️ Delete Temple Record?            │
│                                      │
│  This action cannot be undone. The   │
│  temple "Chamundeshwari" and all     │
│  associated records will be          │
│  permanently removed.                │
│                                      │
│        [Cancel]  [Delete]            │
│                    ↑                 │
│              variant="destructive"   │
└──────────────────────────────────────┘
```

### Confirmation Rules

1. **Specific title**: Name the action and the affected item
2. **Explain consequences**: What will be lost/changed
3. **Cancel is default** — Enter key should NOT trigger destructive action
4. **Destructive button**: Use `variant="destructive"` styling
5. **Non-destructive confirms**: Use `variant="default"` (primary gold)

---

## 27. Animations & Motion

### Library: Framer Motion

All animations use `framer-motion` for consistency and performance.

### Animation Patterns

| Pattern | Values | Usage |
|---------|--------|-------|
| **Fade up** | `y: 12 → 0, opacity: 0 → 1` | Cards entering viewport |
| **Fade in** | `opacity: 0 → 1` | Page transitions |
| **Scale** | `scale: 0.95 → 1` | Modals appearing |
| **Slide** | `x: -20 → 0` | Sidebar items |
| **Stagger** | `delay: index * 0.08` | Lists and grids |

### Motion Rules

1. **Duration**: 300–500ms for most transitions (`0.3`–`0.5`)
2. **Easing**: Use default spring or `ease-out` — never linear
3. **Stagger delay**: `0.05`–`0.1` per item (never more than 0.15)
4. **Hover transitions**: Use CSS `transition-*` (150–200ms), not Framer Motion
5. **Page transitions**: Fade in only (avoid sliding pages — feels sluggish)
6. **Respect `prefers-reduced-motion`**: Disable animations for users who prefer it
7. **Don't animate everything** — focus on hero moments (card entry, modal open, status change)

### CSS Transitions (for hover/focus)

```
transition-colors      → 150ms (button hover, link hover)
transition-shadow      → 200ms (card hover elevation)
transition-opacity     → 200ms (show/hide elements)
transition-all         → 200ms (combined property changes)
```

---

## 28. Responsive Design

### Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### Responsive Patterns

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Hidden / overlay | Collapsed (icons) | Full (w-64) |
| KPI Grid | 1 column | 2 columns | 4 columns |
| Charts | Full width | 1 column | 2 columns |
| Tables | Horizontal scroll | Full | Full |
| TopBar search | Hidden | Visible | Visible + wider |
| User info | Avatar only | Avatar + name | Full details |
| Forms | 1 column | 2 columns | 2 columns |

### Mobile-Specific Rules

1. **Touch targets**: Minimum 44×44px for all interactive elements
2. **No hover-only information**: Everything accessible via tap
3. **Bottom sheets** instead of modals on mobile
4. **Collapsible sidebar**: Use hamburger menu trigger
5. **Simplified tables**: Hide non-essential columns or use card view
6. **Font sizes**: Never below 14px for body text on mobile

---

## 29. Accessibility

### Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | All interactive elements focusable via Tab |
| **Focus indicators** | `ring-2 ring-ring ring-offset-2` on focus |
| **Screen readers** | Semantic HTML + ARIA labels |
| **Color contrast** | WCAG AA minimum (4.5:1 body, 3:1 large text) |
| **Alt text** | All images and icons have descriptive text |
| **Reduced motion** | Respect `prefers-reduced-motion` |
| **Error announcements** | Form errors announced via `aria-live` |

### Component-Specific

| Component | A11y Requirement |
|-----------|-----------------|
| Buttons | `aria-label` for icon-only buttons |
| Modals | Focus trap, ESC to close, `aria-modal` |
| Tables | `<th scope="col">` headers |
| Forms | Labels linked to inputs via `htmlFor` |
| Tabs | `role="tablist"`, `aria-selected` |
| Toasts | `role="status"` or `aria-live="polite"` |
| Status badges | Color + text (never color alone) |

---

## 30. Dark Mode

### Approach

Dark mode is defined via CSS custom properties in `.dark` class on the root element. All components automatically adapt because they use semantic tokens.

### Dark Mode Token Adjustments

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--background` | Light warm | `30 15% 8%` | Near-black, warm undertone |
| `--card` | White | `30 12% 12%` | Slightly elevated from BG |
| `--primary` | Gold 50% | Gold 55% | Slightly brighter for contrast |
| `--border` | Light gray | `30 8% 20%` | Subtle but visible |
| `--muted` | Light warm | `30 8% 16%` | Depressed surfaces |

### Dark Mode Rules

1. **Never use pure black** (`#000`) — use warm dark tones
2. **Reduce shadow intensity** in dark mode
3. **Increase text brightness** slightly (not pure white)
4. **Gold accents** remain vibrant in both modes
5. **Test all charts** in dark mode — ensure lines/bars are visible
6. **Images**: Consider adding a subtle overlay or adjusting opacity

---

## 31. Do's and Don'ts

### ✅ Do

- Use semantic design tokens for all colors
- Use `font-display` for headings, `font-body` for UI text
- Show skeletons during loading
- Include empty states for every list/table
- Animate card entrances with Framer Motion
- Use `gradient-gold` for primary CTAs
- Provide confirmation for destructive actions
- Maintain consistent spacing (`gap-4`, `gap-6`)
- Test at all breakpoints

### ❌ Don't

- Use hardcoded color values (`bg-white`, `text-black`, `#ff6600`)
- Use spinners as the default loading pattern
- Show blank screens when data is empty
- Use more than one primary button per section
- Animate everything — be selective
- Use `!important` in CSS
- Skip focus states on interactive elements
- Use default Shadcn UI component styling without customization
- Create cluttered layouts — when in doubt, add whitespace
- Use inline styles — always use Tailwind classes or CSS variables

---

## Appendix: Component Import Cheatsheet

```tsx
// Layout
import { AppLayout } from "@/components/layout/AppLayout";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";

// UI Primitives
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Custom Components
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

// Feedback
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

// Data Display
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Overlays
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Animation
import { motion } from "framer-motion";
```

---

*Last updated: April 2026*
*Temple Registry & Management Portal v1.0*
