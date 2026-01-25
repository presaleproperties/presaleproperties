import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Default to 2024 (new construction only)
const DEFAULT_MIN_YEAR = 2024;

/**
 * Hook to fetch the minimum year built filter for resale listings.
 * This allows admins to configure which years of homes are shown on the site.
 */
export function useMinYearBuilt() {
  return useQuery({
    queryKey: ["resale-min-year-built"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "resale_min_year_built")
        .maybeSingle();

      // Return saved year or default
      return (data?.value as number | null) || DEFAULT_MIN_YEAR;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

// Export the default for components that need it before the hook resolves
export const DEFAULT_MIN_YEAR_BUILT = DEFAULT_MIN_YEAR;
