
# Agent Hub Redesign — Command Centre

## Problem
The current overview is just the onboard form + a small deck list. To review leads, send emails, or manage decks, you jump between 3+ pages. Too much friction for a daily driver.

## New Layout — Single-Page Command Centre

The overview becomes a **3-panel layout** (stacks vertically on mobile):

### Panel 1: Quick Onboard (Left/Top)
- The onboard form stays front and center — but **streamlined to a compact card**
- Inline deck selector (dropdown instead of grid to save space)
- After submit: success toast + "Send Email" button appears inline — no separate success screen blocking the view

### Panel 2: Recent Leads (Center)
- Shows your last 10 onboarded leads as a **compact list** (name, source badge, deck name, date)
- Each lead row has **one-tap actions**: 📧 Send Deck Email, 📋 Copy Deck Link, 🔗 Open Deck
- Expandable row to show notes/phone
- No tabs, no page navigation — everything visible at once

### Panel 3: Your Decks (Right/Bottom)
- All published decks as compact cards with:
  - **Copy link** (one tap)
  - **Open** in new tab
  - **Edit** → goes to deck builder
- "Create New Deck" button at top

### Sidebar Simplification
- Remove "Onboard Client" (it's now in the overview)
- Keep: Overview, Pitch Decks, Leads, Listings, Documents, Messages, Billing, Profile
- Reorder to match priority

## What Changes

| File | Action |
|------|--------|
| `src/pages/dashboard/DashboardOverview.tsx` | **Rewrite** — New 3-panel command centre |
| `src/components/dashboard/DashboardLayout.tsx` | **Edit** — Remove "Onboard Client" nav item, reorder items |
| `src/components/leads/LeadOnboardHub.tsx` | **No change** — Reuse as-is inside overview |

## What Stays the Same
- LeadOnboardHub component (reused)
- DashboardLeads page (still accessible for detailed view)
- DashboardDecks page (still accessible for full management)
- All edge functions unchanged
