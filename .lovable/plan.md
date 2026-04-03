

# Lead Onboarding Hub — Plan

## What It Does

A single-screen workflow to onboard a new client in 3 steps:
1. **Enter lead info** — name, phone, email, source, notes
2. **Pick a pitch deck** to send them
3. **Hit "Save & Send"** — saves the lead to the database, fires Zapier webhook to create the lead in Lofty, and copies/emails the deck link

## Where It Lives

A shared component rendered at **both**:
- `/dashboard/lead-onboard` (Agent Portal)
- `/admin/lead-onboard` (Admin Portal)

## UI Layout (Mobile + Desktop Friendly)

```text
┌─────────────────────────────────────────┐
│  Onboard New Client                     │
├─────────────────────────────────────────┤
│  [First Name]  [Last Name]              │
│  [Email]       [Phone]                  │
│  [Source ▾]    [Notes ...]              │
├─────────────────────────────────────────┤
│  Select Pitch Deck                      │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Deck 1│ │Deck 2│ │Deck 3│  ← cards   │
│  └──────┘ └──────┘ └──────┘            │
├─────────────────────────────────────────┤
│  [ Save & Send to Lofty ]              │
│  ✓ Lead saved · Deck link copied        │
└─────────────────────────────────────────┘
```

- Source dropdown: Website, Referral, Social Media, Walk-in, Phone Call, Other
- Deck selector pulls from user's published `pitch_decks`
- On success: shows the full `presaleproperties.com/deck/{slug}` link with a copy button

## Backend

### 1. Database Migration
- New table `onboarded_leads` with columns: `id`, `user_id` (FK auth.users), `first_name`, `last_name`, `email`, `phone`, `source`, `notes`, `deck_id` (nullable FK pitch_decks), `deck_url`, `zapier_synced`, `created_at`
- RLS: authenticated users can INSERT/SELECT their own rows; admins can SELECT all

### 2. Edge Function: `sync-onboarded-lead`
- Receives `{ leadId }`, fetches the full row + deck info
- Fires the existing `ZAPIER_PROJECT_LEADS_WEBHOOK` with all lead data (name, email, phone, source, notes, deck link, agent info)
- Formats the Lofty-compatible payload (same structure as `send-project-lead`)
- Returns success/failure status

### 3. Frontend Flow
- On submit: insert into `onboarded_leads` → invoke `sync-onboarded-lead` → show success with deck link
- Deck link format: `https://presaleproperties.com/deck/{slug}`
- Copy-to-clipboard button for the link

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/leads/LeadOnboardHub.tsx` | New — shared onboarding form component |
| `src/pages/dashboard/DashboardLeadOnboard.tsx` | New — agent portal wrapper |
| `src/pages/admin/AdminLeadOnboard.tsx` | New — admin portal wrapper |
| `src/App.tsx` | Add routes for both portals |
| `supabase/functions/sync-onboarded-lead/index.ts` | New — Zapier/Lofty sync edge function |
| DB migration | New `onboarded_leads` table + RLS policies |

