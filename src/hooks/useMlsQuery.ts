import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMinYearBuilt } from "./useMinYearBuilt";
import { useEnabledCities } from "./useEnabledCities";

/**
 * Standard MLS listing select columns used across the site.
 * Components should use this instead of writing their own select strings.
 */
export const MLS_LISTING_COLUMNS = 
  "id, listing_key, listing_price, original_list_price, city, neighborhood, unparsed_address, street_number, street_name, street_suffix, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url, list_date, created_at" as const;

/**
 * Compact select for cards (fewer columns for performance).
 */
export const MLS_CARD_COLUMNS =
  "id, listing_key, listing_price, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_date" as const;

export interface MlsQueryFilters {
  city?: string;
  cities?: string[];
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  neighborhood?: string;
  sortBy?: "newest" | "price-asc" | "price-desc";
  limit?: number;
  offset?: number;
  /** Override the global min year built setting */
  overrideMinYear?: number;
  /** Use the compact card columns instead of full columns */
  compact?: boolean;
  /** Custom select string (overrides compact flag) */
  select?: string;
  /** Include count for pagination */
  withCount?: boolean;
}

/**
 * Centralized hook for querying MLS listings.
 * Automatically applies global filters (min year built, enabled cities).
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading } = useMlsQuery({ city: "Vancouver", limit: 12 });
 * ```
 */
export function useMlsQuery(filters: MlsQueryFilters = {}, enabled = true) {
  const { data: minYearBuilt } = useMinYearBuilt();
  const { data: enabledCities } = useEnabledCities();

  const effectiveMinYear = filters.overrideMinYear ?? minYearBuilt ?? 2024;
  const effectiveCities = filters.cities ?? (filters.city ? undefined : enabledCities);
  const selectColumns = filters.select ?? (filters.compact ? MLS_CARD_COLUMNS : MLS_LISTING_COLUMNS);

  return useQuery({
    queryKey: [
      "mls-listings",
      selectColumns,
      effectiveMinYear,
      filters.city,
      effectiveCities,
      filters.propertyType,
      filters.minPrice,
      filters.maxPrice,
      filters.minBeds,
      filters.minBaths,
      filters.minSqft,
      filters.maxSqft,
      filters.neighborhood,
      filters.sortBy,
      filters.limit,
      filters.offset,
      filters.withCount,
    ],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings_safe")
        .select(selectColumns, filters.withCount ? { count: "exact" } : undefined)
        .eq("mls_status", "Active")
        .gte("year_built", effectiveMinYear);

      // City filter
      if (filters.city) {
        query = query.eq("city", filters.city);
      } else if (effectiveCities && effectiveCities.length > 0) {
        query = query.in("city", effectiveCities);
      }

      // Property type
      if (filters.propertyType && filters.propertyType !== "any") {
        // Handle common aliases
        const typeMap: Record<string, string> = {
          "Condo": "Residential",
          "Townhouse": "Residential",
          "House": "Residential",
        };
        const subTypeMap: Record<string, string> = {
          "Condo": "Apartment/Condo",
          "Townhouse": "Townhouse",
        };
        
        if (subTypeMap[filters.propertyType]) {
          query = query.eq("property_sub_type", subTypeMap[filters.propertyType]);
        } else {
          query = query.eq("property_type", filters.propertyType);
        }
      }

      // Price range
      if (filters.minPrice) query = query.gte("listing_price", filters.minPrice);
      if (filters.maxPrice) query = query.lte("listing_price", filters.maxPrice);

      // Bedrooms & bathrooms
      if (filters.minBeds) query = query.gte("bedrooms_total", filters.minBeds);
      if (filters.minBaths) query = query.gte("bathrooms_total", filters.minBaths);

      // Square footage
      if (filters.minSqft) query = query.gte("living_area", filters.minSqft);
      if (filters.maxSqft) query = query.lte("living_area", filters.maxSqft);

      // Neighborhood
      if (filters.neighborhood) {
        query = query.eq("neighborhood", filters.neighborhood);
      }

      // Sorting
      switch (filters.sortBy) {
        case "price-asc":
          query = query.order("listing_price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("listing_price", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("list_date", { ascending: false, nullsFirst: false });
          break;
      }

      // Pagination
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { listings: data || [], count: count ?? 0 };
    },
    enabled: enabled && !!minYearBuilt && !!enabledCities,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Utility to check if a city slug is valid against enabled cities.
 */
export function citySlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function cityNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
