# Public Campaign Pages — Redesign Design Spec

- **Date:** 2026-06-19
- **Branch:** `redesign/campaign-pages`
- **Status:** Approved direction (mockups reviewed); ready for implementation planning
- **Owner:** Frontend (RenoXpert-Frontend-v2.1)

---

## 1. Context & Goal

The public-facing campaign pages (served on `campaign.renoxpert.my`, no auth) look **dated/unprofessional** and the **mobile experience is clunky**. Today they use Metronic's default blue (`#1B84FF`) plus blue→purple gradients, glassmorphism, and emoji badges — and the main landing page maintains **two separate hardcoded layouts** (`lg:hidden` vs `hidden lg:block`) that are brittle and drift apart.

The brand's real color is **crimson `#D71E42`** (confirmed from `public/app/RenoExpert_icon-01.svg`, which is solid crimson, and `public/app/RenoExpert_logo-01.svg`; the quotation page already hardcodes `text-[#d71e42]` for prices). The current pages are therefore literally off-brand.

**Goal:** Restyle all public campaign pages into a clean, on-brand, **"Premium Minimal"** look anchored on crimson as the single UI accent, and rebuild them as **genuinely responsive** layouts — without changing any business logic.

## 2. Scope

**In scope** (all under `src/pages/CampaignPages/`):

1. `CampaignDetailPage.tsx` (888 lines) — landing: header, hero, package selection, booking form, fully-booked & loading/error states.
2. `CampaignPackageDetailPage.tsx` (992 lines) — quotation document: payment summary, breakdown, package accordions with product tables, optional add-ons, and the T&C tab.
3. `FAQPage.tsx` (169 lines) — accordion.
4. `PaymentSuccess.tsx` (242 lines) and `PaymentError.tsx` (128 lines) — payment callback pages.
5. `ReceiptPDF.tsx` (249 lines) — **light touch only** (align accent color + logo; it uses `@react-pdf/renderer` styles, not Tailwind).

**Out of scope:** routing, API/services (`getCampaign`, `bookingPaymentIntent`), data models/types, the authenticated `src/pages/Campaign/*` admin pages, and any backend behavior.

## 3. Constraints — "reskin + responsive only"

All business logic and behavior is **preserved exactly**. Specifically, these stay untouched:

- Form fields (name, phone, email), validation rules, and the phone numeric-only filtering.
- Booking/payment flow: `bookingPaymentIntent(...)` → `window.location.href = response.result[0].url`, the `fully_redeemed` 400 handling, and the package/single-campaign branching.
- State, `useEffect` data fetching, `useMemo` pricing math (incl. `getRenoSubscriptionFixedOverrideNettAmount`), tab/expand/plan state, slot logic, `document.title` updates.
- Routes, route params, query-param parsing on the payment pages, and the `toast`/`ToastContainer` usage.
- React-PDF receipt generation/download behavior.

This is a **presentation-layer change**: JSX structure and `className`s change; handlers, effects, and computed values do not. The one structural change permitted is **consolidating the duplicated mobile/desktop blocks into a single responsive tree** (a layout change, in service of the responsive goal — see §5).

## 4. Design System — "Premium Minimal"

Calm, premium, trustworthy: one accent color, generous whitespace, clear type hierarchy, soft neutral surfaces. **Removed:** blue/purple gradients, glassmorphism (`backdrop-blur` decorative panels), emoji badges (e.g. "⭐ Most Popular"), and multi-color button gradients.

### 4.1 Color

Introduce a **campaign-scoped** crimson palette. Do **not** modify the existing Metronic `brand` (orange `#FF6F1E`) or `primary` (blue) tokens — that would risk the rest of the app. Add a new token namespace in `tailwind.config.js` → `theme.extend.colors`:

```js
campaign: {
  DEFAULT: '#D71E42', // primary accent — CTAs, selected states, links, prices
  600:     '#BE1A3B', // hover
  700:     '#9F1631', // active/pressed
  50:      '#FDF2F4', // tint backgrounds
  100:     '#FBE3E8', // tint borders
  200:     '#F6C2CC', // stronger tint
}
```

Usage: `bg-campaign`, `hover:bg-campaign-600`, `text-campaign`, `ring-campaign`, `border-campaign`, `bg-campaign-50`, `border-campaign-100`, `focus:ring-campaign/30`. Migrate the existing hardcoded `text-[#d71e42]` occurrences to `text-campaign`.

- **Neutrals:** Tailwind `slate` scale — headings `text-slate-900`, body `text-slate-500`/`600`, borders `border-slate-200`/`100`, surfaces `white` and `slate-50`.
- **Semantic colors (kept distinct from the brand on purpose):**
  - **Emerald** — positive/availability ("N slots left"), payment success.
  - **Red** — payment-error/alert state only (visually distinct from crimson brand).
  - **Teal** — the quotation "Discount" block (matches existing usage).

