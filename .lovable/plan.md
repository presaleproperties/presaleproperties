
# Assignments on Map Search - Agent-Only Access Implementation

## Overview
This plan adds **assignment listings** to the main `/map-search` page as a new data layer. All assignment details will be **blurred by default** for non-authenticated users and non-verified agents. Only verified agents logged into the agent portal will see full details.

---

## Visual Design: Before & After

### Public/Non-Agent View (Blurred)
```text
┌─────────────────────────────────────────────────────────────┐
│                         MAP VIEW                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Presale │  │ Resale  │  │ASSIGN.  │ ← Purple/teal pin   │
│  │  (gold) │  │ (navy)  │  │(locked) │   with lock icon     │
│  └─────────┘  └─────────┘  └─────────┘                     │
├─────────────────────────────────────────────────────────────┤
│                     PROPERTY CARD                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Blurred Photo with Lock Overlay]                  │   │
│  │                                                      │   │
│  │  🔒 $XXX,XXX ← Price blurred                        │   │
│  │  ████████ ← Address blurred                         │   │
│  │  ████████ ← Neighborhood blurred                    │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │   🔐 AGENT EXCLUSIVE                       │     │   │
│  │  │   Sign in to view assignment details       │     │   │
│  │  │   [Login to Agent Portal] (button)         │     │   │
│  │  └────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Verified Agent View (Full Access)
```text
┌─────────────────────────────────────────────────────────────┐
│                         MAP VIEW                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Presale │  │ Resale  │  │ $549K   │ ← Purple price pill  │
│  │  (gold) │  │ (navy)  │  │ ASSIGN  │   fully visible      │
│  └─────────┘  └─────────┘  └─────────┘                     │
├─────────────────────────────────────────────────────────────┤
│                     PROPERTY CARD                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Full Photo Visible]                               │   │
│  │                                                      │   │
│  │  $549,000  (Save $20K from original)               │   │
│  │  The Butterfly by Concord Pacific                   │   │
│  │  Coal Harbour, Vancouver                            │   │
│  │  2 bd • 2 ba • 850 sqft                             │   │
│  │                                                      │   │
│  │  [View Assignment Details] (link)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Architecture

### 1. Agent Verification Hook
Create a reusable hook to check agent verification status:

**File:** `src/hooks/useAgentVerification.ts` (New)

```typescript
// Hook returns:
// - isVerifiedAgent: boolean
// - isLoading: boolean
// - agentProfile: data or null
```

This hook will:
- Check if user is authenticated via `useAuth()`
- Query `agent_profiles` table for `verification_status === 'verified'`
- Cache the result for the session

---

### 2. New Mode Toggle: "Assignments"
Update the map mode toggle to include assignments:

**File:** `src/pages/MapSearch.tsx`

- Extend `MapMode` type: `"all" | "presale" | "resale" | "assignments"`
- Add "Assignments" option to the `UnifiedMapToggle` component
- Fetch assignments from `listings` table where `status = 'published'`

---

### 3. Assignment Data Fetching
Add a new query to fetch published assignments:

**File:** `src/pages/MapSearch.tsx`

```typescript
// New query for assignments
const { data: assignments } = useQuery({
  queryKey: ["map-assignments", selectedCities],
  queryFn: async () => {
    const { data } = await supabase
      .from("listings")
      .select(`
        id, title, project_name, city, neighborhood,
        assignment_price, original_price, beds, baths,
        interior_sqft, map_lat, map_lng, status,
        listing_photos (url, sort_order)
      `)
      .eq("status", "published")
      .not("map_lat", "is", null)
      .not("map_lng", "is", null);
    return data;
  },
  enabled: mapMode === "all" || mapMode === "assignments"
});
```

---

### 4. Assignment Markers on Map
Add assignment markers with conditional styling:

**File:** `src/components/map/CombinedListingsMap.tsx`

Changes:
- Accept new props: `assignments`, `isVerifiedAgent`
- Create assignment marker icons:
  - **Verified agent:** Purple price pill showing actual price
  - **Non-agent:** Purple pin with lock icon (no price visible)
- Add assignment popup HTML with blur logic
- Handle click events differently based on agent status

---

### 5. Blurred Assignment Card Component
Create a reusable blurred card for non-agents:

**File:** `src/components/assignments/BlurredAssignmentCard.tsx` (New)

Features:
- Glassmorphism overlay with lock icon
- Blurred image using CSS `filter: blur(12px)`
- Obscured price text (e.g., "$XXX,XXX")
- Hidden address/neighborhood
- CTA button: "Login to Agent Portal" → `/for-agents`
- Hover state with tooltip explaining access restriction

---

### 6. Update Property Cards in Sidebar
Modify the sidebar card rendering logic:

**File:** `src/pages/MapSearch.tsx`

For assignments in the visible items list:
- If `isVerifiedAgent`: Show full `AssignmentCard` component
- If not verified: Show `BlurredAssignmentCard` component

---

### 7. Blurred Map Popup
Update popup rendering for assignments:

**File:** `src/components/map/CombinedListingsMap.tsx`

For non-agents, the popup HTML will show:
- Blurred background image
- Lock icon overlay
- "Agent Exclusive" badge
- "Login to view" CTA
- No price, address, or details visible

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAgentVerification.ts` | CREATE | New hook to check agent verification status |
| `src/components/assignments/BlurredAssignmentCard.tsx` | CREATE | Blurred card with lock overlay for non-agents |
| `src/pages/MapSearch.tsx` | EDIT | Add assignments mode, fetch query, conditional rendering |
| `src/components/map/CombinedListingsMap.tsx` | EDIT | Add assignment markers, blur logic for popups |
| `src/components/map/UnifiedMapToggle.tsx` | EDIT | Add "Assignments" toggle option |

---

## Technical Details

### CSS Blur Styling
```css
/* Applied to non-agent views */
.assignment-blurred {
  filter: blur(12px);
  pointer-events: none;
}

.assignment-lock-overlay {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.85);
}
```

### Agent Verification Check
```typescript
// In MapSearch.tsx
const { isVerifiedAgent, isLoading: agentLoading } = useAgentVerification();

// Pass to CombinedListingsMap
<CombinedListingsMap
  assignments={filteredAssignments}
  isVerifiedAgent={isVerifiedAgent}
  ...
/>
```

### Assignment Marker Color Scheme
- **Background:** Purple gradient (`#8B5CF6` to `#7C3AED`)
- **Lock icon:** White with slight shadow
- **Matches:** Premium aesthetic established in design tokens

---

## User Experience Flow

1. **User arrives at /map-search**
   - Sees toggle: "All" | "Presale" | "Resale" | "Assignments"
   
2. **User selects "Assignments" or "All"**
   - Assignment pins appear on map (purple/locked style)
   - Sidebar shows blurred assignment cards
   
3. **User clicks assignment pin (not logged in)**
   - Popup shows blurred preview with lock
   - CTA: "Login to Agent Portal"
   
4. **User clicks CTA**
   - Redirected to `/for-agents` login page
   
5. **Agent logs in and returns**
   - Full assignment details now visible
   - Can click through to full assignment page

---

## Security Considerations

- RLS policies already restrict `listings` table SELECT to `status = 'published'`
- Price/location data is obscured client-side for UX
- No sensitive data exposed in API responses for published listings
- Agent verification is a real-time database check

---

## Estimated Changes

- **New files:** 2
- **Modified files:** 3
- **Total lines:** ~400-500

