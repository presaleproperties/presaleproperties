
# Off-Market VIP Ecosystem — Complete Build Plan

## Current State (Audit)

### What the Deck page (`/deck/:slug`) has that Off-Market Detail (`/off-market/:slug`) is MISSING:
1. **Deposit Timeline Section** — Interactive calculator showing deposit schedule with unit selector
2. **Investment Projections/Calculator** — Full ROI calculator with mortgage, appreciation, rental yield, PTT/GST
3. **FAQ Section** — Common presale questions
4. **Scarcity Banner** — "Only X units remaining" urgency banner
5. **Key Facts Bar** — Assignment fee + included items bar
6. **Floor Plans PDF viewer** — PDF embed for full floor plan booklet
7. **Location Map** — Interactive map with proximity highlights
8. **Price Gate** — Inline price gating (not needed for VIP — they're already authenticated)

### What's working on Off-Market Detail:
- Hero section (reuses DeckHeroSection ✅)
- About section (reuses DeckAboutSection ✅)
- Unit cards grid (custom OffMarketUnitsSection ✅)
- Gallery (reuses DeckGallerySection ✅)
- Incentives section ✅
- Documents section ✅
- Floor Plan Modal (reuses FloorPlanModal ✅)
- Contact section (reuses DeckContactSection ✅)
- Sticky nav ✅

### What's missing from the VIP ecosystem:
- **VIP Portal Dashboard** — After login, no dashboard to browse/search projects
- **"I'm Interested" button** — No way for VIP users to express interest in specific units
- **Interest notification system** — No notifications when buyers express interest
- **Proper VIP navigation** — No sidebar/header for authenticated VIP users

---

## Implementation Plan

### Phase 1: Off-Market Detail Page → 100% Deck Parity
Add the missing sections to `OffMarketDetailPage.tsx`:

1. **Add Deposit Timeline Section** — Reuse `DeckDepositTimelineSection` with off-market listing deposit data
2. **Add Investment Calculator** — Reuse `DeckProjectionsSection` with off-market unit pricing
3. **Add FAQ Section** — Reuse `DeckFAQSection`
4. **Add Location Map** — Reuse `DeckLocationSection` with project lat/lng
5. **Add Scarcity Banner** — Reuse `DeckScarcityBanner` with available_units count

### Phase 2: "I'm Interested" Feature
1. **Database**: Create `off_market_inquiries` table (user_id, listing_id, unit_id, status, message)
2. **"I'm Interested" button** in FloorPlanModal and unit cards for VIP users
3. **Notification trigger** — Auto-insert into `notifications_queue` when inquiry is created
4. **Admin view** — Show inquiries in admin off-market section

### Phase 3: VIP Portal Dashboard
1. **VIP Dashboard page** (`/vip`) — Post-login landing with:
   - Welcome header with user name
   - Search + filter for off-market projects
   - Project cards grid (click → project detail)
   - "My Inquiries" section showing units they expressed interest in
   - Quick stats (available projects, units, saved items)
2. **Update VipLoginPage** — Redirect to `/vip` after login instead of `/off-market`
3. **VIP header/nav** — Simple top bar with logo, search, profile menu

### Phase 4: Mind Map Report
- Generate a Mermaid diagram showing the complete ecosystem architecture

---

## Files to Create/Modify

### New Files:
- `src/pages/VipDashboard.tsx` — VIP portal dashboard
- `src/components/vip/VipHeader.tsx` — VIP portal navigation
- `src/components/vip/VipProjectCard.tsx` — Project card for VIP dashboard
- `src/components/vip/VipInquiryButton.tsx` — "I'm Interested" CTA component

### Modified Files:
- `src/pages/OffMarketDetailPage.tsx` — Add deposit timeline, calculator, FAQ, location, scarcity
- `src/components/decks/FloorPlanModal.tsx` — Add "I'm Interested" button for VIP context
- `src/pages/VipLoginPage.tsx` — Redirect to VIP dashboard
- `src/App.tsx` — Add `/vip` route

### Database:
- New `off_market_inquiries` table with RLS + notification trigger
