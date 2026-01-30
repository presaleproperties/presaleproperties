
# SEO Enhancement: Geo-Tagged Amenity Schema & Internal Linking

## Overview
Enhance the Location & Neighborhood section with structured data and internal links to improve local search visibility and help Google understand the property's surrounding context.

## Changes

### 1. Add Schema.org `amenityFeature` to Presale Listings
Add nearby amenities as structured data to the existing `RealEstateListing` schema.

**Schema Addition:**
```json
"amenityFeature": [
  { "@type": "LocationFeatureSpecification", "name": "Near SkyTrain", "value": true },
  { "@type": "LocationFeatureSpecification", "name": "Walk Score", "value": 92 },
  { "@type": "LocationFeatureSpecification", "name": "Transit Score", "value": 88 }
],
"containedInPlace": {
  "@type": "Place",
  "name": "Metrotown, Burnaby",
  "geo": { "@type": "GeoCoordinates", "latitude": 49.xx, "longitude": -122.xx }
}
```

### 2. Add Nearby Places as Schema.org References
Create references to nearby schools and shopping centers for rich snippet eligibility.

**File:** `src/pages/PresaleProjectDetail.tsx`
- Add `nearbyPlaces` array to structured data with School and LocalBusiness types

### 3. Make Amenity Names Clickable (Internal Linking)
Convert static text to internal links pointing to map searches.

**File:** `src/components/projects/LocationDeepDive.tsx`
- Shopping centers → `/map-search?q=Morgan+Crossing&lat=X&lng=Y`
- Schools → `/map-search?q=Semiahmoo+Secondary&lat=X&lng=Y`
- Transit landmarks → `/map-search?q=SkyTrain&lat=X&lng=Y`

### 4. Add Geo Meta Tags
Add legacy geo-tagging meta tags for broader compatibility.

**File:** `src/pages/PresaleProjectDetail.tsx`
```html
<meta name="geo.position" content="49.123;-122.456" />
<meta name="ICBM" content="49.123, -122.456" />
<meta name="geo.placename" content="South Surrey, Surrey, BC" />
```

## Technical Details

### Files to Modify:
1. **`src/pages/PresaleProjectDetail.tsx`**
   - Add `amenityFeature` to `structuredData`
   - Add geo meta tags to Helmet
   - Generate `nearbyPlaces` schema from LocationDeepDive data

2. **`src/components/projects/LocationDeepDive.tsx`**
   - Convert amenity names to `<Link>` components
   - Export neighborhood data for schema generation

3. **`src/pages/ResaleListingDetail.tsx`**
   - Apply same geo meta tags pattern for consistency

### Schema Structure:
```text
RealEstateListing
├── geo (GeoCoordinates)
├── amenityFeature[] (LocationFeatureSpecification)
│   ├── Walk Score
│   ├── Transit Score
│   └── Near SkyTrain
├── containedInPlace (Place - Neighborhood)
└── nearbyPlaces[] (School, ShoppingCenter, TrainStation)
```

## Expected SEO Benefits
- Enhanced local search visibility in Google Maps and local pack
- Rich snippets showing nearby amenities
- Internal link equity flowing to map search pages
- Better context signals for AI search engines
