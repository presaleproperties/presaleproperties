
## How This Will Work — Strategy Explanation

**Recommended approach: Soft gate on Floor Plans, Pricing & Projections**

Show the hero, about section, and gallery freely (social proof + hook). Gate the high-value sections — floor plans with pricing, deposit timeline, and the investment calculator — behind the lead form. This is standard practice for presale lead magnets and maximises conversion.

**Why not gate the entire deck?**
- Google and social crawlers need open access to the hero for link previews (already set up)
- Showing the building, gallery, and location builds trust before asking for contact info
- People who fill the form are warmer leads with real intent

---

## How "Fill Once" Works

**The challenge:** You cannot reliably track users by IP address alone on the front-end (browsers don't expose IPs). Instead, the plan uses a combination of:

1. **localStorage key** (primary) — after form submit, write `deck_unlocked_[slug]` to localStorage. On next visit, same browser = instant access.
2. **Visitor ID cookie** (secondary) — the site already generates a `pp_vid` persistent cookie/localStorage ID per visitor. We check this against submitted leads in the database on page load.

**Trade-offs to be aware of:**
- Clearing browser data = form appears again (very rare in practice, acceptable)
- Different device = form appears again (actually good — captures the lead on that device too)
- Incognito = form appears again (also good — different session)
- IP blocking is not reliable (shared IPs, VPNs, mobile networks)

This approach matches how Netflix, HubSpot, and every major presale site handles it.

---

## Technical Plan

### 1. New component: `DeckLeadGate`

A full-screen overlay modal using the existing `usePresaleLeadCapture` hook. Collects name, phone, email in a single clean step (no email-first two-step — simpler for a social lead magnet). Tags the lead with:
- `lead_source: "pitch_deck"`
- `project_name` from the deck
- `project_id` from the deck (if linked)
- A message field: `"Pitch Deck: [project_name]"`

### 2. Unlock logic in `DeckPublicPage`

On mount:
1. Check `localStorage.getItem("deck_unlocked_" + slug)` → if exists, skip gate
2. Check if `pp_vid` visitor ID has already submitted a lead for this deck (query `project_leads` where `visitor_id = X AND message LIKE 'Pitch Deck:%'`) → if found, skip gate and write localStorage

State: `isUnlocked: boolean`

### 3. Gated sections

Replace the real content of these sections with a blur/lock overlay when `!isUnlocked`:
- Floor Plans section (prices visible but blurred, lock icon)
- Deposit Timeline
- Investment Calculator

### 4. Lead form UI

Clean single-step modal overlay (not a two-step like the existing form). Fields:
- Full Name (required)
- Phone (required)
- Email (required)
- "I'm a Realtor" checkbox (optional)
- Submit button: "Unlock Full Details →"

On success → write localStorage → `isUnlocked = true` → sections animate in.

### 5. Backend tagging

Reuses the existing `project_leads` table. The `message` field will be `"Pitch Deck: [project_name]"` and `lead_source` will be `"floor_plan_request"` (already mapped to `ZAPIER_PROJECT_LEADS_WEBHOOK`). This ensures it flows through to Lofty CRM automatically.

---

## Files to Create/Edit

```text
NEW   src/components/decks/DeckLeadGate.tsx        — gate overlay modal component
EDIT  src/pages/DeckPublicPage.tsx                  — unlock state, check localStorage/visitor_id, pass isUnlocked to sections
EDIT  src/components/decks/DeckFloorPlansSection.tsx — blur overlay when locked
EDIT  src/components/decks/DeckDepositTimelineSection.tsx — blur overlay when locked
EDIT  src/components/decks/DeckProjectionsSection.tsx    — blur overlay when locked
```

No database changes needed — uses the existing `project_leads` table and existing RLS.

---

## What It Will Look Like

- Hero, About, Gallery, Location → always visible (social proof)
- Floor Plans section → visible but blurred with a lock card: "Unlock Floor Plans & Pricing — Enter your details for instant access"
- Deposit & Calculator → same blur treatment
- On form submit → smooth fade-in unlock of all sections
- Revisit same browser → no gate, full access immediately
