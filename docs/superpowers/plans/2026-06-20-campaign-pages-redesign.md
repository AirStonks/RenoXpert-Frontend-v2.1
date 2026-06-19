# Public Campaign Pages Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all public campaign pages into a clean, on-brand "Premium Minimal" look anchored on brand crimson `#D71E42`, and make them genuinely responsive — without changing any business logic.

**Architecture:** Add one scoped Tailwind color token (`campaign`) and a small set of presentational primitives under `src/pages/CampaignPages/components/`, then reskin each of the 5 public pages in place by composing those primitives. All state, effects, handlers, API calls, element IDs, and pricing math are preserved verbatim; only JSX structure and `className`s change (plus collapsing the landing page's duplicated mobile/desktop trees into one responsive tree).

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind CSS 3 (Metronic theme), lucide-react icons, react-toastify, @react-pdf/renderer.

**Design spec:** `docs/superpowers/specs/2026-06-19-campaign-pages-redesign-design.md`
**Visual source of truth (mockups):** `.superpowers/brainstorm/2321496-1781880965/content/redesign-board-v6.html` (gitignored; open via the brainstorm companion or any browser). Match these screens.

## Global Constraints

- **Reskin + responsive only.** Do NOT change: form fields/validation, the phone numeric-only filter, `bookingPaymentIntent` flow and `window.location.href = response.result[0].url` redirect, the `fully_redeemed` 400 handling, package vs single-campaign branching, all `useEffect`/`useMemo` logic (incl. `getRenoSubscriptionFixedOverrideNettAmount`), tab/expand/plan state, `document.title` updates, query-param parsing, `toast`/`ToastContainer`, `KTAccordion` mechanics, or PDF generation/download. Preserve element IDs `#packages-section` and `#booking-section` and all `scrollIntoView` targets.
- **Single accent color:** brand crimson `#D71E42` (token `campaign`). Tints `50 #FDF2F4`, `100 #FBE3E8`, `200 #F6C2CC`, hover `600 #BE1A3B`, active `700 #9F1631`.
- **Do NOT modify** the existing Metronic `brand` (orange) / `primary` (blue) tokens or any file outside `src/pages/CampaignPages/` except the additive `tailwind.config.js` token and `index.html` font weights.
- **Semantic colors kept distinct:** emerald = availability/success, red = payment error, teal = quotation discount. Never fold these into crimson.
- **Removed everywhere:** blue/purple gradients, decorative `backdrop-blur` glassmorphism panels, emoji badges, multi-color button gradients.
- **Logo:** keep `public/app/RenoExpert_logo-01.svg` (no new assets, no path changes).
- **Lint:** `react-refresh/only-export-components` (warn, `allowConstantExport: true`) means a module that exports a React component must not also export a **function** — keep `buttonClasses` (a function) in its own non-component file, and do not create a barrel that mixes component + function exports.
- **Verification gate (CORRECTED after baseline check):** project-wide `npm run lint` is **pre-existingly broken** (586 problems / 540 errors across the Metronic codebase, unrelated to this work) — do NOT use it as a gate. Per-task gate is: (1) `npm run build` (`tsc -b && vite build`) **exits 0**, and (2) scoped lint of only the files this task touches is clean: `npx eslint <files> --ext ts,tsx --max-warnings 0` exits 0. Then visual parity vs the mockup board at 375 / 768 / 1280 and a behavior-preservation review. Where a task step below says "`npm run lint`", use this scoped gate instead. Do not scaffold a test runner (out of scope, YAGNI).
- **Pre-existing dead vars to remove** in files being rewritten (they cause scoped-lint errors today): `PaymentSuccess.tsx` and `PaymentError.tsx` — unused `LOCAL_PATH_PREFIX` and `MEDIA_URL` module consts; `CampaignPackageDetailPage.tsx` — unused `headerThumbUrl` memo (lines ~181–186) and its now-unused `useMemo` import only if nothing else uses it. Removing genuinely-unused code has no behavior impact and is required for a clean scoped lint.

---

### Task 1: Design foundation — `campaign` color token + Inter weights

**Files:**
- Modify: `tailwind.config.js` (inside `theme.extend.colors`, after the `teal` block ~lines 327–331)
- Modify: `index.html:8` (Google Fonts link)

**Interfaces:**
- Produces: Tailwind utilities `bg-campaign`, `text-campaign`, `border-campaign`, `ring-campaign`, `bg-campaign-50`, `border-campaign-100`, `bg-campaign-600`, `bg-campaign-700`, and opacity modifiers like `ring-campaign/30`, `focus-visible:ring-campaign/40`. Inter weights 700/800 available for `font-bold`/`font-extrabold`.

- [ ] **Step 1: Add the `campaign` color token**

In `tailwind.config.js`, locate the `teal` block inside `theme.extend.colors`:

```js
				teal: {
					50: '#e6fffa',
					500: '#14b8a6',
					700: '#0d9488',
				},
```

Add the `campaign` token immediately after it (still inside `colors`):

```js
				campaign: {
					DEFAULT: '#D71E42',
					50: '#FDF2F4',
					100: '#FBE3E8',
					200: '#F6C2CC',
					600: '#BE1A3B',
					700: '#9F1631',
				},
```

- [ ] **Step 2: Load Inter 700 & 800 weights**

In `index.html` line 8, change the Inter weight list from `400;500;600` to `400;500;600;700;800` (leave Plus Jakarta Sans untouched):

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run lint && npm run build`
Expected: exit 0 (no warnings; `tsc -b` + `vite build` succeed). The token is unused so far — it is exercised in later tasks.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js index.html
git commit -m "feat(campaign): add scoped crimson token and Inter bold weights"
```

---

### Task 2: Shared presentational primitives

**Files:**
- Create: `src/pages/CampaignPages/components/buttonClasses.ts`
- Create: `src/pages/CampaignPages/components/Button.tsx`
- Create: `src/pages/CampaignPages/components/Card.tsx`
- Create: `src/pages/CampaignPages/components/Field.tsx`
- Create: `src/pages/CampaignPages/components/Pill.tsx`
- Create: `src/pages/CampaignPages/components/Tabs.tsx`
- Create: `src/pages/CampaignPages/components/AccordionItem.tsx`
- Create: `src/pages/CampaignPages/components/CampaignHeader.tsx`

**Interfaces (consumed by Tasks 3–7):**
- `buttonClasses({ variant?: 'primary'|'secondary', size?: 'md'|'lg', fullWidth?: boolean, className?: string }): string`
- `<Button variant? size? fullWidth? ...buttonHTMLAttributes>` — renders `<button>`.
- `<Card ...divHTMLAttributes>` — white surface, rounded-2xl, hairline border, soft shadow.
- `<Field label icon ...inputHTMLAttributes>` — labeled input, leading Lucide icon, crimson focus ring. Spreads all input props (value/onChange/name/required/type/pattern/maxLength/inputMode/placeholder).
- `<Pill tone?='brand'|'emerald'|'slate'|'red'|'teal' ...spanHTMLAttributes>` — tinted pill.
- `<Tabs tabs={{key,label}[]} active onChange />` — segmented control, crimson active.
- `<AccordionItem open onToggle header children className? headerClassName? />` — controlled disclosure with chevron.
- `<CampaignHeader title? right? />` — sticky logo header.

- [ ] **Step 1: Create `buttonClasses.ts` (non-component module — keeps the function out of component files for react-refresh)**

```ts
export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-campaign text-white hover:bg-campaign-600 active:bg-campaign-700 shadow-[0_8px_24px_rgba(215,30,66,0.25)]',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3.5',
};

export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = 'primary', size = 'md', fullWidth = false, className = '' } = opts;
  return [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
```

- [ ] **Step 2: Create `Button.tsx`**

```tsx
import React from 'react';
import { buttonClasses, type ButtonVariant, type ButtonSize } from './buttonClasses';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({ variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create `Card.tsx`**

```tsx
import React from 'react';

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_rgba(16,24,40,0.06)]';

