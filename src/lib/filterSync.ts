/**
 * Filter synchronization utilities for seamless transitions between grid and map views.
 * Converts filter parameters between the two formats.
 */

// Price range mappings between grid format and map format
const GRID_TO_MAP_PRICE: Record<string, { min: number; max: number }> = {
  "0-500000": { min: 0, max: 500000 },
  "500000-750000": { min: 500000, max: 750000 },
  "750000-1000000": { min: 750000, max: 1000000 },
  "1000000-1500000": { min: 1000000, max: 1500000 },
  "1500000-2000000": { min: 1500000, max: 2000000 },
  "2000000-999999999": { min: 2000000, max: 5000000 },
};

// Property type mappings
const GRID_TO_MAP_TYPE: Record<string, string> = {
  "Apartment/Condo": "Apartment/Condo",
  "Townhouse": "Townhouse",
  "House": "Single Family",
};

const MAP_TO_GRID_TYPE: Record<string, string> = {
  "Apartment/Condo": "Apartment/Condo",
  "Townhouse": "Townhouse",
  "Single Family": "House",
};

/**
 * Build map search URL with filters from grid page
 */
export function buildMapUrlFromGridFilters(
  currentSearchParams: URLSearchParams,
  mode: "resale" | "presale" = "resale"
): string {
  const params = new URLSearchParams();
  
  // Set mode
  params.set("mode", mode);
  
  // City filter - grid uses "city" (single or comma-separated)
  const city = currentSearchParams.get("city");
  if (city && city !== "any") {
    // Map uses "cities" for multi-select
    params.set("cities", city);
  }
  
  // Property type - grid uses "type"
  const type = currentSearchParams.get("type");
  if (type && type !== "any") {
    const types = type.split(",").map(t => GRID_TO_MAP_TYPE[t] || t).filter(Boolean);
    if (types.length > 0) {
      params.set("types", types.join(","));
    }
  }
  
  // Price range - grid uses "price" like "500000-750000"
  const price = currentSearchParams.get("price");
  if (price && price !== "any") {
    const priceConfig = GRID_TO_MAP_PRICE[price];
    if (priceConfig) {
      params.set("priceMin", priceConfig.min.toString());
      params.set("priceMax", priceConfig.max.toString());
    }
  }
  
  // Beds - same format
  const beds = currentSearchParams.get("beds");
  if (beds && beds !== "any") {
    params.set("beds", beds);
  }
  
  // Baths - same format
  const baths = currentSearchParams.get("baths");
  if (baths && baths !== "any") {
    params.set("baths", baths);
  }
  
  // Sort
  const sort = currentSearchParams.get("sort");
  if (sort && sort !== "newest") {
    // Map uses underscore format (price_asc), grid uses dash (price-asc)
    params.set("sort", sort.replace("-", "_"));
  }
  
  return `/map-search?${params.toString()}`;
}

/**
 * Build grid URL with filters from map page
 */
export function buildGridUrlFromMapFilters(
  currentSearchParams: URLSearchParams,
  basePath: string = "/resale"
): string {
  const params = new URLSearchParams();
  
  // City filter - map uses "cities" or legacy "city"
  const cities = currentSearchParams.get("cities");
  const city = currentSearchParams.get("city");
  if (cities) {
    params.set("city", cities);
  } else if (city && city !== "any") {
    params.set("city", city);
  }
  
  // Property type - map uses "types" or legacy "type"
  const types = currentSearchParams.get("types");
  const type = currentSearchParams.get("type");
  if (types) {
    const gridTypes = types.split(",").map(t => MAP_TO_GRID_TYPE[t] || t).filter(Boolean);
    if (gridTypes.length > 0) {
      params.set("type", gridTypes.join(","));
    }
  } else if (type && type !== "any") {
    const gridType = MAP_TO_GRID_TYPE[type] || type;
    params.set("type", gridType);
  }
  
  // Price - map uses priceMin/priceMax or "prices"
  const priceMin = currentSearchParams.get("priceMin");
  const priceMax = currentSearchParams.get("priceMax");
  if (priceMin || priceMax) {
    const min = parseInt(priceMin || "0");
    const max = parseInt(priceMax || "999999999");
    // Find matching grid price range
    const gridPrice = findMatchingGridPriceRange(min, max);
    if (gridPrice) {
      params.set("price", gridPrice);
    }
  }
  
  // Beds - same format
  const beds = currentSearchParams.get("beds");
  if (beds && beds !== "any") {
    params.set("beds", beds);
  }
  
  // Baths - same format
  const baths = currentSearchParams.get("baths");
  if (baths && baths !== "any") {
    params.set("baths", baths);
  }
  
  // Sort
  const sort = currentSearchParams.get("sort");
  if (sort && sort !== "newest") {
    // Grid uses dash format (price-asc), map uses underscore (price_asc)
    params.set("sort", sort.replace("_", "-"));
  }
  
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Find the best matching grid price range for given min/max
 */
function findMatchingGridPriceRange(min: number, max: number): string | null {
  // Check for exact matches first
  for (const [key, range] of Object.entries(GRID_TO_MAP_PRICE)) {
    if (range.min === min && (range.max === max || (max >= 5000000 && key.includes("999999999")))) {
      return key;
    }
  }
  
  // Find closest match
  if (max <= 500000) return "0-500000";
  if (min >= 500000 && max <= 750000) return "500000-750000";
  if (min >= 750000 && max <= 1000000) return "750000-1000000";
  if (min >= 1000000 && max <= 1500000) return "1000000-1500000";
  if (min >= 1500000 && max <= 2000000) return "1500000-2000000";
  if (min >= 2000000) return "2000000-999999999";
  
  return null;
}

/**
 * Get active filter count from search params (for badge display)
 */
export function getActiveFilterCount(searchParams: URLSearchParams): number {
  let count = 0;
  
  // Check all possible filter params
  const filterParams = ["city", "cities", "type", "types", "price", "prices", "priceMin", "beds", "baths"];
  
  for (const param of filterParams) {
    const value = searchParams.get(param);
    if (value && value !== "any") {
      count++;
    }
  }
  
  return count;
}