### 4.2 Typography

Inter (Metronic's default; confirm it's loaded). Tightened, consistent scale:

- Page H1: `text-3xl`/`text-4xl` mobile → up to `text-5xl` desktop hero, `font-extrabold tracking-tight`.
- Section H2: `text-xl`/`text-2xl font-bold`.
- Card titles: `text-lg font-semibold/bold`.
- Body: `text-base`/`text-sm text-slate-500 leading-relaxed`.
- Labels/meta: `text-xs`/`text-[11px]`, uppercase tracking for eyebrows.

### 4.3 Spacing, radius, shadow

- Radius: cards `rounded-2xl` (16px); buttons/inputs/pills `rounded-xl`/`rounded-full`.
- Padding: cards `p-6`/`p-8` desktop, `p-4` mobile; section rhythm `space-y-4`→`space-y-6`.
- Shadow: subtle only — a soft card shadow (≈ `0 8px 28px rgba(16,24,40,.08)`); no heavy `shadow-2xl` everywhere.
- Borders: 1px `slate-200` hairlines; selected = `ring-2`/`border-campaign`.

### 4.4 Component patterns

- **Buttons** — Primary: solid `bg-campaign` white text, `rounded-xl`, soft shadow, `hover:bg-campaign-600`. Secondary: white + `border-slate-200`. No gradients.
- **Inputs / Fields** — label above, leading Lucide icon, `rounded-xl border-slate-200`, `focus:ring-2 focus:ring-campaign/30 focus:border-campaign`.
- **Package card** — white/`border-slate-200`; selected: `border-campaign` + `bg-campaign-50/40` tint; "Most popular" = solid crimson pill (replaces the emoji + amber gradient); "N slots left" = subtle emerald pill; "View quotation" = crimson text link (not a heavy gradient button).
- **Badges/pills** — flat tinted pills (`bg-campaign-50 text-campaign`, `bg-emerald-50 text-emerald-700`, etc.).
- **Tabs (Quotation / T&C)** — segmented control: active = `bg-campaign text-white` (replaces blue).
- **Accordion (FAQ + packages)** — hairline-divided rows; active marker uses crimson tint; chevron/`+`/`−` affordance.
- **Tables (product lists)** — clean Item / Qty columns, `divide-y` rows, muted secondary descriptions.
- **States** — Loading: simple spinner/skeleton (drop the blue gradient backdrop). Error: calm card. Fully-booked: neutral/slate treatment with `x-circle`. Payment success: emerald check; Payment error: red `x-circle`, non-alarming, no charge reassurance.

### 4.5 Logo

Keep the existing asset the pages already reference: **`public/app/RenoExpert_logo-01.svg`** (full crimson/teal/orange wordmark) in headers. For very tight spots, `public/app/RenoExpert_icon-01.svg` (solid crimson) is available. No new assets, no path changes.

> Note: the multicolor logo (crimson + teal + orange) coexists with crimson-only UI by design — the wordmark is the brand signature in the header; crimson is the single *UI* accent. This is intentional, not a clash.

## 5. Responsive strategy

- **Single source of truth per page.** Remove the duplicated mobile vs desktop blocks in `CampaignDetailPage` (the `lg:hidden` / `hidden lg:block` twins) and express one tree with responsive utilities. This both fixes the "clunky mobile" complaint and removes a maintenance hazard.
- Breakpoints: Tailwind `sm`/`md`/`lg`. Mobile-first.
- Landing: hero stacks (headline → image → benefits → CTA); benefits become a compact 3-up tile row; packages single-column; booking form full-width.
- **Mobile sticky bottom action bar** on the landing (price + "Book" that scrolls to packages/form) — a layout-only enhancement, no logic change. *(Confirmed: included.)*
- All device sizes use uniform, generous tap targets (≥44px) and `text-base` (≥16px) inputs to avoid iOS zoom.

## 6. Per-page changes

