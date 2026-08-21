# Metropolitan EMS - Design System

Single source of truth for the two-color brand system implemented in
`src/app/globals.css` and `tailwind.config.js`.

Design philosophy: simple, clean, professional. Exactly two brand colors,
used consistently everywhere. No gradients, no decorative animation beyond
subtle hover transitions, one way to build each kind of component.

## Color Palette

Defined in `tailwind.config.js`:

| Token | Hex | Use |
|---|---|---|
| `brand` | `#7b9acc` | Primary brand color - nav/sidebar background, active states, filled buttons, "id" backgrounds |
| `cream` | `#FCF6F5` | Page background, card/surface background, text-on-brand |

Legacy token names (`corporate-blue`, `soft-blue`, `light-bg`) still exist in
`tailwind.config.js` remapped to the same two hex values, kept only for
backward compatibility with old class names - always prefer `brand`/`cream`
in new or edited code.

### The two-color rule

- Any element with a **cream** (`#FCF6F5`) background **must** use **black**
  (`#000000`) text.
- Any element with a **brand** (`#7b9acc`) background **must** use **cream**
  (`#FCF6F5`) text.
- Do not introduce new brand hues, gradients, or arbitrary hex values.

**One accessibility exception**: destructive/danger actions and error
banners keep red (`bg-red-50`/`text-red-600`/`.btn-danger`) so failures and
delete/reject actions are never confused with normal brand actions. Status
badges (`StatusBadge`) keep their existing semantic amber/orange/green tints
for job/ticket states where color reinforces (never replaces) a text label.
Nothing else in the app should use a third color.

## Typography

- Page titles: `text-2xl md:text-3xl font-black text-black`
- Section titles: `text-lg font-black text-black`
- Labels / helper text: `text-[10px] font-black text-black/50 uppercase tracking-widest`
- Body text: `text-sm font-bold text-black`
- Muted text: `text-sm text-black/50`

Keep the existing uppercase/tracked-out label style already used throughout
the app - it's part of the visual identity.

## Buttons (`Button` component - `src/components/ui/Button.tsx`)

- **Primary** (filled): `bg-brand text-cream border-2 border-brand` - the main action on a screen.
- **Secondary** (outline): `bg-cream text-black border-2 border-brand`, hover inverts to `bg-brand text-cream` - cancel/secondary actions.
- **Danger**: `bg-red-50 text-red-600 border border-red-100`, hover `bg-red-100` - destructive actions only.

Hover feedback is an **animation, not a new color**: `-translate-y-0.5` +
`shadow-lg` on filled buttons, a brand/cream color-swap on outline buttons.

All variants: `rounded-2xl font-black uppercase tracking-widest text-xs`,
minimum 44px touch target, disabled state `opacity-50 cursor-not-allowed`.

## Inputs (`Input` component - `src/components/ui/Input.tsx`)

`bg-cream text-black border border-brand/30`, focus ring `ring-brand/40
border-brand`. Every field: label with required/optional indicator, input,
optional inline error line below in `text-red-600 text-xs`.

## Cards

`bg-cream rounded-2xl border border-brand/20 shadow-sm p-6` (or the existing
`Card` component, which now defaults to these tokens).

## Modals (`Modal` component - `src/components/ui/Modal.tsx`)

- Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-md z-[100]`
- Container: `bg-cream rounded-2xl shadow-2xl border border-brand/20`
- Header: `bg-brand text-cream px-6 py-5`, close button top-right
- Escape key and backdrop click both close the modal; focus moves into the modal on open

`ConfirmDialog` wraps `Modal` with OK/Cancel buttons for confirm/cancel
flows - use it instead of `window.confirm()`. Used on the employee dashboard
for the "Start Work Day" / "End Work Day" actions so a mistaken tap can't
silently clock the employee in/out.

## Toasts (`Toast`/`ToastProvider` - `src/components/ui/Toast.tsx`)

Fixed position (bottom-right), auto-dismiss after ~5s, manual dismiss
button. `success`/`info` use `bg-brand text-cream`; `error` keeps
`bg-red-600` (the one accessibility exception, so failures read distinctly
from normal brand-colored confirmations).

## Tables

- Header row: `bg-brand text-cream`
- Body rows: `bg-cream`, hover `bg-brand/10`
- Always pair with an `EmptyState` for the zero-results case and a `LoadingSpinner` while fetching.
- Admin tables are laptop-only and should show full column detail rather than collapsing into a mobile card layout.

## Empty States (`EmptyState` component - `src/components/ui/EmptyState.tsx`)

Icon (`text-brand/40`) + message (`text-black/50 text-sm font-bold`) +
optional action button, centered, generous vertical padding (`py-12`).

## Status Badges (`StatusBadge` component)

One consistent badge per job/ticket status - reuse the existing component
rather than inlining status-color logic per page. On the employee job-card
detail page this is paired with a linear step tracker (PENDING → TRAVELING
→ STARTED → ON_HOLD → COMPLETED, with CANCEL as a terminal exception) built
from `brand`/`cream` only, so employees can see progress at a glance without
reading table columns.

## Layout differences by role

- **Admin** (`AdminLayout`, `src/app/admin/**`): laptop-only, dense. Small
  padding/margins, wide (`max-w-[1600px]`-ish) content area, full-detail
  tables, professional/no playful rounding.
- **Employee** (`EmployeeLayout`, `src/app/employee/**`): mobile-first,
  friendly, minimal. No total-time/overtime figures anywhere in the
  employee-facing UI (that data still exists for admin reporting only).

## Logo

- `public/MetropolitanLOGO.png` - the company mark, used in the sidebar (expanded and collapsed), the browser tab favicon, and the login screen.

## Accessibility

- Every interactive element is a real `<button>`/`<a>`, not a `<div onClick>`.
- Icon-only buttons get an `aria-label`.
- Modals trap focus and restore it to the trigger element on close.
- Color is never the only signal (status badges pair color with text, not color alone).

## Migration Guide

When touching a page as part of the design-system migration:

1. Replace `window.confirm(...)` with `ConfirmDialog`.
2. Replace `window.alert(...)` with the `Toast` system.
3. Replace bespoke modal backdrops with `Modal`.
4. Replace raw `<input>`/`<label>` pairs with `Input`.
5. Replace one-off buttons with `Button`.
6. Replace `<div onClick>` interactive rows with `<button>` and add keyboard support.
7. Add an `EmptyState` branch to any table/list that doesn't already have one.
8. Replace any `slate-*`/`bg-white`/arbitrary-hex classes with the two-color tokens above.
9. Leave business logic, API calls, and validation rules untouched - this is a presentation-layer migration only.
