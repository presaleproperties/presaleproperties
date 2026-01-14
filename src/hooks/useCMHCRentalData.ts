import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CMHCRentalData {
  id: string;
  city: string;
  zone: string | null;
  report_year: number;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  avg_rent_3br: number | null;
  vacancy_rate_overall: number | null;
  vacancy_rate_1br: number | null;
  vacancy_rate_2br: number | null;
  yoy_rent_change_1br: number | null;
  yoy_rent_change_2br: number | null;
  data_quality: 'verified' | 'interpolated' | 'estimated';
  source_url: string | null;
}

// Get the latest CMHC rental data for a specific city
export function useLatestCMHCData(city: string) {
  return useQuery({
    queryKey: ['cmhc-rental-data', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cmhc_rental_data')
        .select('*')
        .ilike('city', city)
        .order('report_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CMHCRentalData | null;
    },
    staleTime: 10 * 60 * 1000, // 10 minute cache
    enabled: !!city,
  });
}

// Get all CMHC rental data for the latest year
export function useAllLatestCMHCData() {
  return useQuery({
    queryKey: ['cmhc-rental-data-all-latest'],
    queryFn: async () => {
      // Get the most recent year
      const { data: latestYear } = await supabase
        .from('cmhc_rental_data')
        .select('report_year')
        .order('report_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestYear) return [];

      const { data, error } = await supabase
        .from('cmhc_rental_data')
        .select('*')
        .eq('report_year', latestYear.report_year)
        .order('city');

      if (error) throw error;
      return data as CMHCRentalData[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Calculate rental yield from CMHC data and benchmark price
export function calculateRentalYield(
  monthlyRent: number | null,
  benchmarkPrice: number | null
): number | null {
  if (!monthlyRent || !benchmarkPrice || benchmarkPrice === 0) return null;
  return Number(((monthlyRent * 12) / benchmarkPrice * 100).toFixed(2));
}

// Get verified rental metrics for a city (combines CMHC with Snap Stats prices)
export function useVerifiedRentalMetrics(city: string, benchmarkPrice: number | null) {
  const { data: cmhcData, isLoading } = useLatestCMHCData(city);

  const metrics = cmhcData ? {
    avgRent1br: cmhcData.avg_rent_1br,
    avgRent2br: cmhcData.avg_rent_2br,
    avgRent3br: cmhcData.avg_rent_3br,
    vacancyRate: cmhcData.vacancy_rate_overall,
    yoyRentChange: cmhcData.yoy_rent_change_2br,
    rentalYield: calculateRentalYield(cmhcData.avg_rent_2br, benchmarkPrice),
    dataQuality: cmhcData.data_quality,
    reportYear: cmhcData.report_year,
    sourceUrl: cmhcData.source_url,
    isVerified: cmhcData.data_quality === 'verified',
  } : null;

  return { metrics, isLoading, cmhcData };
}