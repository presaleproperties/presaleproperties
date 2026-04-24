import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingProject {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  neighborhood: string | null;
  starting_price: number | null;
  featured_image: string | null;
  project_type: string | null;
  short_description: string | null;
  hotness_score: number;
}

/**
 * Fetches the top N trending projects ranked by a weighted Hotness Score
 * (views + recent leads + recent deck visits + editorial boost - freshness decay).
 *
 * One shared cache feeds all promo slots — Spotlight, Trending, Secondary,
 * Rising Star — so the homepage makes a single network request regardless of
 * how many promo slots are rendered.
 */
export function useTrendingProjects(limit = 4) {
  return useQuery({
    queryKey: ["trending-projects", limit],
    queryFn: async (): Promise<TrendingProject[]> => {
      const { data, error } = await supabase.rpc("get_trending_projects", {
        result_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as TrendingProject[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — trending shifts slowly
    gcTime: 30 * 60 * 1000,
  });
}
