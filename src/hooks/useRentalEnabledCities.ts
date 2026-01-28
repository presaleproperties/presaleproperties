import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ENABLED_CITIES } from "./useEnabledCities";

export function useRentalEnabledCities() {
  return useQuery({
    queryKey: ["rental-enabled-cities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "rental_enabled_cities")
        .maybeSingle();

      // Return saved cities or defaults (same as resale for now)
      return (data?.value as string[] | null) || DEFAULT_ENABLED_CITIES;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}
