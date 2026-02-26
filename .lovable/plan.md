
## Bot/Crawler IP Filtering — Block Datacenter Ranges from Tracking & Webhooks

### Problem
Bot traffic from known datacenter IP ranges (China, India, Singapore, etc.) is hitting edge functions and triggering unnecessary tracking records and Zapier webhook calls. Currently there is no IP-based filtering at the edge function layer.

### Strategy
Add a lightweight IP guard at the top of the two primary inbound edge functions — **`track-client-activity`** and **`send-behavior-event`** — that checks the client IP against a blocklist of known bad ranges before doing any database writes or webhook calls.

---

### Blocked Ranges (Initial Set)

| Range | Region | Reason |
|---|---|---|
| `43.173.x.x` | China (Tencent Cloud) | Confirmed scrapers in activity logs |
| `42.106.x.x` | India (Jio DC) | Confirmed scrapers in activity logs |
| `45.83.x.x` | Eastern Europe DC | Generic datacenter crawlers |
| `185.220.x.x` | Tor exit nodes | Anonymised abuse traffic |
| `194.165.x.x` | Russia DC | Known bot range |
| `167.94.x.x` | Censys/ZMap scanners | Mass internet scanners |
| `216.244.x.x` | DotSematext crawlers | SEO/content bots |

The list is maintained as a simple array inside a shared helper — easy to extend.

---

### Implementation

#### Shared Helper (inlined in each function)
```typescript
const BLOCKED_IP_PREFIXES = [
  "43.173.", "42.106.", "45.83.", "185.220.",
  "194.165.", "167.94.", "216.244."
];

function isBlockedIP(ip: string | null): boolean {
  if (!ip) return false;
  return BLOCKED_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
}
```

If the IP matches, the function returns `{ success: true, blocked: true }` immediately with HTTP 200 — **no database writes, no Zapier calls**. Returning 200 (not 403) prevents bots from retrying with different strategies.

#### Guard placement

**`track-client-activity/index.ts`** — after extracting `clientIP`, before any DB logic:
```typescript
if (isBlockedIP(clientIP)) {
  console.log(`[BOT_BLOCK] Blocked IP: ${clientIP}`);
  return new Response(JSON.stringify({ success: true, blocked: true }), { ... });
}
```

**`send-behavior-event/index.ts`** — same placement, same pattern.

---

### Changes (2 files, server-side only)

| File | Change |
|---|---|
| `supabase/functions/track-client-activity/index.ts` | Add `isBlockedIP` helper + guard after IP extraction |
| `supabase/functions/send-behavior-event/index.ts` | Add `isBlockedIP` helper + guard after IP extraction |

---

### What This Does NOT Change
- Legitimate users are completely unaffected
- Lead forms, booking forms, and Zapier webhooks for real leads continue to work normally
- Database schema unchanged
- No frontend changes required
- The IP blocklist can be extended at any time by adding entries to the `BLOCKED_IP_PREFIXES` array

### Silent Blocking (200 vs 403)
Returning HTTP 200 with `blocked: true` is intentional — bots seeing 403 will often retry or escalate. A silent 200 response discourages retry behavior and reduces server load.
