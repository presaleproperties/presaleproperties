
# Update Lead Tracking for City List Sources

## Overview
Currently, leads from the City List CTA (like the one Jasneet Toor filled out on `/langley-presale-condos`) are being stored with `lead_source: "general_inquiry"` instead of the specific source like `city_list_langley`. This makes it impossible to distinguish which city list a lead requested.

## Root Cause
In `AccessPackModal.tsx` at line 177, the lead source mapping is too restrictive:
```typescript
lead_source: source === "fit_call" ? "callback_request" : "general_inquiry"
```

This means any source value that isn't exactly `"fit_call"` gets mapped to `"general_inquiry"`, losing the specific context.

## Changes Required

### 1. Update AccessPackModal Lead Source Mapping
**File:** `src/components/conversion/AccessPackModal.tsx`

Update the lead_source logic to preserve specific source identifiers:

```typescript
// Before
lead_source: source === "fit_call" ? "callback_request" : "general_inquiry",

// After - Preserve specific sources
lead_source: source === "fit_call" ? "callback_request" 
           : source.startsWith("city_list_") ? source 
           : source === "sticky_bar" ? "sticky_bar"
           : source === "header" ? "header_inquiry"
           : source === "modal" ? "floor_plan_request"
           : source,  // Pass through any other specific sources
```

This will correctly store:
- `city_list_langley` for Langley city page leads
- `city_list_burnaby` for Burnaby city page leads
- `sticky_bar` for sticky conversion bar leads
- `header_inquiry` for header CTA leads
- `callback_request` for fit_call variant leads

### 2. Update Edge Function Form Type Mapping
**File:** `supabase/functions/send-project-lead/index.ts`

Add mappings for the new specific sources so Zapier/Lofty receives human-readable labels:

```typescript
const sourceMap: Record<string, string> = {
  // ... existing mappings ...
  "sticky_bar": "Sticky Bar Inquiry",
  "header_inquiry": "Header Inquiry",
  // City list sources will be handled dynamically
};

// Add dynamic handling for city_list_* sources
if (leadSource?.startsWith("city_list_")) {
  const city = leadSource.replace("city_list_", "").replace(/_/g, " ");
  return `City List Request - ${city.charAt(0).toUpperCase() + city.slice(1)}`;
}
```

### 3. Update Tag Generation for City Lists
In the same edge function, enhance the `generateTags()` function to add city-specific tags for city list leads:

```typescript
// In generateTags() - add city list specific tag
if (lead.lead_source?.startsWith("city_list_")) {
  const city = lead.lead_source.replace("city_list_", "").replace(/_/g, " ");
  tags.push(`City List: ${city.charAt(0).toUpperCase() + city.slice(1)}`);
}
```

## Impact

| Source Location | Before | After |
|-----------------|--------|-------|
| Langley City Page CTA | `general_inquiry` | `city_list_langley` |
| Surrey City Page CTA | `general_inquiry` | `city_list_surrey` |
| Sticky Bar | `general_inquiry` | `sticky_bar` |
| Header CTA | `general_inquiry` | `header_inquiry` |
| Default Modal | `general_inquiry` | `floor_plan_request` |
| Fit Call | `callback_request` | `callback_request` (unchanged) |

## Benefits
1. **Admin Dashboard**: See exactly which city list each lead requested
2. **Lofty CRM**: Leads tagged with specific city list (e.g., "City List: Langley")
3. **Analytics**: Track conversion by city landing page
4. **Attribution**: Full visibility into lead acquisition channels

## Files to Modify
1. `src/components/conversion/AccessPackModal.tsx` - Line 177
2. `supabase/functions/send-project-lead/index.ts` - Lines 100-118, 121-181
