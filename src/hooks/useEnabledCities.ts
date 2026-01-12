import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Default Metro Vancouver & Fraser Valley cities - excludes Vancouver Island (Langford, Victoria, etc.)
const DEFAULT_ENABLED_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", 
  "Coquitlam", "Delta", "Abbotsford", "New Westminster", 
  "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
  "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
  "Pitt Meadows", "Tsawwassen", "Ladner"
];

export function useEnabledCities() {
  return useQuery({
    queryKey: ["mls-enabled-cities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "mls_enabled_cities")
        .maybeSingle();
      
      // Return saved cities or defaults
      return (data?.value as string[] | null) || DEFAULT_ENABLED_CITIES;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export { DEFAULT_ENABLED_CITIES };
