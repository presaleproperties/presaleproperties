
# 🔍 Lead System Audit — Full Findings & Fix Plan

## INVENTORY: All Lead Forms Found (11 total)

| # | Form | File | `form_type` | `send-lead-autoresponse` | `useLeadSubmission` | Dedup |
|---|------|------|-------------|--------------------------|---------------------|-------|
| 1 | **ProjectLeadForm** (sidebar) | `ProjectLeadForm.tsx` | ✅ `project_inquiry` | ✅ Yes | ✅ Yes | ❌ No |
| 2 | **ProjectMobileCTA** (sticky footer) | `ProjectMobileCTA.tsx` | ✅ `mobile_cta` | ✅ Yes | ✅ Yes | ❌ No |
| 3 | **AccessPackModal** (modal) | `AccessPackModal.tsx` | ✅ `access_pack` | ❌ **MISSING** | ✅ Yes | ✅ Yes (`upsertProjectLead`) |
| 4 | **ExitIntentPopup** | `ExitIntentPopup.tsx` | ❓ Need to check | ❌ **MISSING** | ✅ Yes | ✅ Yes (`upsertProjectLead`) |
| 5 | **DeckPriceGate** (pitch deck) | `DeckPriceGate.tsx` | ✅ `deck_gate` | ❌ **MISSING** | ❌ **MISSING** | ❌ No |
| 6 | **LeadCaptureForm** (resale listings) | `LeadCaptureForm.tsx` | ❌ None (uses `leads` table) | ❌ **MISSING** | ❌ **MISSING** | ❌ No |
| 7 | **MistakesGuideLeadMagnet** | `MistakesGuideLeadMagnet.tsx` | ❓ Need to check | ❌ **MISSING** | ✅ Yes | ❌ No |
| 8 | **PriceAlertButton** (lead magnet) | `LeadMagnets.tsx` | ✅ `lead_magnet` | ❌ N/A (email-only) | ❌ **MISSING** | ❌ No |
| 9 | **VIPNotifyButton** (lead magnet) | `LeadMagnets.tsx` | ✅ `lead_magnet` | ❌ N/A (email-only) | ❌ **MISSING** | ❌ No |
| 10 | **NeighborhoodGuideButton** | `LeadMagnets.tsx` | ✅ `lead_magnet` | ❌ N/A (email-only) | ❌ **MISSING** | ❌ No |
| 11 | **ConsultationButton** | `LeadMagnets.tsx` | ✅ `consultation` | ❌ **MISSING** | ❌ **MISSING** | ❌ No |
| 12 | **NewsletterSignup** | `NewsletterSignup.tsx` | ✅ `newsletter` | ❌ N/A | ❌ **MISSING** | ❌ No |
| 13 | **ResaleScheduleForm** | `ResaleScheduleForm.tsx` | ✅ `resale_inquiry` | ❌ **MISSING** | ❌ **MISSING** | ❌ No |
| 14 | **usePresaleLeadCapture** (2-step) | `usePresaleLeadCapture.ts` | ❌ **NULL** | ❌ **MISSING** | ❌ **MISSING** | ❌ No |

---

## 🚨 CRITICAL BUGS (Leads Falling Through Cracks)

### BUG 1: `usePresaleLeadCapture` is ORPHANED — not used anywhere
- The 2-step email→details hook exists but **zero components** import it
- It also does NOT call `send-lead-autoresponse` — so if it were used, leads would get no auto-response email
- It does NOT call `useLeadSubmission` — so no tracking data, no lead scoring
- **Impact**: Dead code, no direct bug, but indicates incomplete migration

### BUG 2: `form_type` is NULL on many leads
- DB shows many leads with `form_type: <nil>` — these come from older forms or the orphaned hook
- `useLeadSubmission` is the only thing that patches `form_type` into the DB
- Forms that skip `useLeadSubmission` never get `form_type` set → **lead scoring breaks** (score stays 0)
- **Affected**: DeckPriceGate, LeadCaptureForm (resale), all LeadMagnets, ConsultationButton, ResaleScheduleForm, NewsletterSignup