export function Card({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${CARD_SHADOW} ${className}`} {...rest}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create `Field.tsx`**

```tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
};

export function Field({ label, icon: Icon, id, className = '', ...rest }: FieldProps) {
  const inputId = id || rest.name;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          className={`w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white text-base text-slate-900 placeholder-slate-400 transition focus:outline-none focus:border-campaign focus:ring-2 focus:ring-campaign/30 ${className}`}
          {...rest}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `Pill.tsx`**

```tsx
import React from 'react';

type Tone = 'brand' | 'emerald' | 'slate' | 'red' | 'teal';

const TONES: Record<Tone, string> = {
  brand: 'bg-campaign-50 text-campaign',
  emerald: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
  red: 'bg-red-50 text-red-600',
  teal: 'bg-teal-50 text-teal-700',
};

type PillProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Pill({ tone = 'brand', className = '', children, ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Create `Tabs.tsx`**

```tsx
import React from 'react';

type Tab = { key: string; label: React.ReactNode };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`inline-flex gap-1 p-1 bg-slate-100 rounded-xl ${className}`}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive ? 'bg-campaign text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Create `AccordionItem.tsx`**

```tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItemProps = {
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export function AccordionItem({
  open,
  onToggle,
  header,
  children,
  className = '',
  headerClassName = '',
}: AccordionItemProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${headerClassName}`}
      >
        <div className="flex-1">{header}</div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 ml-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="p-4 sm:p-5 border-t border-slate-100">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 8: Create `CampaignHeader.tsx`**

