import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyValueTrendsProps {
  city: string;
  neighborhood: string | null;
  propertyType: string;
  currentPrice: number;
}

interface MonthlyData {
  month: string;
  avgPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const formatFullPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

export function PropertyValueTrends({ 
  city, 
  neighborhood, 
  propertyType,
  currentPrice 
}: PropertyValueTrendsProps) {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ["property-trends", city, neighborhood, propertyType],
    queryFn: async () => {
      // Get listings from the last 12 months for this area
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      let query = supabase
        .from("mls_listings")
        .select("listing_price, list_date, property_type")
        .eq("city", city)
        .gte("list_date", twelveMonthsAgo.toISOString().split('T')[0])
        .not("listing_price", "is", null)
        .not("list_date", "is", null)
        .order("list_date", { ascending: true });

      // Filter by neighborhood if available
      if (neighborhood) {
        query = query.eq("neighborhood", neighborhood);
      }

      // Filter by similar property types
      if (propertyType) {
        query = query.ilike("property_type", `%${propertyType.split('/')[0]}%`);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Group by month and calculate averages
      const monthlyGroups: Record<string, number[]> = {};
      
      data.forEach((listing) => {
        if (listing.list_date && listing.listing_price) {
          const date = new Date(listing.list_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = [];
          }
          monthlyGroups[monthKey].push(listing.listing_price);
        }
      });

      // Convert to chart data
      const chartData: MonthlyData[] = Object.entries(monthlyGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, prices]) => {
          const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
          return {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            avgPrice: Math.round(avgPrice),
            count: prices.length,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
          };
        });

      // Calculate trend
      let trendPercent = 0;
      if (chartData.length >= 2) {
        const firstPrice = chartData[0].avgPrice;
        const lastPrice = chartData[chartData.length - 1].avgPrice;
        trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      }

      return {
        chartData,
        trendPercent,
        totalListings: data.length,
        avgPrice: Math.round(data.reduce((sum, l) => sum + (l.listing_price || 0), 0) / data.length),
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-xl p-4 md:p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!trendData || trendData.chartData.length < 2) {
    return null; // Don't show if not enough data
  }

  const { chartData, trendPercent, totalListings, avgPrice } = trendData;
  const isUp = trendPercent > 0;
  const isDown = trendPercent < 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyData;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-foreground">Avg: {formatFullPrice(data.avgPrice)}</p>
          <p className="text-muted-foreground text-xs">
            Range: {formatPrice(data.minPrice)} - {formatPrice(data.maxPrice)}
          </p>
          <p className="text-muted-foreground text-xs">{data.count} listings</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Price Trends</h3>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Average listing prices for similar properties in {neighborhood || city} over the last 12 months.
                    Based on {totalListings} listings.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {neighborhood ? `${neighborhood}, ${city}` : city} • {propertyType}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`gap-1 ${
              isUp ? "bg-green-500/10 text-green-700" : 
              isDown ? "bg-red-500/10 text-red-700" : 
              "bg-muted text-muted-foreground"
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : 
             isDown ? <TrendingDown className="h-3 w-3" /> : 
             <Minus className="h-3 w-3" />}
            {isUp ? "+" : ""}{trendPercent.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-background rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Avg Price</p>
          <p className="font-semibold text-sm">{formatPrice(avgPrice)}</p>
        </div>
        <div className="bg-background rounded-lg p-2">
          <p className="text-xs text-muted-foreground">This Property</p>
          <p className="font-semibold text-sm">{formatPrice(currentPrice)}</p>
        </div>
        <div className="bg-background rounded-lg p-2">
          <p className="text-xs text-muted-foreground">vs Market</p>
          <p className={`font-semibold text-sm ${
            currentPrice < avgPrice ? "text-green-600" : 
            currentPrice > avgPrice ? "text-amber-600" : ""
          }`}>
            {currentPrice < avgPrice ? 
              `-${formatPrice(avgPrice - currentPrice)}` : 
              currentPrice > avgPrice ?
              `+${formatPrice(currentPrice - avgPrice)}` :
              "At avg"
            }
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={formatPrice}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avgPrice"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Based on {totalListings} listings in the last 12 months
      </p>
    </div>
  );
}
