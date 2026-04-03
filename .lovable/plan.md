
# Fix Plan — Full Site Audit Issues

## Phase 1: Critical Bug Fixes ⚡
**Estimated: 3-4 sessions**

### 1.1 Fix `form_type` on all lead inserts (BUG-1, BUG-8)
- Update `useLeadSubmission` to accept and **insert** `form_type` on the initial `project_leads` insert (not just on update)
- Add `form_type` values to every form: `"project_sidebar"`, `"mobile_cta"`, `"access_pack"`, `"exit_intent"`, `"calculator_roi"`, `"calculator_mortgage"`, `"lead_magnet"`, `"contact"`, `"deck_gate"`
- Backfill existing 101 leads where possible

### 1.2 Fix lead scoring (BUG-2)
- Debug `collectTrackingData()` — verify localStorage/sessionStorage keys are being written and read correctly
- Ensure tracking data accumulates across page views before scoring runs
- Add fallback defaults so scores are never 0

### 1.3 Migrate orphaned forms to `useLeadSubmission` (BUG-3)
- **CalculatorLeadCapture** — replace direct Supabase insert with `useLeadSubmission`
- **Contact page** — same migration
- **LeadMagnets (4 variants)** — same migration
- This ensures all leads get: tracking data, lead scoring, Zapier/CRM sync, Meta CAPI

### 1.4 Fix MLS listing 404s (BUG-5)
- Verify `PropertiesSlugDispatcher` routing for listing_key URLs
- Test edge cases (special characters in listing keys, encoded URLs)

---

## Phase 2: UX & Conversion Optimization 🎯
**Estimated: 2-3 sessions**

### 2.1 Add `show_in_hero` admin toggle (BUG-6)
- Add `show_in_hero` boolean column to `presale_projects`
- Update `HeroProjectSlider` to prefer flagged projects, fallback to view_count
- Add toggle in admin project editor

### 2.2 Form completion rate investigation (BUG-9)
- Audit form UX — field count, validation timing, mobile layout
- Consider progressive disclosure or multi-step forms

### 2.3 Performance — lazy loading (BUG-4)
- Lazy-load `MapSearch`, `PresaleProjectDetail`, `ResaleListings`, `Index` and other heavy pages
- Add loading skeletons

### 2.4 Shared `useAppSettings` hook (BUG-16)
- Create one hook for WhatsApp number + other `app_settings` queries
- Replace individual queries across components

---

## Phase 3: Data & Architecture Cleanup 🧹
**Estimated: 2 sessions**

### 3.1 Stop duplicate data inserts (BUG-10)
- Remove double-inserts into both `newsletter_subscribers` and `project_leads`

### 3.2 Consolidate edge functions (BUG-13, BUG-19)
- Map overlapping functions, deprecate duplicates

### 3.3 `client_activity` archiving strategy (BUG-20)
- Add date-based partitioning or scheduled cleanup for 79K+ rows

### 3.4 Newsletter subscriber RLS check (BUG-7)
- Verify insert policy allows anonymous inserts
- Test the flow end-to-end

### 3.5 Fix undefined URL leaks (BUG-14)
- Find where undefined values get into property URLs, add guards

---

## Phase 4: Mobile & Responsive Audit 📱
**Estimated: 1-2 sessions**

### 4.1 Forms on mobile (375px–414px)
### 4.2 Map search on tablet
### 4.3 iPhone safe-area insets for bottom sheets
### 4.4 Pitch deck mobile layout

---

## Phase 5: SEO & Growth 🔍
**Estimated: 1-2 sessions**

### 5.1 Meta tags + JSON-LD for all dynamic pages
### 5.2 Sitemap generation for 118 presale + city pages
### 5.3 Schema.org RealEstateListing structured data
### 5.4 Rate limit log cleanup scheduling (BUG-21)
### 5.5 Blog image generation fix (BUG-22)

---

## Priority Order
Start with **Phase 1** (critical data integrity bugs), then **Phase 2** (conversion impact), then **3→4→5**.

**Which phases or specific items would you like me to start on?**
