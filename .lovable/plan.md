
## Audit Findings

### 🗑️ Pages to Remove (waste of space/code)

1. **Onboard Client** (`/dashboard/lead-onboard`) — **Exact duplicate** of the LeadOnboardHub already embedded in the Overview page. Same component, same functionality, just wrapped in DashboardLayout twice. Dead code.

2. **Messages** (`/dashboard/messages`) — Agent-to-agent inbox for assignment listings. This feature is tied to a secondary workflow (assignment marketplace) that isn't your core focus. Low/no usage. Remove from nav.

3. **Billing** (`/dashboard/billing`) — Queries a `payments` table for listing payments. Since the assignment listing payment flow isn't live, this page always shows "No payments yet." Dead weight.

### 🔄 Reorganized Navigation (11 items → 7 items)

**Core Workflow Group** (what agents do daily):
1. **Overview** — Greeting + Lead Onboard form + quick deck links (keep as-is)
2. **Leads** — All lead management (onboarded + inquiries)  
3. **Pitch Decks** — Create & share project decks
4. **Marketing** — Email template builder + saved campaigns
5. **Emails** — Track sent emails & open rates

**Resources Group:**
6. **Project Docs** — Premium floorplan/brochure library

**Account Group:**
7. **Profile** — Account & license settings

### 📐 Layout Changes
- Group sidebar nav into labeled sections: **Workflow**, **Resources**, **Account**
- Keep **My Listings** accessible but move to bottom/secondary position (it works, just not the primary use case)
- Remove the redundant "Onboard Client" route entirely

### ✅ What stays as-is (working well)
- LeadOnboardHub on Overview (primary CTA ✓)
- Leads page with temperature system (✓)
- Pitch Decks with "Send Email Campaign" flow (✓)
- Marketing Hub with company template imports (✓)
- Email tracking with compose (✓)
- Project Documents with verification gate (✓)
- Profile with license verification (✓)