```tsx
import React from 'react';

type CampaignHeaderProps = {
  title?: string;
  right?: React.ReactNode;
};

export function CampaignHeader({ title, right }: CampaignHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-8 sm:h-9 w-auto" />
          {title && (
            <span className="text-sm sm:text-base font-semibold text-slate-900 border-l border-slate-200 pl-3">
              {title}
            </span>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
```

- [ ] **Step 9: Verify lint + typecheck/build**

Run: `npm run lint && npm run build`
Expected: exit 0. In particular, no `react-refresh/only-export-components` warning (each `.tsx` exports exactly one component; the function lives in `buttonClasses.ts`).

- [ ] **Step 10: Commit**

```bash
git add src/pages/CampaignPages/components/
git commit -m "feat(campaign): add shared presentational primitives"
```

---

### Task 3: Reskin `CampaignDetailPage.tsx` (landing)

**Files:**
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx`
- Use: components from Task 2; `buttonClasses` for `<Link>`s styled as buttons.

**Behavior-preservation checklist (must stay byte-for-byte in logic):** `formData` state + `handleInputChange` (incl. phone numeric filter), `handlePackageChange` (+ `scrollIntoView('#booking-section')`), `handleSubmit` (`bookingPaymentIntent` → `window.location.href`, `fully_redeemed` handling, toasts), `useEffect` fetch + `document.title`, `selectedPackage`/`isFullyBooked` logic, IDs `#packages-section` and `#booking-section`, the Book-Now scroll handler, `<ToastContainer />`.

- [ ] **Step 1: Swap imports**

Add at top (keep existing lucide imports that are still used):

```tsx
import { Button } from './components/Button';
import { buttonClasses } from './components/buttonClasses';
import { Card } from './components/Card';
import { Field } from './components/Field';
import { Pill } from './components/Pill';
import { CampaignHeader } from './components/CampaignHeader';
```

Lucide icons still needed: `User, Phone, Mail, CreditCard, Loader2, Package, ShieldCheck, CheckCircle, ArrowRight, XCircle, Percent, Calendar, ArrowDown, HelpCircle`. Remove now-unused ones (`Clock, Shield, AlertCircle` if unused after reskin) to satisfy `--max-warnings 0`.

- [ ] **Step 2: Replace the page wrapper + header**

Replace the outer gradient wrapper `bg-gradient-to-br from-white via-gray-50 to-blue-50` with a neutral surface, and the hand-rolled header block with `<CampaignHeader>`:

```tsx
return (
  <div className="w-full min-h-screen bg-slate-50">
    <CampaignHeader
      right={
        <Link to="faq" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
          <HelpCircle className="h-4 w-4" /> FAQ
        </Link>
      }
    />
    {/* hero + main (Steps 3–6) */}
    <ToastContainer />
  </div>
);
```

- [ ] **Step 3: Collapse the duplicated hero into ONE responsive tree**

Delete the three twin blocks (`lg:hidden order-1` mobile title, `hidden lg:block` desktop content, `lg:hidden` mobile content). Replace with a single responsive hero. Keep the campaign image, title, description, the 3 benefit items, the FAQ link, and the Book-Now button + fully-booked branch — exactly the same data and the same scroll handler:

