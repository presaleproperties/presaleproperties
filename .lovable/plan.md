
## Presale Project Pitch Deck Page Builder

### What we're building
A full-stack pitch deck tool with:
1. A **database migration** for a `pitch_decks` table
2. A **dashboard decks list** page (`/dashboard/decks`)
3. A **deck builder form** (`/dashboard/decks/new` and `/dashboard/decks/:id/edit`)
4. A **public deck viewer** (`/deck/[slug]`) — 6-section scrollable pitch page

---

### Database (1 migration)

New table: `pitch_decks`

```text
id                   uuid  PK
user_id              uuid  (FK → auth.users)
slug                 text  UNIQUE
project_name         text
tagline              text
city                 text
address              text
developer_name       text
stories              int
total_units          int
completion_year      text
hero_image_url       text
floor_plans          jsonb   (array of unit objects)
gallery              jsonb   (array of photo URLs, ordered)
proximity_highlights jsonb   (array of {icon, label, distance})
projections          jsonb   (rental_min, rental_max, cap_rate_min, cap_rate_max, appreciation[5])
contact_name         text
contact_phone        text
contact_email        text
contact_whatsapp     text
is_published         boolean DEFAULT false
created_at           timestamptz
updated_at           timestamptz
```

RLS:
- `SELECT` — anyone where `is_published = true` OR `user_id = auth.uid()`
- `INSERT/UPDATE/DELETE` — `user_id = auth.uid()`

Storage: use existing `listing-files` bucket (already public) with path prefix `pitch-decks/`

---

### Files to create

**New pages:**
- `src/pages/dashboard/DashboardDecks.tsx` — deck list with table, create button, view/edit/delete actions
- `src/pages/dashboard/DashboardDeckBuilder.tsx` — multi-section form (new + edit)
- `src/pages/DeckPublicPage.tsx` — public `/deck/[slug]` viewer

**New components:**
- `src/components/decks/DeckHeroSection.tsx`
- `src/components/decks/DeckFloorPlansSection.tsx`
- `src/components/decks/DeckGallerySection.tsx`
- `src/components/decks/DeckLocationSection.tsx`
- `src/components/decks/DeckProjectionsSection.tsx`
- `src/components/decks/DeckContactSection.tsx`
- `src/components/decks/DeckStickyNav.tsx`
- `src/components/decks/FloorPlanModal.tsx`
- `src/components/decks/GalleryLightbox.tsx`
- `src/components/decks/BookingModal.tsx`
- `src/components/decks/MortgageCalculator.tsx` (client-side only)

**Files to modify:**
- `src/App.tsx` — add 4 routes:
  - `/dashboard/decks` → `DashboardDecks` (ProtectedRoute)
  - `/dashboard/decks/new` → `DashboardDeckBuilder` (ProtectedRoute)
  - `/dashboard/decks/:id/edit` → `DashboardDeckBuilder` (ProtectedRoute)
  - `/deck/:slug` → `DeckPublicPage` (public, before the `/:cityProductSlug` catch-all)
- `src/components/dashboard/DashboardLayout.tsx` — add "Pitch Decks" nav item

---

### Implementation detail per component

**DashboardDecks.tsx**
- Uses `DashboardLayout` (existing)
- Fetches `pitch_decks` where `user_id = auth.uid()`
- Table rows: project name, city, status badge (Draft/Published), date, share URL copy button, Edit/Delete actions via `DropdownMenu`
- "+ Create New Deck" button → navigate to `/dashboard/decks/new`

**DashboardDeckBuilder.tsx**
- Uses `DashboardLayout`
- Accordion/card-based sections for each data group
- Project Info, Hero Image upload, Floor Plans (fieldArray), Gallery (multi-upload), Location, Projections, Contact Override, Slug + Publish toggle
- Slug auto-generated from project name via `toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`
- Uniqueness check on slug blur via Supabase query
- File uploads → `supabase.storage.from("listing-files").upload(path, file)` with prefix `pitch-decks/{userId}/`
- Gallery: drag-to-reorder via simple index-shift buttons (up/down arrows) — no external DnD dependency needed
- Floor plan repeater: up to 6 entries, each with unit type dropdown, size, price, tags, optional image upload
- On save: upsert to `pitch_decks`, then redirect to deck list

