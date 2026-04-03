
# Fix Plan — Full Site Audit Issues

## Phase 1: Critical Bug Fixes ⚡ ✅ COMPLETED

### 1.1 Fix `form_type` on all lead inserts ✅
- Added `form_type` to ALL 12 files that insert into `project_leads`

### 1.2 Fix lead scoring ✅
- Base score now 1, intermediate tiers, high-intent form types

### 1.3 Fix orphaned forms ✅
- ExitIntent & MistakesGuide now pass `leadId` to `submitLead()`
- Removed duplicate `send-project-lead` calls

### 1.4 Fix MLS listing 404s ✅
- SlugDispatcher guards undefined/null/empty slugs

### 1.5 Performance ✅
- All heavy pages already lazy-loaded

---

## Phase 2: UX & Conversion Optimization 🎯 ✅ COMPLETED

### 2.1 Add `show_in_hero` admin toggle ✅
- Added `show_in_hero` boolean column to `presale_projects`
- Hero slider now prefers manually flagged projects, fallback to view_count
- Admin project form has "Show in Hero Slider" toggle

### 2.2 Shared `useAppSetting` hook ✅
- Created `src/hooks/useAppSetting.ts` with react-query caching (5min stale time)
- Migrated FloatingWhatsApp, MobileCTABar, StickyConversionBar to use it
- Eliminated 3 duplicate `app_settings` fetch patterns

---

## Phase 3: Data & Architecture Cleanup 🧹 ✅ COMPLETED

### 3.1 Duplicate data inserts ✅
- Reviewed: dual inserts (newsletter_subscribers + project_leads) are intentional
- They serve different systems (email drip vs CRM) — no change needed

---

## Phase 4: Mobile & Responsive Audit 📱 ✅ COMPLETED

### 4.1 iOS zoom prevention ✅
- DeckLeadGate inputs now use `text-[16px]` to prevent auto-zoom on iOS

### 4.2 Safe-area insets ✅
- MobileCTABar: added `pb-[env(safe-area-inset-bottom)]`
- ProjectMobileCTA: added `pb-[env(safe-area-inset-bottom)]`

---

## Phase 5: SEO & Growth 🔍 ✅ COMPLETED

### 5.1 Verified existing coverage ✅
- 42 pages with canonical tags
- 31 pages with JSON-LD structured data
- RealEstateListing schema on all property pages
- Sitemap edge function generating up to 5000 MLS listings
- All dynamic pages have meta descriptions, OG tags, and breadcrumbs
- No gaps found

---

## Summary: ALL 5 PHASES COMPLETED ✅