### BUG 3: `send-lead-autoresponse` only fires from 2 forms
- Only `ProjectLeadForm` and `ProjectMobileCTA` call it
- **AccessPackModal** — highest-intent form (has timeline, persona, property type) — gets NO auto-response email
- **DeckPriceGate** — phone-verified leads — gets NO auto-response email
- **ConsultationButton** — "call me" leads — gets NO auto-response email
- **Impact**: Your hottest leads get zero follow-up email. Only WhatsApp CTA after form submit.

### BUG 4: Lead deduplication is inconsistent
- Only `AccessPackModal` and `ExitIntentPopup` use `upsertProjectLead` (dedup)
- All other forms do raw `insert` — **duplicate leads** created for repeat submissions
- Same person submitting from sidebar + mobile CTA = 2 separate leads in DB

### BUG 5: `lead_score` and `lead_temperature` stay at 0/cold for most leads
- `useLeadSubmission` patches these but runs as a fire-and-forget `.then()` chain
- If the DB patch fails (race condition, RLS issue), `send-project-lead` never fires → Zapier webhook lost
- DB confirms: most leads have `lead_score: 0, lead_temperature: cold` even with `has_tracking: true`

### BUG 6: LeadCaptureForm (resale listings) writes to `leads` table, not `project_leads`
- Completely separate table → invisible to admin lead management, no CRM sync, no auto-response
- Uses `(supabase as any)` cast — suggesting the table may not be in the typed schema
- **Impact**: Resale listing leads are completely siloed from the main pipeline

### BUG 7: `trigger-workflow` is DISABLED (global kill switch)
- The edge function has an early return: all workflow events are dropped
- Comment says "lead data still flows via send-project-lead" — but that's only true if `useLeadSubmission` fires

---

## 📊 CONVERSION OPTIMIZATION OPPORTUNITIES

### OPP 1: Auto-response for ALL project-linked forms
- Every form that has a `project_id` should trigger `send-lead-autoresponse`
- This includes: AccessPackModal, DeckPriceGate, ConsultationButton
- Template A/B logic already handles realtor vs buyer routing

### OPP 2: Centralize ALL lead creation through `upsertProjectLead`
- Prevents duplicates across all 14 forms
- Single point for dedup, scoring, and webhook dispatch

### OPP 3: Attach `useLeadSubmission` to ALL forms with phone/name
- Currently only 4 of 14 forms use it → most leads get no scoring or tracking enrichment
- High-intent forms (Consultation, DeckGate) should be prioritized

### OPP 4: Lead scoring needs calibration
- Consultation and DeckGate leads should score higher (they provide phone + verified)
- Current scoring gives `deck_gate` +3 which is correct, but the hook isn't called so it stays at 0

### OPP 5: Success state should always show WhatsApp CTA
- Currently only ProjectLeadForm and ProjectMobileCTA show WhatsApp after submit
- AccessPackModal shows it ✅ but ConsultationButton and lead magnets just show a toast

### OPP 6: Meta CAPI not firing from all forms
- LeadMagnets (email-only forms), ConsultationButton, ResaleScheduleForm don't fire Meta CAPI
- Missing conversion signals for ad optimization

---

## 🔧 FIX PLAN (Priority Order)

### Phase 1: Stop Losing Leads (Critical)
1. **Wire `send-lead-autoresponse`** to AccessPackModal, DeckPriceGate, and ConsultationButton
2. **Wire `useLeadSubmission`** to DeckPriceGate, ConsultationButton, ResaleScheduleForm, and all LeadMagnets that collect phone
3. **Switch all forms to `upsertProjectLead`** for dedup
4. **Delete orphaned `usePresaleLeadCapture`** hook (dead code)

### Phase 2: Fix Data Quality
5. **Ensure `form_type` is always set** at insert time (not relying on useLeadSubmission patch)
6. **Fix `useLeadSubmission` fire-and-forget chain** — await the DB patch before firing Zapier
7. **Migrate LeadCaptureForm** from `leads` table to `project_leads` table

### Phase 3: Maximize Conversions
8. **Add Meta CAPI** to all remaining forms
9. **Add WhatsApp CTA** to ConsultationButton and lead magnet success states
10. **Calibrate lead scoring** — `consultation` and `deck_gate` leads should auto-score as "warm" minimum

Would you like me to proceed with implementing these fixes?
