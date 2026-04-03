import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AppSettingKey =
  | "whatsapp_number"
  | "exit_intent_pdf_url"
  | "ga4_measurement_id"
  | "theme_settings"
  | "mls_enabled_cities"
  | "resale_min_year_built";

/**
 * Shared hook for reading app_settings values.
 * Caches results via react-query — no duplicate fetches across components.
 */
export function useAppSetting<T = string>(key: AppSettingKey) {
  return useQuery({
    queryKey: ["app-setting", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as T | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
