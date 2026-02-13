

# Visitor IP Address and Referrer Source Tracking

## What This Solves

Right now, your tracking captures visitor behavior (pages viewed, projects clicked, device type) but is missing two critical pieces for retargeting:

1. **IP addresses** -- needed for geo-targeting, fraud detection, and ad platform audience matching
2. **Direct link sources** -- the full referrer URL when someone arrives from an external link (not just UTM-tagged campaigns)

## How It Works

IP addresses are **not available in browser JavaScript** -- they can only be captured **server-side**. Since all your tracking already routes through two backend functions (`track-client-activity` and `send-behavior-event`), we can extract the IP from the incoming request headers with zero client-side changes.

```text
Browser --> Edge Function --> reads req headers --> stores IP + referrer
```

## Implementation Steps

### 1. Add `ip_address` column to `client_activity` table

A new migration adds a `text` column to store the visitor's IP on every tracked event.

```sql
ALTER TABLE public.client_activity ADD COLUMN ip_address text;
CREATE INDEX idx_client_activity_ip ON public.client_activity(ip_address);
```

### 2. Add `ip_address` and `last_ip` to `clients` table

Store the most recent IP on the client record for quick retargeting lookups.

```sql
ALTER TABLE public.clients ADD COLUMN last_ip text;
```

### 3. Update `track-client-activity` edge function

Extract the IP from standard headers (`x-forwarded-for`, `cf-connecting-ip`, or the connection remote address) and save it alongside every activity record. Also update the client's `last_ip` when we match a known client.

```typescript
// Extract IP from request headers (Deno edge runtime)
function getClientIP(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || null;
}
```

### 4. Update `send-behavior-event` edge function

Same IP extraction logic. Also include `ip_address` in the enriched payload forwarded to Zapier so retargeting platforms receive it.

### 5. Admin visibility (optional follow-up)

The IP data will be queryable in your admin CRM views and can be used to:
- Identify repeat visitors from the same network
- Cross-reference with ad platform audiences
- Detect bot/fraud traffic patterns

## Privacy Considerations

- IP addresses are considered personal data under GDPR/PIPEDA
- Your existing privacy policy should already cover analytics data collection
- IPs will only be stored in admin-accessible tables (RLS-protected)
- No IP data is ever exposed to public-facing views

## Technical Summary

| Change | File/Table |
|---|---|
| New column `ip_address` | `client_activity` table |
| New column `last_ip` | `clients` table |
| Extract IP from headers | `track-client-activity/index.ts` |
| Extract IP from headers | `send-behavior-event/index.ts` |
| Include IP in Zapier payload | `send-behavior-event/index.ts` |
| New index for IP lookups | `client_activity.ip_address` |

No client-side code changes are needed -- everything is captured server-side from existing request headers.

