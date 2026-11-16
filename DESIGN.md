# Design System & Interface Guidelines (DESIGN.md)

This document establishes the official visual language, tokens, component patterns, and interaction rules for the **Al-Huda Donation & Sponsor Tracker** application. All components and styling must conform to these specifications.

---

## 1. Visual Philosophy & Identity

* **Theme**: Modern Dark Glass Luxury (Fintech & Philanthropy)
* **Tone**: Trustworthy, institutional, refined, modern, high-contrast, uncluttered.
* **Core Metaphor**: Frosted dark glass cards floating on deep obsidian canvas with golden/amber illumination.
* **Anti-Slop Directives**:
  * No arbitrary multi-colored psychedelic neon gradients.
  * Gold/Amber is reserved for primary actions, financial milestones, and key metrics.
  * Emerald is strictly for success states, completed collections, and WhatsApp integration.
  * Rose/Red is strictly for errors, audits, and destructive actions.
  * Tabular numbers (`tabular-nums`) are mandatory for all currency values, counts, and dates.

---

## 2. Color Palette & Semantic Tokens

### Canvas & Surfaces
| Token Name | Tailwind Utility | Hex / RGBA | Role |
| :--- | :--- | :--- | :--- |
| **Canvas** | `bg-[#07080C]` | `#07080C` | Deepest root background |
| **Surface Base** | `bg-[#0e1118]` | `#0E1118` | Base panel background |
| **Glass Card** | `bg-white/[0.03] backdrop-blur-2xl` | `rgba(255, 255, 255, 0.03)` | Default container surface |
| **Glass Card Hover** | `hover:bg-white/[0.06]` | `rgba(255, 255, 255, 0.06)` | Interactive card hover |
| **Border Subtle** | `border-white/[0.08]` | `rgba(255, 255, 255, 0.08)` | Standard card/divider border |
| **Border Focus** | `border-amber-400/50` | `rgba(245, 158, 11, 0.5)` | Active selection or focus border |

### Accent & Brand Illumination
| Role | Color | Gradient / Token | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | Gold / Amber | `from-amber-400 to-orange-500` | Primary CTA, financial highlights, key badges |
| **Success / WhatsApp** | Emerald | `bg-emerald-500/15 text-emerald-400` | Completed transactions, WhatsApp dispatch |
| **Destructive** | Rose | `bg-rose-500/15 text-rose-400` | Deletion, correction logs, clearance revocation |
| **Informational** | Sky / Blue | `bg-sky-500/15 text-sky-400` | Bank transfers, audit trail references |
| **Corporate / Group** | Purple | `bg-purple-500/15 text-purple-300` | Group & company sponsor pool indicators |

### Typography & Foreground
* **Font Family**: **Inter** (`var(--font-inter)`, `font-sans`) as the primary UI typeface with `font-mono tabular-nums` for numeric & financial figures.
* **Headings**: `text-white font-black tracking-tight`
* **Body / Primary Text**: `text-slate-200 font-semibold`
* **Secondary / Labels**: `text-slate-400 font-medium text-xs`
* **Muted Metadata**: `text-slate-500 text-[11px]` (Never lower than 4.5:1 contrast against surface)
* **Numeric Figures**: `font-mono tabular-nums font-bold`

---

## 3. Typography Hierarchy

```
H1 (Page Title):     28px - 32px (text-2xl sm:text-3xl), font-black, tracking-tight
H2 (Section Header): 18px - 20px (text-lg sm:text-xl), font-black
H3 (Card Title):    14px - 16px (text-sm sm:text-base), font-bold
Body Text:          13px - 14px (text-xs sm:text-sm), text-slate-200
Captions / Labels:  10px - 11px (text-[10px] sm:text-[11px]), uppercase, tracking-wider, font-bold
Numbers & Currency: font-mono tabular-nums, strictly formatted with Indian or international separators
```

---

## 4. Component Patterns

### Buttons
1. **Primary Button**:
   `px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2`
2. **Secondary Button**:
   `px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/10 text-xs font-bold active:scale-[0.98] transition cursor-pointer flex items-center gap-1.5`
3. **Destructive Button**:
   `px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition cursor-pointer`
4. **Touch Targets**:
   All interactive buttons must preserve a minimum hit target of `44px` on mobile screens or touch devices.

### Inputs & Selects
* Surface: `bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white`
* Focus: `focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20`
* Accessible labels: Every form field must have a visible label or an explicit `aria-label`.

### Glass Cards
* Default: `bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`
* Interactive: add `hover:bg-white/[0.05] hover:border-amber-500/30 transition-all duration-200`

---

## 5. Accessibility (WCAG 2.1 AA Checklist)

* [x] **Color Contrast**: All text must meet minimum 4.5:1 ratio against dark background.
* [x] **Focus Rings**: All interactive elements must show clear `focus-visible:ring-2 focus-visible:ring-amber-400`.
* [x] **Icon-Only Buttons**: Every icon-only button must include an `aria-label` describing its exact action.
* [x] **Screen Reader Alerts**: Status notices, success toasts, and error banners must have `role="alert"` or `role="status"`.
* [x] **Keyboard Navigation**: Modals must trap focus, close on `Esc`, and be navigable via `Tab`.

---

## 6. Layout & Responsiveness Breakpoints

* **Mobile (< 640px)**: Single column cards, full-width buttons, collapsible sidebar drawer.
* **Tablet (640px - 1024px)**: 2-column KPI grids, responsive search/filter stack.
* **Desktop (> 1024px)**: Persistent left sidebar, 3 or 4-column KPI cards, full wide tables with horizontal scroll preservation.
