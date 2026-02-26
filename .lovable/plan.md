
## Live Activity Monitor — Admin Dashboard

### Overview
A new admin page at `/admin/live-activity` that shows real-time visitor sessions, IP flags, bot detection status, and suspicious traffic alerts. It polls the `client_activity` table every 10 seconds and uses Supabase Realtime for live inserts.

---

### What Gets Built

**1. New Page: `src/pages/admin/AdminLiveActivity.tsx`**

A full-page dashboard with 4 sections:

**Header Stats Bar** (auto-refreshing every 10s)
- Active sessions in last 30 min
- Blocked/flagged IPs count (last 24h — from console logs proxy via DB)
- Unique visitors today
- Bot attempts blocked (sourced from activity with suspicious IP patterns)

**Live Activity Feed** (real-time via Supabase channel subscription)
- Scrollable table, newest-first
- Columns: Time, Activity Type, Visitor ID (truncated), IP Address, City (from activity), Page, Device, Flags
- Color-coded rows: green = clean, yellow = watch, red = flagged/suspicious
- IP flag logic runs client-side against `BLOCKED_IP_PREFIXES`:
  - `43.173.`, `42.106.`, `45.83.`, `185.220.`, `194.165.`, `167.94.`, `216.244.`
- Bot badge shown if IP prefix matches
- "Known Lead" badge if `client_id` is linked

**Suspicious Traffic Alerts Panel** (right sidebar)
- Groups flagged IPs from last 24h by prefix/country
- Shows: IP, hit count, last seen, inferred region label
- Quick-action "Add to Blocklist" note (informational — shows the prefix to add)

**Session Summary Cards** (below feed)
- Top 5 most active visitor IDs in the last hour with activity counts
- Top 5 pages viewed in the last hour
- Device type breakdown (desktop/mobile/tablet)

---

### Data Source

All data comes from the existing `client_activity` table — no schema changes needed.

```
Query for feed:
SELECT id, created_at, activity_type, visitor_id, ip_address, city,
       page_url, page_title, device_type, client_id, session_id
FROM client_activity
ORDER BY created_at DESC
LIMIT 200
```

Realtime subscription on `client_activity` INSERT events updates the feed live.

IP flagging runs in the browser — no backend changes needed for the detection logic.

---

### Navigation Integration

Added to `AdminLayout.tsx` under the **Analytics** section:
```
{ href: "/admin/live-activity", label: "Live Monitor", icon: Activity }
```

And to `iconColors`:
```
"Live Monitor": "text-red-500"
```

Route added to `App.tsx`:
```tsx
<Route path="/admin/live-activity" element={<AdminProtectedRoute><AdminLiveActivity /></AdminProtectedRoute>} />
```

---

### Technical Detail

**Realtime setup:**
```typescript
const channel = supabase
  .channel('live-activity-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'client_activity',
  }, (payload) => {
    setActivities(prev => [payload.new as ActivityRow, ...prev].slice(0, 200));
  })
  .subscribe();
```

**IP flagging (client-side, consistent with edge functions):**
```typescript
const BLOCKED_IP_PREFIXES = ["43.173.", "42.106.", "45.83.", "185.220.", "194.165.", "167.94.", "216.244."];
const IP_REGION_MAP: Record<string, string> = {
  "43.173.": "China (Tencent Cloud)",
  "42.106.": "India (Jio DC)",
  "45.83.":  "Eastern Europe DC",
  "185.220.": "Tor Exit Node",
  "194.165.": "Russia DC",
  "167.94.": "Censys Scanner",
  "216.244.": "DotSematext Bot",
};
```

**Auto-refresh:** Stats bar polls every 10 seconds using `setInterval` in `useEffect`.

---

### Files Changed

| File | Action |
|---|---|
| `src/pages/admin/AdminLiveActivity.tsx` | Create — main page |
| `src/components/admin/AdminLayout.tsx` | Add nav item + icon color |
| `src/App.tsx` | Add route |

No database migrations. No edge function changes. No secrets required.