**DeckPublicPage.tsx**
- Fetches deck by `slug` where `is_published = true`
- 404 redirect if not found
- Meta tags: generic `<title>Presale Project | Presale Properties</title>` (no project name exposed)
- Renders sections 1–6 with `IntersectionObserver` fade-up animation via inline CSS class toggling
- Sticky nav appears after hero scrolled past (using `useEffect` + scroll listener)

**Section implementations:**

_Section 1 — Hero_: `position: fixed` background image with `bg-cover bg-center`, dark gradient overlay (`bg-gradient-to-t from-black/90 via-black/40 to-transparent`), project name in `text-5xl md:text-7xl font-bold`, stats pills row, two CTA buttons using existing `Button` variants, animated chevron-down bounce

_Section 2 — Floor Plans_: 2-col mobile / 4-col desktop grid, unit cards using `Card` component + hover lift, feature tag `Badge` pills, click opens `FloorPlanModal` (Dialog-based, full-screen image if available)

_Section 3 — Gallery_: CSS grid masonry — first photo `col-span-2 row-span-2`, rest `col-span-1`. Click opens `GalleryLightbox` with prev/next via arrow keys + click

_Section 4 — Location_: Two-column layout. Left: Leaflet map using `CartoDB Dark Matter` tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`) centered on address (geocode on deck save). Right: proximity highlights list. Uses existing Leaflet pattern from `ResaleListingMiniMap.tsx`.

_Section 5 — Projections_: 4 stat cards at top. Left column: `MortgageCalculator` component with Slider (existing `Slider` component), range inputs, real-time calculation `M = P[r(1+r)^n]/[(1+r)^n-1]`. Right column: bar chart using Recharts `BarChart` (already installed — used in `AdminAIAnalytics.tsx`) for years 1–5 appreciation + rental yield table.

_Section 6 — Contact_: Centered section, agent avatar circle with initials, phone/email links, two CTA buttons: "Book a Private Showing" opens `BookingModal` (name/phone/email form → inserts to existing `bookings` or `project_leads` table), "WhatsApp" opens `https://wa.me/{number}`.

**DeckStickyNav**: `position: fixed top-0`, `backdrop-blur-md bg-background/90`, appears via `useState(showNav)` toggled at scroll Y > 100vh, section links scroll via `document.getElementById` + `scrollIntoView`

---

### Branding consistency
- All headings: site font (`Plus Jakarta Sans`, already loaded globally)
- Section labels: `text-primary text-sm font-semibold uppercase tracking-widest`
- Section watermark numerals: `absolute text-[200px] font-black text-foreground/[0.03] select-none pointer-events-none`
- Accent rule between sections: `border-t border-primary/20`
- Cards: use existing `Card` component (already has hover shadow from `shadow-card hover:shadow-card-hover`)
- Buttons: use existing `Button` variants (`default` = gold, `outline`)
- Colors: `text-primary` for accent, `bg-background` / `bg-muted` for alternating sections

---

### Routes added to App.tsx
```text
/deck/:slug             → DeckPublicPage (public, lazy, placed BEFORE /:cityProductSlug)
/dashboard/decks        → ProtectedRoute > DashboardDecks (lazy)
/dashboard/decks/new    → ProtectedRoute > DashboardDeckBuilder (lazy)
/dashboard/decks/:id/edit → ProtectedRoute > DashboardDeckBuilder (lazy)
```

### DashboardLayout nav item added
```text
{ label: "Pitch Decks", href: "/dashboard/decks", icon: Presentation, description: "Shareable investor decks" }
```

---

### Scope of work — file count
- 1 DB migration
- 3 new pages (DashboardDecks, DashboardDeckBuilder, DeckPublicPage)
- 9 new components under `src/components/decks/`
- 2 modified files (App.tsx, DashboardLayout.tsx)

This is a large build. The deck builder form (DashboardDeckBuilder.tsx) is the most complex file, with ~600–800 lines handling all upload logic, field arrays, and slug validation.
