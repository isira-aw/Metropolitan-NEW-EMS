# Metropolitan EMS - Design System

Single source of truth for the corporate-navy visual system already implemented
in `src/app/globals.css` and `tailwind.config.js`. This document was previously
describing an unrelated slate/blue-600 palette that nothing in the app actually
used - it now documents what's real, so components can be checked against it.

Design philosophy: simple, clean, professional, enterprise-oriented. No
gradients, no decorative animation, minimal color palette, one way to build
each kind of component.

## Color Palette

Defined in `tailwind.config.js`:

| Token | Hex | Use |
|---|---|---|
| `corporate-blue` | `#144A92` | Primary actions, active nav, links |
| `soft-blue` | `#3F6FB5` | Secondary accents, hover highlights |
| `pure-black` | `#000000` | Primary text |
| `light-bg` | `#F4F6F8` | Page background |

Slate (`slate-50`...`slate-900`) is used for neutral text, borders, and muted
UI - not a separate competing palette. Red (`red-*`)/green (`green-*`)/amber
(`amber-*`) are used for destructive/success/warning states respectively, kept
to background-50/text-600/border-100 combinations (see Alerts below).

Do not introduce new brand colors, gradients, or arbitrary hex values in
components - use the tokens above or Tailwind's slate/red/green/amber scales.

## Typography

- Page titles: `text-2xl md:text-3xl font-black text-slate-900`
- Section titles: `text-lg font-black text-slate-900`
- Labels / helper text: `text-[10px] font-black text-slate-400 uppercase tracking-widest`
- Body text: `text-sm font-bold text-slate-700`
- Muted text: `text-sm text-slate-400`

Keep the existing uppercase/tracked-out label style already used throughout
the app - it's part of the visual identity, not a mistake to "correct" back to
sentence case.

## Buttons (`Button` component - `src/components/ui/Button.tsx`)

- **Primary**: `bg-corporate-blue text-white`, hover `bg-slate-900` - the main action on a screen.
- **Secondary**: `bg-slate-100 text-slate-600`, hover `bg-slate-200` - cancel/secondary actions.
- **Danger**: `bg-red-50 text-red-600 border border-red-100`, hover `bg-red-100` - destructive actions (matches the existing reject/delete styling already in use).

All variants: `rounded-2xl font-black uppercase tracking-widest text-xs`,
minimum 44px touch target (already enforced globally in `globals.css` on
mobile), disabled state `opacity-50 cursor-not-allowed`.

## Inputs (`Input` component - `src/components/ui/Input.tsx`)

Wraps the existing `.input-field`/`.input-field-error`/`.input-label` classes
in `globals.css`. Every field: label with required/optional indicator, input,
optional inline error line below in `text-red-600 text-xs`.

## Cards

`bg-white rounded-2xl border border-slate-100 shadow-sm p-6` (or the existing
`Card` component). Avoid the more extreme `rounded-[2rem]`/`rounded-[2.5rem]`
arbitrary values on new components going forward - `rounded-2xl` is the
standard.

## Modals (`Modal` component - `src/components/ui/Modal.tsx`)

- Backdrop: `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4`
- Container: `bg-white rounded-2xl shadow-2xl w-full max-w-lg`
- Header: `bg-slate-900 text-white px-6 py-5 flex justify-between items-center`, close button top-right
- Escape key and backdrop click both close the modal; focus moves into the modal on open

`ConfirmDialog` is a thin wrapper around `Modal` for confirm/cancel flows -
use it instead of `window.confirm()`.

## Toasts (`Toast`/`ToastProvider` - `src/components/ui/Toast.tsx`)

Replaces `window.alert()` everywhere, including the global API error
interceptor. Fixed position (bottom-right), auto-dismiss after ~5s, manual
dismiss button, variants: `success` (green), `error` (red), `info` (slate).

## Tables

- Header row: `bg-slate-50/50`, cells `text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]`
- Body rows: `divide-y divide-slate-50`, hover `hover:bg-slate-50/30`
- Always pair with an `EmptyState` for the zero-results case and a `LoadingSpinner` while fetching.
- Below `md`, provide a stacked-card fallback instead of relying solely on horizontal scroll for dense tables.

## Empty States (`EmptyState` component - `src/components/ui/EmptyState.tsx`)

Icon (`text-slate-300`) + message (`text-slate-400 text-sm font-bold`) +
optional action button, centered, generous vertical padding (`py-12`).

## Status Badges (`StatusBadge` component)

One consistent badge per job/ticket status - reuse the existing component
rather than inlining status-color logic per page.

## Accessibility

- Every interactive element is a real `<button>`/`<a>`, not a `<div onClick>`.
- Icon-only buttons get an `aria-label`.
- Modals trap focus and restore it to the trigger element on close.
- Color is never the only signal (status badges pair color with text, not color alone).

## Migration Guide

When touching a page as part of the design-system migration:

1. Replace `window.confirm(...)` with `ConfirmDialog`.
2. Replace `window.alert(...)` with the `Toast` system (remove the page-level `alert()` in the `catch` block once the global interceptor's toast covers it - don't double up).
3. Replace bespoke modal backdrops with `Modal`.
4. Replace raw `<input>`/`<label>` pairs with `Input`.
5. Replace one-off buttons with `Button`.
6. Replace `<div onClick>` interactive rows with `<button>` and add keyboard support.
7. Add an `EmptyState` branch to any table/list that doesn't already have one.
8. Leave business logic, API calls, and validation rules untouched - this is a presentation-layer migration only.