```tsx
<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-10">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
    {/* Copy */}
    <div className="order-2 lg:order-1">
      <Pill tone="brand"><span className="h-1.5 w-1.5 rounded-full bg-campaign" /> Limited-time offer</Pill>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mt-4">
        {campaign.title}
      </h1>
      {campaign.description && (
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed mt-4 max-w-prose">
          {campaign.description.split('\n').map((line, idx) => (<span key={idx}>{line}<br /></span>))}
        </p>
      )}
      {/* benefits — single 3-up row that reflows */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 mt-6">
        {[
          { icon: Percent, label: '0% Management Fee' },
          { icon: Calendar, label: '60 Months Instalment' },
          { icon: CheckCircle, label: '0 Hassle & Headache' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left rounded-xl border border-slate-100 sm:border-0 p-2.5 sm:p-0">
            <span className="h-9 w-9 rounded-xl bg-campaign-50 grid place-items-center text-campaign"><Icon className="h-4 w-4" /></span>
            <span className="text-[11px] sm:text-sm font-semibold text-slate-700 mt-1.5 sm:mt-0 leading-tight">{label}</span>
          </div>
        ))}
      </div>
      {/* CTA — keep the exact scroll handler / fully-booked branch */}
      <div className="mt-7">
        {isFullyBooked ? (
          <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-50 text-red-600 font-semibold"><XCircle className="h-5 w-5" /> Fully Booked</span>
        ) : (
          <Button size="lg" onClick={() => {
            if (campaign.packages && campaign.packages.length > 0) {
              document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <CreditCard className="h-5 w-5" /> Book your slot <ArrowDown className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-5 mt-5 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure payment</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Instant confirmation</span>
      </div>
    </div>
    {/* Image */}
    <div className="order-1 lg:order-2">
      <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200">
        {campaign.thumbnail ? (
          <img src={(campaign.thumbnail as Attachment).file_url} alt={campaign.title} className="w-full h-56 sm:h-80 lg:h-[420px] object-cover" />
        ) : (
          <div className="w-full h-56 sm:h-80 lg:h-[420px] bg-slate-100 grid place-items-center text-slate-400">
            <Package className="h-16 w-16" />
          </div>
        )}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Reskin the package cards**

Inside the existing `campaign.packages.map(...)`, keep the hidden radio + `<label htmlFor>` + `handlePackageChange` wiring and `pkg.slot_remaining` logic. Replace the gradient/emoji styling: selected → `border-2 border-campaign bg-campaign-50/40`; first card "Most popular" → `<Pill tone="brand" className="absolute -top-3 left-5">Most popular</Pill>` (no emoji); slot status → `<Pill tone="emerald">{...slots left}</Pill>` or `<Pill tone="red">Fully Booked</Pill>`; price kept (`RM {pkg.booking_amount.toLocaleString(...)}` + "Booking Fee" in `text-campaign`); "View Quotation" → `<Link to={`packages/${pkg.id}`} className={buttonClasses({ variant: 'secondary', size: 'md' })}>` (keep `onClick={(e)=>e.stopPropagation()}`). Card container uses `<Card className="...">` or a plain `<label>` styled per the mockup's package card. Keep the radio selection indicator dot recolored to crimson.

- [ ] **Step 5: Reskin the booking form (right column) using `Field`**

Keep `id="booking-section"`, the `sticky top-4 lg:top-8` wrapper, the `<form onSubmit={handleSubmit}>`, and the three controlled inputs — but render them with `<Field>`:

```tsx
<Field label="Full Name *" icon={User} type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter your full name" />
<Field label="Phone Number *" icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required pattern="[0-9]*" maxLength={15} inputMode="numeric" placeholder="Enter your phone number" />
<Field label="Email Address *" icon={Mail} type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email address" />
```

Wrap the form in `<Card className="p-5 sm:p-6">`. Booking-amount block → `bg-campaign-50 border border-campaign-100` with `text-campaign` amount. Security/trust rows → slate text + `ShieldCheck`. Submit button → `<Button type="submit" fullWidth size="lg" disabled={isSubmitting}>` with the existing `isSubmitting` spinner/label logic (keep `Loader2` spinner).

- [ ] **Step 6: Reskin loading / error / fully-booked states**

- Loading (`if (loading)`): neutral `bg-slate-50` full-screen, centered `Loader2` (crimson) + "Loading campaign…". Remove the blue gradient.
- Error (`if (error || !campaign)`): `<Card>` centered with `XCircle` (red), heading, message, and a `<Button onClick={() => navigate('/')}>Go Home</Button>`.
- Fully-booked main layout: keep the same condition; restyle to a neutral/slate card with `XCircle`, "Campaign Fully Booked", and the existing copy.

- [ ] **Step 7: Add the mobile sticky bottom action bar**

Add, as a direct child of the page wrapper, a mobile-only bar that reuses the existing scroll behaviour (no new logic). Only show when not fully booked:

```tsx
{!isFullyBooked && (
  <div className="lg:hidden sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between">
    <div>
      <p className="text-[11px] text-slate-400 leading-none">From</p>
      <p className="text-base font-extrabold text-slate-900">
        RM {(selectedPackage?.booking_amount ?? campaign.booking_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
    </div>
    <Button onClick={() => {
      const target = (campaign.packages && campaign.packages.length > 0) ? 'packages-section' : 'booking-section';
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
    }}>
      Book now <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
)}
```

- [ ] **Step 8: Verify (lint + build + visual + behavior)**

Run: `npm run lint && npm run build`
Expected: exit 0.
Then `npm run dev`, open the local public route `/campaign/campaigns/<any-slug>`; verify (vs the mockup board): single responsive hero at 375/768/1280, package cards, sticky booking card on desktop, sticky bottom bar on mobile, loading/error/fully-booked states. Re-read your diff and confirm every item in the Behavior-preservation checklist is unchanged.

- [ ] **Step 9: Commit**

```bash
git add src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): reskin landing page (premium minimal, responsive, sticky mobile CTA)"
```

---

### Task 4: Reskin `CampaignPackageDetailPage.tsx` (quotation + T&C)

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`
- Use: `Card`, `Tabs`, `AccordionItem`, `Pill`, `buttonClasses`.

**Behavior-preservation checklist:** all `useMemo`s (`selectedCampaignPackage`, `templateOrder`, `templateQuotation`, `bonus`, `selectedProgram`, `upfrontAmount`, `totalExcludedAddonAmount`, `totalRenoNowPrice`, `bonusValue`, `overrideTotalQuotationAmount`, `displayTotalQuotationAmount`), `expandedPackageIds`/`togglePackage`, `selectedPlan`, `activeTab`, the `tnc` JSX content and its program-conditional blocks (3.A/3.B/3.C), the `getProductQty`/`convertToWords` helpers, loading/error returns, and the `navigate(-1)` back button. This is **view-only — do NOT add any booking/pay button.**

- [ ] **Step 1: Swap imports & the tabs control**

Import `Card`, `Tabs`, `AccordionItem`, `Pill` (and keep `ArrowLeft, ChevronDown, ChevronUp, Package as PackageIcon, Award, CreditCard`, `InformationCircleIcon`). Replace the two hand-rolled tab `<button>`s (the `bg-blue-500` ones) with:

```tsx
<Tabs
  tabs={[{ key: 'quotation', label: 'Quotation' }, { key: 'tnc', label: 'Terms & Conditions' }]}
  active={activeTab}
  onChange={(k) => setActiveTab(k as 'quotation' | 'tnc')}
/>
```

- [ ] **Step 2: Reskin the page chrome**

Outer wrapper → `bg-slate-50 min-h-screen` (drop the blue gradient). Top bar: keep `navigate(-1)`, restyle to a white sticky bar with a bordered icon button (`ArrowLeft`), the "Campaign package detail" eyebrow, and `campaign.title`. Header card → `<Card className="p-6 sm:p-8">` with `selectedCampaignPackage?.name` (text-2xl font-bold) + description. Use `max-w-3xl mx-auto` for the document column.

- [ ] **Step 3: Reskin the Payment Summary block**

Keep all three `selectedProgram` branches and the exact numeric expressions. Restyle the wrapper to `<Card className="p-6">`: payment-method label → `<Pill tone="brand"><CreditCard className="h-4 w-4" /> {Reno Subscription | RenoNow PayLater | Full Payment}</Pill>`; the plan `<select>` (kept exactly, same `value`/`onChange`/`disabled`) restyled with `rounded-lg border-slate-200 text-sm`; the big price → `text-campaign` (migrate the existing `text-[#d71e42]` to `text-campaign`); keep the "(Terms & Conditions)" button that calls `setActiveTab('tnc')`, restyled as a crimson text link with the `InformationCircleIcon`.

- [ ] **Step 4: Reskin the pricing breakdown**

Wrap in `<Card>` with `divide-y divide-slate-100` rows. Discount block kept (teal) — render inside a `bg-teal-50/50` sub-section using the existing `bonus.description.split('\n')` map and `Number(bonus.value)` total in `text-teal-700`. Keep the exact conditional rows: Total Quotation Amount, Payment Terms, and the `is_progressive_payment || is_be_powered || is_rnpl`-gated Initial Down Payment / Balance Payment rows (with the "Pay in {tenure} mths" / "Pay through RPM" notes). Only restyle labels (`text-slate-500`) and values (`text-slate-900 font-semibold`).

- [ ] **Step 5: Reskin the package accordions with `AccordionItem`**

Keep the IIFE that splits `regularPackages` / `addonPackages` and the `renderPackage(pkg, isAddon)` function, including `expandedPackageIds`/`togglePackage` and the `products` filter (`p.pivot?.visibility == true`). Re-implement `renderPackage` to return an `<AccordionItem open={!!expandedPackageIds[pkgId]} onToggle={() => togglePackage(pkgId)} headerClassName="bg-slate-50/70 hover:bg-slate-100" header={<div><p class names…>{pkg.name}</p><p>{products.length} item(s)</p></div>}>`; inside, keep the product `<table>` (Item / Qty) but restyle headers to `text-slate-400 text-xs uppercase` and rows to `divide-y divide-slate-50`. For add-ons, wrap with the "OPTIONAL ADD-ON PACKAGES" section but **redesign off blue**: section heading with an `Award` chip in `bg-campaign-50 text-campaign`; each add-on card `border-slate-200 bg-slate-50/50` with a `<Pill tone="brand">Add-on</Pill>` tag (no `border-blue-600 bg-blue-50`).

- [ ] **Step 6: Reskin the T&C tab into a readable document**

Keep the `tnc` JSX content and the `activeTab === 'tnc'` branch. Wrap it so on `lg` it shows a 3-col grid: a sticky left **contents index** (static anchor list of sections 1–8) and the document in `col-span-2` inside `<Card className="p-6 sm:p-7">`. Apply readable typography: headings `text-sm font-bold text-slate-900 mt-6`, body `text-sm text-slate-500 leading-relaxed`. (Index is presentational; do not wire scroll-spy — plain in-page anchors are fine.) On mobile the index is hidden (`hidden lg:block`).

- [ ] **Step 7: Verify (lint + build + visual + behavior)**

Run: `npm run lint && npm run build` → exit 0. Then `npm run dev` and verify both tabs at 375/768/1280 against the mockup. Diff-review the Behavior-preservation checklist — especially that no booking button was added and every `useMemo`/conditional is intact.

- [ ] **Step 8: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(campaign): reskin package detail (quotation + readable T&C)"
```

---

### Task 5: Reskin `FAQPage.tsx`

**Files:**
- Modify: `src/pages/CampaignPages/FAQPage.tsx`

**Behavior-preservation checklist:** `faqData`, `KTAccordion.init()` in `useEffect`, `formatAnswer`, `useParams`, the `data-accordion` / `accordion-item` / `accordion-toggle` / `accordion-content` attributes, the `data-accordion-toggle={#faq_content_N}` + matching `id`s, and the `accordion-active:` variant toggling. Only restyle wrappers and swap the toggle icon to Lucide `Plus`/`Minus`.

- [ ] **Step 1: Replace the file with the reskinned version (logic identical)**

```tsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { KTAccordion } from '../../metronic/core';
import { CampaignHeader } from './components/CampaignHeader';
import { Card } from './components/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  { id: 'management-fee', question: 'Do you charge a management fee?', answer: `No, we don't. At BeLive Management, we believe in keeping things simple and transparent—so we charge 0% management fee and do not take any percentage from your rental income.` },
  { id: 'cleaning-fee', question: 'Is there a cleaning fee?', answer: `Yes, there is a cleaning fee. For homes with 3–5 rooms, it starts from RM299 per month, which includes professional cleaning twice a week (8 times monthly).` },
  { id: 'system-fee', question: 'What is the system fee for?', answer: `The system and payment gateway fee starts from RM120 per month for 3–5 room units, supporting smooth daily operations and tenant management.` },
  { id: 'marketing-fee', question: 'Do you charge a marketing fee?', answer: `Yes. We charge a one-time marketing fee equivalent to one (1) month's rent when a tenant is successfully secured. If a tenant runs away, the marketing fee will be pro-rated, and we will refund the remaining balance to you.` },
  { id: 'service-handling', question: 'What do you handle as part of your service?', answer: `We take care of the entire rental journey, from marketing and viewings to tenant care, renewals, and move-outs—so you can stay hands-off.` },
  { id: 'maintenance', question: 'How is maintenance of my unit are being managed?', answer: `Maintenance is fully taken care of for you. We provide 24-hour maintenance support, including emergencies, and manage everything from coordination to urgent repairs.` },
  { id: 'electricity', question: 'What about electricity bills?', answer: `We cover 100% of the electricity cost and handle payment on your behalf—no tracking, no reminders.` },
  { id: 'wifi', question: 'Do you help with WiFi?', answer: `Yes. The WiFi cost is paid by the owner, but we'll handle the setup, registration, and ongoing management for you—so it's one less thing to think about.` },
  { id: 'benefits', question: 'What are other benefits joining BeLive Co-Living?', answer: `We provide Smart Locks and Smart Meters on a lease basis for as long as you are with us—no strings attached—to enhance safety and peace of mind.` },
  { id: 'contract-period', question: 'What is the contract period?', answer: `Our standard contract period is two (2) years, designed to provide stability while allowing enough time for your unit to perform optimally.` },
  { id: 'self-manage', question: 'What if I decide to self-manage myself?', answer: `You may end the service by giving three (3) months' written notice, with no penalty, as long as any outstanding matters have been settled. We believe in giving owners the flexibility to make decisions that best suit their needs.` },
];

const FAQPage = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();

  useEffect(() => {
    KTAccordion.init();
  }, []);

  const formatAnswer = (answer: string) => {
    return answer.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      return (
        <p key={index} className="mb-3 last:mb-0">
          {paragraph.trim().split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line.trim()}
              {lineIndex < paragraph.trim().split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <CampaignHeader title="FAQ" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to={`/campaigns/${campaignSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaign</span>
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Frequently asked questions</h1>
        <p className="text-slate-500 mt-2">Everything about fees, services and contracts.</p>

        <Card className="mt-8 px-5 sm:px-7 py-2">
          <div data-accordion="true">
            {faqData.map((faq, index) => (
              <div
                key={faq.id}
                className="accordion-item [&:not(:last-child)]:border-b border-slate-100"
                data-accordion-item="true"
                id={`faq_item_${index + 1}`}
              >
                <button
                  className="accordion-toggle py-5 w-full text-left flex items-center justify-between gap-4"
                  data-accordion-toggle={`#faq_content_${index + 1}`}
                >
                  <span className="text-base font-semibold text-slate-900">{faq.question}</span>
                  <span className="shrink-0 h-7 w-7 rounded-full grid place-items-center bg-slate-100 text-slate-400 accordion-active:bg-campaign-50 accordion-active:text-campaign">
                    <Plus className="h-4 w-4 accordion-active:hidden block" />
                    <Minus className="h-4 w-4 accordion-active:block hidden" />
                  </span>
                </button>
                <div className="accordion-content hidden" id={`faq_content_${index + 1}`}>
                  <div className="text-slate-500 leading-relaxed pb-5">{formatAnswer(faq.answer)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run build` → exit 0. Then `npm run dev`, open `/campaign/campaigns/<slug>/faq`; click items — confirm KTAccordion still expands/collapses and the Plus↔Minus (crimson) swap works.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CampaignPages/FAQPage.tsx
git commit -m "feat(campaign): reskin FAQ page (keep KTAccordion, crimson accents)"
```

---

### Task 6: Reskin `PaymentSuccess.tsx`

**Files:**
- Modify: `src/pages/CampaignPages/PaymentSuccess.tsx`

**Behavior-preservation checklist:** `paymentData` state, the `useEffect` query parsing + `localStorage.removeItem('data')` + `document.title`, `formatPaymentDate`, `downloadReceipt` (PDF + text fallback), the `if (!paymentData) return <Loading />` guard. Keep the unused `LOCAL_PATH_PREFIX`/`MEDIA_URL` constants only if they were already there and removing them would need wider checks — otherwise delete if eslint flags them as unused (they are module-level `const`; `@typescript-eslint/no-unused-vars` does not flag unused module consts by default, so leaving them is safe).

- [ ] **Step 1: Replace imports + presentational return (logic unchanged)**

Add imports:

```tsx
import { CheckCircle2, Download, Mail } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
```

Keep everything from the top of the file through the end of `downloadReceipt` and the `if (!paymentData) return <Loading />;` guard **unchanged**. Replace only the final `return (...)` JSX with:

```tsx
  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-12 w-auto mb-8" />

      <Card className="w-full max-w-md p-8 text-center">
        <span className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-5">Payment successful</h1>
        <p className="text-slate-500 mt-2">Your payment has been processed. A confirmation email has been sent to your registered address.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left text-sm">
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Booking number</span><span className="font-semibold text-slate-900">{paymentData.bookingNumber || 'N/A'}</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">TXN ID</span><span className="font-semibold text-slate-900">{paymentData.txnId || 'N/A'}</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Customer name</span><span className="font-semibold text-slate-900">{paymentData.name || 'N/A'}</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Amount paid</span><span className="font-bold text-emerald-600">RM {paymentData.amount ? Number(paymentData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Payment date</span><span className="font-semibold text-slate-900">{formatPaymentDate(paymentData.paymentDate)}</span></div>
        </div>

        <Button fullWidth size="lg" className="mt-6" onClick={downloadReceipt}>
          <Download className="h-4 w-4" /> Download PDF receipt
        </Button>
      </Card>

      <a href="mailto:sales@renoxpert.my" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-campaign hover:text-campaign-600">
        <Mail className="h-4 w-4" /> Email support
      </a>
    </div>
  );
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run build` → exit 0. Then `npm run dev`, open `/campaign/campaigns/<slug>/booking/payment/success?ref=x&amount=1000&name=Test&bookingNumber=RX-1&paymentDate=20260620120000&txnId=T1`; confirm the card renders and **Download PDF receipt** still produces a PDF.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CampaignPages/PaymentSuccess.tsx
git commit -m "feat(campaign): reskin payment success page"
```

---

### Task 7: Reskin `PaymentError.tsx`

**Files:**
- Modify: `src/pages/CampaignPages/PaymentError.tsx`

**Behavior-preservation checklist:** `errorData` state, the `useEffect` parsing + `localStorage.removeItem('errorData')` + `document.title`, `handleBackToOrigin` (uses `errorData.originateUrl` else `navigate(-1)`), the `if (!errorData) return <Loading />` guard. Keep displaying `errorData.ref`/`errorData.code` (preserve existing behavior even though they render N/A).

- [ ] **Step 1: Replace imports + presentational return (logic unchanged)**

Add imports:

```tsx
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
```

Keep the file from the top through `handleBackToOrigin` and the `if (!errorData) return <Loading />;` guard **unchanged**. Replace only the final `return (...)` JSX with:

```tsx
  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-12 w-auto mb-8" />

      <Card className="w-full max-w-md p-8 text-center">
        <span className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 grid place-items-center mx-auto">
          <XCircle className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-5">Payment didn’t go through</h1>
        <p className="text-slate-500 mt-2">No charge was made. You can try again or contact support if the problem persists.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left text-sm">
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Reference no</span><span className="font-semibold text-slate-900">{errorData.ref || 'N/A'}</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-slate-500">Code</span><span className="font-semibold text-slate-900">{errorData.code || 'N/A'}</span></div>
        </div>

        <Button fullWidth size="lg" className="mt-6" onClick={handleBackToOrigin}>
          <ArrowLeft className="h-4 w-4" /> Try again
        </Button>
      </Card>
    </div>
  );
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run build` → exit 0. Then `npm run dev`, open `/campaign/campaigns/<slug>/booking/payment/error?originateUrl=/campaign/campaigns/<slug>`; confirm "Try again" navigates via `handleBackToOrigin`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CampaignPages/PaymentError.tsx
git commit -m "feat(campaign): reskin payment error page"
```

---

### Task 8: ReceiptPDF light touch (accent color)

**Files:**
- Modify: `src/pages/CampaignPages/ReceiptPDF.tsx`

**Behavior-preservation checklist:** Document/Page structure, all `paymentData` bindings, `formatPaymentDate`, the logo `Image` `src` (`MEDIA_URL + "app/RenoExpert_logo-01.jpg"`). Keep the **green** "Amount Paid" (`amountRow`/`amountLabel`/`amountValue`) and "PAYMENT SUCCESSFUL" status block — green is the conventional success semantic on a receipt. Only the brand title accent changes.

- [ ] **Step 1: Change the title color to crimson**

In `styles.title`, change `color: '#059669'` to `color: '#D71E42'`:

```ts
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D71E42',
    textAlign: 'center',
    marginBottom: 30,
  },
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run build` → exit 0. Then via the Payment Success page (Task 6 verify URL), click **Download PDF receipt** and confirm the PDF opens with a crimson "PAYMENT RECEIPT" title and the logo intact.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CampaignPages/ReceiptPDF.tsx
git commit -m "feat(campaign): crimson accent on PDF receipt title"
```

---

### Task 9: Full-suite verification & cleanup

**Files:** none (verification only)

- [ ] **Step 1: Lint + build the whole project**

Run: `npm run lint && npm run build`
Expected: exit 0 (no warnings, build succeeds).

- [ ] **Step 2: Manual QA matrix**

With `npm run dev`, at viewport widths **375, 768, 1280**, verify each page against the mockup board and confirm no console errors:
- Landing: hero, packages (selected / most-popular / slots-left / fully-booked badge), booking form, desktop sticky card, mobile sticky bottom bar, loading state, error state, fully-booked state, single-campaign (no packages) state.
- Package detail: Quotation tab (payment summary for each `selectedProgram` available in your data, breakdown, package accordion expand/collapse, add-ons) and T&C tab (index + readable doc); no booking button present.
- FAQ: accordion expand/collapse + crimson Plus/Minus.
- Payment success / error: layout + actions; PDF downloads.

- [ ] **Step 3: Behavior smoke (in an environment with the API)**

Confirm: select package → fill form → submit reaches the payment redirect; `fully_redeemed` path still toasts and updates slots; quotation tabs/expanders/plan selector still function; FAQ toggles; receipt downloads.

- [ ] **Step 4: Stop the brainstorm companion server (optional cleanup)**

```bash
bash /home/ubuntu/.claude/plugins/cache/claude-plugins-official/superpowers/6.0.3/skills/brainstorming/scripts/stop-server.sh /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1/.superpowers/brainstorm/2321496-1781880965
```

- [ ] **Step 5: Finalize the branch**

The work lives on `redesign/campaign-pages`. Use the `superpowers:finishing-a-development-branch` skill to decide merge/PR. (No commit needed in this task unless QA surfaced fixes — if it did, fix in the relevant page file, re-run Step 1–2, and commit.)

---

## Self-Review

**Spec coverage:**
- §4.1 color token → Task 1. §4.2 fonts → Task 1 (Inter 700/800). §4.4 primitives (Button/Card/Field/Pill/Tabs/Accordion/Header) → Task 2. §5 responsive + single tree + sticky bar → Task 3 (Steps 3, 7). §6.1 landing → Task 3. §6.2 package detail + add-on redesign + T&C → Task 4. §6.3 FAQ → Task 5. §6.4 success → Task 6. §6.5 error → Task 7. §6.6 ReceiptPDF → Task 8. §9 a11y → Field text-base + focus rings (Task 2), logo alt (CampaignHeader), aria-hidden icons. §12 verification → per-task gates + Task 9. All spec sections map to a task.
- §7 "no primitive owns data/form/nav logic" → honored: primitives are presentational; pages keep handlers. ✓

**Placeholder scan:** No TBD/TODO. The two large pages (Tasks 3–4) give complete code for novel blocks + explicit, itemized translation steps + behavior checklists rather than full 900-line listings — intentional, with the mockup board as pixel reference. Small pages (5–7) and the token/primitives are fully literal.

**Type consistency:** `buttonClasses(opts)` signature matches its use in `Button` and in `<Link className={buttonClasses({...})}>` (Tasks 3, 5). `Tabs` `onChange` is `(key: string) => void`; Task 4 casts `k as 'quotation' | 'tnc'` to match `setActiveTab`. `Field` spreads native input props (type/name/value/onChange/required/pattern/maxLength/inputMode/placeholder) used in Task 3. `AccordionItem` props (`open/onToggle/header/children/headerClassName`) match Task 4 usage. `Pill` `tone` union (`brand|emerald|slate|red|teal`) covers all usages. ✓
