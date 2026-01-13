import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CityMarketStats {
  id: string;
  city: string;
  report_month: number;
  report_year: number;
  property_type: 'condo' | 'townhome' | 'detached';
  benchmark_price: number | null;
  avg_price_sqft: number | null;
  median_sale_price: number | null;
  total_inventory: number | null;
  total_sales: number | null;
  sales_ratio: number | null;
  days_on_market: number | null;
  sale_to_list_ratio: number | null;
  hottest_price_band: string | null;
  hottest_price_band_ratio: number | null;
  market_type: 'buyers' | 'balanced' | 'sellers' | null;
  yoy_price_change: number | null;
  mom_price_change: number | null;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  rental_yield: number | null;
  source_board: string | null;
  report_summary: string | null;
}

// Get the latest stats for a specific city and property type
export function useLatestCityStats(city: string, propertyType: 'condo' | 'townhome' = 'condo') {
  return useQuery({
    queryKey: ['city-market-stats', city, propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('*')
        .eq('city', city)
        .eq('property_type', propertyType)
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CityMarketStats | null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!city,
  });
}

// Get trend data for a city (last 12 months)
export function useCityStatsTrend(city: string, propertyType: 'condo' | 'townhome' = 'condo') {
  return useQuery({
    queryKey: ['city-market-trend', city, propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('*')
        .eq('city', city)
        .eq('property_type', propertyType)
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data as CityMarketStats[]).reverse(); // Oldest first for charts
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!city,
  });
}

// Get all latest stats across all cities
export function useAllLatestStats(propertyType?: 'condo' | 'townhome') {
  return useQuery({
    queryKey: ['all-market-stats', propertyType],
    queryFn: async () => {
      // Get the most recent month/year
      const { data: latest, error: latestError } = await supabase
        .from('city_market_stats')
        .select('report_month, report_year')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError || !latest) return [];

      let query = supabase
        .from('city_market_stats')
        .select('*')
        .eq('report_month', latest.report_month)
        .eq('report_year', latest.report_year)
        .order('city');

      if (propertyType) {
        query = query.eq('property_type', propertyType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CityMarketStats[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get market comparison across cities for same month
export function useMarketComparison(propertyType: 'condo' | 'townhome' = 'condo') {
  return useQuery({
    queryKey: ['market-comparison', propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('city, benchmark_price, sales_ratio, market_type, yoy_price_change, avg_price_sqft')
        .eq('property_type', propertyType)
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      if (error) throw error;

      // Group by city and get latest for each
      const latestByCity = new Map<string, CityMarketStats>();
      for (const stat of data as CityMarketStats[]) {
        if (!latestByCity.has(stat.city)) {
          latestByCity.set(stat.city, stat);
        }
      }

      return Array.from(latestByCity.values());
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get report metadata (latest report date)
export function useLatestReportDate() {
  return useQuery({
    queryKey: ['latest-report-date'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('report_month, report_year')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: data.report_month,
        year: data.report_year,
        label: `${monthNames[data.report_month - 1]} ${data.report_year}`,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
