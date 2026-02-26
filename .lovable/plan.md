
## Add Zapier Webhook Guards — Require Name + Email Before Firing

### Problem

Three backend functions send data to Zapier webhooks without validating that the lead contains both a real name and email. This allows empty/partial/bot records (e.g., step-1-only email captures with `name = "(pending)"`, or test pings) to trigger Zaps with no useful data.

### Functions to Harden

**1. `send-project-lead`** — fires `ZAPIER_PROJECT_LEADS_WEBHOOK` for presale project leads  
**2. `send-booking-notification`** — fires `ZAPIER_PROJECT_LEADS_WEBHOOK` (bookings key) for scheduling bookings  
**3. `send-behavior-event`** — fires `zapier_behavior_webhook` for high-value behavior events (form_submit)  

---

### Guard Logic Per Function

#### `send-project-lead`

Before firing the webhook, check:
```
lead.name is not null
AND lead.name != "(pending)"
AND lead.name.trim().length >= 2
AND lead.email is not null
AND lead.email.trim().length > 0
AND lead.email matches basic email regex
```

If the guard fails: log a clear message (`[GUARD] Skipping Zapier — incomplete lead data: name=(pending), email=...`) and return `success: true` without firing. The lead is still saved in the database; Zapier just doesn't get pinged.

#### `send-booking-notification`

Before firing the webhook, check:
```
data.name is not null and has length >= 2
AND data.email is not null and is a valid email
AND data.phone is not null (bookings always require phone)
```

Bookings are always complete by design (the form requires all fields), but this adds a safety net against direct API calls or test submissions.

#### `send-behavior-event`

The `form_submit` event forwards to Zapier enriched with lead details. Guard:
```
If isKnownLead is true: leadDetails.email must be present
If isKnownLead is false: skip forwarding (anonymous form_submit with no known lead context = bot/test)
```

Additionally, if `event_payload` contains `email` (some form submits include it directly), validate it's a real email before forwarding.

---

### Changes (3 files, server-side only)

| File | Change |
|---|---|
| `supabase/functions/send-project-lead/index.ts` | Add guard block after lead is fetched, before webhook call |
| `supabase/functions/send-booking-notification/index.ts` | Add guard block before webhook call |
| `supabase/functions/send-behavior-event/index.ts` | Add guard: only forward to Zapier if `isKnownLead && leadDetails.email` |

---

### What This Does NOT Change

- Lead records are still saved to the database regardless
- The 15-minute anonymous UPDATE window for step-2 completion is unchanged
- No frontend changes required
- No database schema changes

### Technical Detail — Guard Implementation

A shared validation helper will be inlined in each function (no shared module, to avoid cross-function import complexity):

```typescript
function isValidLeadForZapier(name: string | null, email: string | null): boolean {
  if (!name || !email) return false;
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) return false;
  if (cleanName === "(pending)") return false;
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) return false;
  return true;
}
```

This is the same regex already used in `validate_project_lead_insert` DB trigger, keeping validation consistent across layers.
