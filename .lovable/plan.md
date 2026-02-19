

# Improve Map Experience Across All Devices

This plan covers a holistic upgrade to the map search experience targeting mobile performance, property cards, search/filters, and visual design.

---

## 1. Mobile Performance Improvements

**Problem**: On mobile/tablet, map panning can feel sluggish with thousands of markers, and tile transitions sometimes cause flicker.

**Changes**:
- **CombinedListingsMap.tsx**: Increase `maxClusterRadius` from 50 to 65 on mobile to reduce rendered marker count at any given zoom level. This means fewer individual markers are drawn, improving frame rates.
- **CombinedListingsMap.tsx**: Add `renderer: L.canvas()` for mobile to leverage canvas rendering instead of SVG DOM elements, reducing repaints.
- **CombinedListingsMap.tsx**: Limit visible resale marker rendering to 2000 items max on mobile (skip rendering markers outside a tighter bounding box).
- **MapSearch.tsx**: Reduce the visible items cap from 40 to 25 on mobile carousel to reduce DOM node count.
- **CombinedListingsMap.tsx**: Add `will-change: auto` cleanup after initial render to release GPU memory on mobile.

---

## 2. Property Cards & Carousel Redesign

**Problem**: Mobile carousel cards are small (180px) and lack key details. Desktop grid cards could show more at-a-glance info.

**Changes (Mobile Carousel)**:
- **MapSearch.tsx**: Increase card width from `180px / 200px` to `200px / 220px` on tablets for better readability.
- **MapSearch.tsx**: Add sqft display to resale carousel cards (e.g., "2bd 1ba 850sf") for more info density.
- **MapSearch.tsx**: Add a subtle status badge for presale cards showing "Selling Now" / "Registering" / "Coming Soon".
- **MapSearch.tsx**: Improve the carousel scroll snap behavior with `scroll-padding` so cards don't clip at edges.

**Changes (Desktop Panel)**:
- **MapSearch.tsx**: Add a hover preview that shows a larger image tooltip when hovering over a card in the desktop list.
- **MapSearch.tsx**: Display listing age (e.g., "2d ago", "1w ago") on resale cards for time sensitivity.

---

## 3. Search & Filters Enhancement

**Problem**: The mobile filter sheet is functional but could be more intuitive. The search bar could offer quick-access filter chips.

**Changes**:
- **MobileMapSearchBar.tsx**: Add horizontal quick-filter chips below the search bar for the most common actions: "Under $1M", "2+ Beds", "Condo", "Townhouse". Tapping toggles the filter and updates the URL params instantly.
- **MobileMapFilters.tsx**: Add a "Popular" section at the top of the filter sheet with preset combinations (e.g., "First-time Buyer: Under $800K, 1-2 beds", "Family: 3+ beds, Townhouse/House").
- **MapSearch.tsx / MobileMapSearchBar.tsx**: Add a "Recent Searches" feature that saves the last 3-5 search queries in localStorage and shows them when the search bar is focused with no input.
- **UnifiedMapToggle.tsx**: Show property counts as small badges next to each mode label (e.g., "Presale (24)") so users know what's available before toggling.

---

## 4. Visual Design & Markers

**Problem**: Markers work well but could be more visually distinct. Popups could be more modern.

**Changes**:
- **CombinedListingsMap.tsx**: Add a subtle pulsing animation to presale pins to make them stand out from resale price pills. Use CSS keyframes for a gentle scale pulse (1.0 to 1.05).
- **CombinedListingsMap.tsx**: Differentiate cluster icons by type: gold clusters for mixed, darker gold for presale-only clusters, lighter gold for resale-only. Determined by majority type in cluster.
- **CombinedListingsMap.tsx**: Upgrade popup cards to show a larger image (120px instead of 100px) and add a "View Details" call-to-action button at the bottom.
- **CombinedListingsMap.tsx**: Add a smooth zoom-in animation when clicking a cluster on mobile (currently disabled with `zoomToBoundsOnClick: false`). Replace with a controlled `flyToBounds` with a short duration.
- **index.css / CombinedListingsMap.tsx**: Add a dark mode aware color scheme for map markers - currently markers use hardcoded HSL values that look good on light but may not contrast well on dark backgrounds.

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/components/map/CombinedListingsMap.tsx` | Canvas renderer on mobile, cluster radius tuning, marker rendering cap, pulse animation for presale pins, popup redesign, cluster click behavior, dark-mode marker colors |
| `src/pages/MapSearch.tsx` | Carousel card sizing, sqft display, status badges, visible items cap adjustment, listing age display, scroll-padding, hover preview |
| `src/components/search/MobileMapSearchBar.tsx` | Quick-filter chips, recent searches |
| `src/components/map/MobileMapFilters.tsx` | Popular presets section |
| `src/components/map/UnifiedMapToggle.tsx` | Property count badges |
| `src/index.css` | Pulse keyframes for presale markers |

### Risks & Mitigations

- **Canvas renderer**: May affect popup positioning on some older mobile browsers. Will add a fallback to SVG if canvas is not supported.
- **Cluster type differentiation**: Requires inspecting child markers in `iconCreateFunction`, which adds minimal compute. Capped to first 10 children for performance.
- **Quick filter chips**: Must sync with existing URL parameter system to avoid conflicts. Will reuse the existing `updateFilter`/`updateMultiFilter` callbacks.

