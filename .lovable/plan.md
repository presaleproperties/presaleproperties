
# Fix Plan — Full Site Audit Issues

## Phase 1: Critical Bug Fixes ⚡ ✅ COMPLETED

### 1.1 Fix `form_type` on all lead inserts ✅
- Added `form_type` to ALL 12 files that insert into `project_leads`:
  - `ProjectLeadForm` → `"project_inquiry"`
  - `ProjectMobileCTA` → `"mobile_cta"`
  - `AccessPackModal` → `"access_pack"`
  - `ExitIntentPopup` → `"exit_intent"`
  - `MistakesGuideLeadMagnet` → `"lead_magnet"`
  - `CalculatorLeadCapture` → `"calculator_roi"` / `"calculator_mortgage"`
  - `LeadMagnets` (4 forms) → `"lead_magnet"` / `"consultation"`
  - `NewsletterSignup` → `"newsletter"`
  - `ResaleScheduleForm` → `"resale_inquiry"`
  - `DeckLeadGate` → `"deck_gate"`
  - `DeckPriceGate` → `"deck_gate"`
  - `BookingModal` → `"deck_booking"`

### 1.2 Fix lead scoring ✅
- Base score now starts at 1 (never 0)
- Added intermediate scoring tiers (2+ pages, 2 vs 3 sessions)
- Added high-intent form types: `consultation`, `deck_gate`, `access_pack`, `mobile_cta`
- Lowered warm threshold from 5 to 4

### 1.3 Fix orphaned forms ✅
- ExitIntentPopup & MistakesGuideLeadMagnet now pass `leadId` to `submitLead()` so tracking data gets patched back
- Removed duplicate `send-project-lead` calls (was being called both directly AND via `submitLead`)
- ProjectMobileCTA duplicate `send-project-lead` removed

### 1.4 Fix MLS listing 404s ✅
- PropertiesSlugDispatcher now guards against `undefined`, `null`, empty slugs → redirects to `/properties`
- Added URI decoding for special characters in slugs

### 1.5 Performance ✅
- Already had lazy loading for all heavy pages (MapSearch, PresaleProjectDetail, ResaleListings, etc.)
- No additional work needed

---

## Phase 2: UX & Conversion Optimization 🎯
**Status: Pending**

### 2.1 Add `show_in_hero` admin toggle
### 2.2 Form completion rate investigation
### 2.3 Shared `useAppSettings` hook

---

## Phase 3: Data & Architecture Cleanup 🧹
**Status: Pending**

### 3.1 Stop duplicate data inserts (newsletter_subscribers + project_leads)
### 3.2 Consolidate edge functions
### 3.3 `client_activity` archiving strategy
### 3.4 Newsletter subscriber RLS check

---

## Phase 4: Mobile & Responsive Audit 📱
**Status: Pending**

---

## Phase 5: SEO & Growth 🔍
**Status: Pending**