1. **CampaignDetailPage** — Restyle header/hero/packages/booking per §4; collapse the two layout twins into one responsive tree (§5); recolor CTAs, selected package, badges, and the booking-amount/security/trust blocks to the new system; restyle loading/error/fully-booked states.
2. **CampaignPackageDetailPage** — **View-only quotation document (no booking CTA — verified absent in source).** Restyle: top bar, header card, segmented tabs (crimson), the **Payment Summary** hero (monthly + upfront / one-time per program), the breakdown rows (teal discount, total, payment terms, initial down payment, balance), the package **accordions + Item/Qty tables**, and redesign the **Optional Add-on Packages** block off the clashing blue into a subtle on-brand treatment (crimson "Add-on" tag + Award chip). T&C tab: render the existing long legal content in a readable layout (comfortable measure, section spacing; a sticky section index on desktop is a nice-to-have). The program-conditional payment-terms content (3.A/3.B/3.C) is preserved as-is.
3. **FAQPage** — Restyle the accordion to the minimal pattern (crimson active). Keep the existing accordion mechanism/content.
4. **PaymentSuccess** — Calm emerald confirmation, clean booking-detail rows, crimson primary actions (download receipt / back). Keep query-param parsing + PDF logic.
5. **PaymentError** — Distinct red alert (not crimson), reassurance copy, crimson "Try again". Keep error parsing.
6. **ReceiptPDF** — Light touch: swap accent color to crimson and ensure logo usage is consistent. Lower priority; `@react-pdf` `StyleSheet`, not Tailwind.

## 7. Code organization (light, behavior-preserving)

To keep 5 pages visually consistent and DRY without an architectural rewrite, extract a **small set of presentational primitives** (no business logic inside them) — e.g. under `src/pages/CampaignPages/components/`:

- `CampaignHeader` (logo nav), `Button`, `Card`, `Field` (labeled icon input), `Pill`/`Badge`, `Accordion`/`AccordionItem`, `Tabs`.

Pages keep all state, handlers, effects, and API calls; they compose these primitives. **Decision: extract these primitives** (confirmed). **No primitive may own data fetching, form state, or navigation logic.**

## 8. Implementation approach

- **Color:** add the scoped `campaign` Tailwind token (§4.1) rather than per-file arbitrary `[#D71E42]` values — tokenized, consistent, and non-breaking to existing Metronic tokens.
- **Styling:** Tailwind utility classes inline (matches the codebase); shared class clusters live in the §7 primitives.
- **Order:** tokens/primitives first → `CampaignDetailPage` (highest-traffic, hardest) → `CampaignPackageDetailPage` → `FAQPage` → `PaymentSuccess`/`PaymentError` → `ReceiptPDF`. Each page is verified at mobile + desktop before moving on.
- Execution may fan out per-page work to parallel agents (planned in the implementation plan), each page reskinned independently against this shared system.

## 9. Accessibility

- Contrast: crimson `#D71E42` on white ≈ 5.1:1 (passes WCAG AA for normal text); white-on-crimson buttons pass. Still verify any *small* crimson text meets AA in context.
- Visible focus rings (`focus:ring-campaign/30`) on all interactive elements; keyboard-operable accordions/tabs.
- Tap targets ≥44px; `16px` inputs; `alt` on the logo; decorative icons `aria-hidden`.

## 10. Non-goals

- No new features, copy rewrites, or content changes (sample copy in mockups is illustrative only).
- No changes to pricing math, payment programs, or the booking funnel.
- No global theme/Metronic refactor; no changes outside `src/pages/CampaignPages/` except the additive `tailwind.config.js` token and (if added) shared primitives.

## 11. Risks & mitigations

- **Token collision** with existing `brand` orange → mitigated by a new `campaign` namespace; leave existing tokens alone.
- **Losing behavior while restructuring the duplicated mobile/desktop tree** → restructure markup only; keep handlers/IDs (`#packages-section`, `#booking-section`) and `scrollIntoView` targets intact.
- **Pricing/program display regressions** on the quotation page → keep all `useMemo` logic and the exact conditional branches; only restyle their wrappers.
- **No automated test suite** (only `lint`/build) → rely on `tsc -b && vite build`, `eslint`, and a manual visual/functional QA checklist (§12).

## 12. Verification plan

- `npm run lint` clean; `npm run build` (`tsc -b && vite build`) succeeds.
- Manual QA at **375/390 (mobile), 768 (tablet), 1280 (desktop)** for each page and each state (loading, error, fully-booked, single-campaign vs packaged, payment success/error).
- Functional smoke (logic must be unchanged): select package → fill form → submit → reaches payment redirect; `fully_redeemed` path still toasts and updates slots; quotation tabs/expanders/plan selector still work; FAQ accordion opens/closes; receipt downloads.
- Cross-check against the approved mockup board (see §13).

## 13. Reference

Approved mockups (Premium Minimal · crimson · real logo · desktop + full mobile journey) live in the visual-companion board at `.superpowers/brainstorm/<session>/content/redesign-board-v6.html` (gitignored). Screens: landing (desktop + mobile), package detail Quotation + T&C (desktop + mobile), FAQ, payment success/error, fully-booked.
