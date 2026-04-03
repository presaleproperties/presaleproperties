

# Manual "Send Deck Email" Button

## Overview

Add a "Send Deck Email" button next to each onboarded lead that has a pitch deck assigned. When clicked, it fires an edge function that fetches the deck data, renders a branded pitch deck intro email, and sends it via your existing Gmail SMTP — no auto-send, fully manual.

## What You'll See

- Each onboarded lead card (in the Leads tab) with a deck attached gets a **"Send Deck Email"** button
- The success screen after onboarding also gets the button (next to the copy-link button)
- Clicking it sends a polished email to the client with the project name, hero image, and a "View Pitch Deck" CTA linking to the live deck
- A loading spinner while sending, then a confirmation toast
- Button changes to "Email Sent" with a checkmark after success

## Technical Plan

### 1. New Edge Function: `send-deck-email`
- Accepts `{ leadId }` with JWT auth
- Fetches the onboarded lead + joined pitch deck data (project name, hero image, city, tagline, floor plans, deposit structure)
- Renders a branded HTML email matching your existing Lululemon-style aesthetic (white background, Plus Jakarta Sans headings, black pill CTA button)
- Sends via the existing `_shared/gmail-smtp.ts` utility from `info@presaleproperties.com`
- Logs to `email_logs` table
- Returns success/failure

### 2. Update `DashboardLeads.tsx`
- Add a "Send Deck Email" button on each onboarded lead card that has a `deck_url`
- Track sending state per lead ID
- Call `supabase.functions.invoke('send-deck-email', { body: { leadId } })`
- Show toast on success/failure

### 3. Update `LeadOnboardHub.tsx` success screen
- Add "Send Deck Email" button alongside the existing "Copy Link" button
- Only visible when a deck was selected during onboarding

### Files

| File | Action |
|------|--------|
| `supabase/functions/send-deck-email/index.ts` | Create — fetch deck data, render HTML, send via Gmail SMTP |
| `src/pages/dashboard/DashboardLeads.tsx` | Edit — add Send Email button per lead |
| `src/components/leads/LeadOnboardHub.tsx` | Edit — add Send Email button on success screen |

