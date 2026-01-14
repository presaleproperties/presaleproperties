import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Home, 
  DollarSign, 
  Activity, 
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Calendar,
  MapPin,
  Upload
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
  ComposedChart
} from "recharts";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CityMarketStats {
  id: string;
  city: string;
  property_type: string;
  report_month: number;
  report_year: number;
  benchmark_price: number | null;
  median_sale_price: number | null;
  avg_price_sqft: number | null;
  yoy_price_change: number | null;
  mom_price_change: number | null;
  total_sales: number | null;
  total_inventory: number | null;
  sales_ratio: number | null;
  market_type: string | null;
  days_on_market: number | null;
  hottest_price_band: string | null;
  hottest_price_band_ratio: number | null;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  rental_yield: number | null;
  source_board: string | null;
  report_summary: string | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIME_RANGES = [
  { label: '1 Month', value: 1 },
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '1 Year', value: 12 },
];

const PRIMARY_CITIES = [
  'Vancouver', 'Burnaby', 'Surrey', 'Richmond', 'Coquitlam', 
  'Langley', 'New Westminster', 'Delta', 'North Vancouver', 'Port Moody'
];

export default function AdminMarketDashboard() {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<'condo' | 'townhome'>('condo');
  const [timeRange, setTimeRange] = useState<number>(12);

  // Fetch all market stats
  const { data: allStats, isLoading } = useQuery({
    queryKey: ['market-dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('*')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });
      
      if (error) throw error;
      return data as CityMarketStats[];
    },
  });

  // Get unique cities
  const cities = useMemo(() => {
    if (!allStats) return [];
    const uniqueCities = [...new Set(allStats.map(s => s.city))];
    return uniqueCities.sort((a, b) => {
      const aIdx = PRIMARY_CITIES.indexOf(a);
      const bIdx = PRIMARY_CITIES.indexOf(b);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [allStats]);

  // Get available date range
  const dateRange = useMemo(() => {
    if (!allStats || allStats.length === 0) return { months: 0, earliest: null, latest: null };
    
    const dates = allStats.map(s => ({ month: s.report_month, year: s.report_year }));
    const sortedDates = dates.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const uniqueDates = sortedDates.filter((d, i, arr) => 
      i === 0 || d.month !== arr[i-1].month || d.year !== arr[i-1].year
    );
    
    return {
      months: uniqueDates.length,
      earliest: uniqueDates[uniqueDates.length - 1],
      latest: uniqueDates[0]
    };
  }, [allStats]);

  // Filter stats by property type and time range
  const filteredStats = useMemo(() => {
    if (!allStats) return [];
    
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - timeRange, 1);
    
    return allStats.filter(s => {
      const statDate = new Date(s.report_year, s.report_month - 1, 1);
      const matchesType = s.property_type === selectedPropertyType;
      const matchesCity = selectedCity === 'all' || s.city === selectedCity;
      const inRange = statDate >= cutoffDate;
      return matchesType && matchesCity && inRange;
    });
  }, [allStats, selectedPropertyType, selectedCity, timeRange]);

  // Get latest stats for comparison cards
  const latestStats = useMemo(() => {
    if (!allStats || allStats.length === 0) return null;
    
    const latestDate = allStats.reduce((latest, s) => {
      const sDate = s.report_year * 12 + s.report_month;
      const lDate = latest.year * 12 + latest.month;
      return sDate > lDate ? { year: s.report_year, month: s.report_month } : latest;
    }, { year: 0, month: 0 });
    
    return allStats.filter(s => 
      s.report_year === latestDate.year && 
      s.report_month === latestDate.month &&
      s.property_type === selectedPropertyType
    );
  }, [allStats, selectedPropertyType]);

  // Prepare chart data for price trends
  const priceChartData = useMemo(() => {
    if (!filteredStats || filteredStats.length === 0) return [];
    
    // Group by month-year
    const groupedByDate = filteredStats.reduce((acc, s) => {
      const key = `${s.report_year}-${s.report_month}`;
      if (!acc[key]) {
        acc[key] = {
          label: `${MONTH_NAMES[s.report_month - 1]} ${s.report_year}`,
          month: s.report_month,
          year: s.report_year,
          prices: [],
          priceSqft: [],
        };
      }
      if (s.benchmark_price) acc[key].prices.push(s.benchmark_price);
      if (s.avg_price_sqft) acc[key].priceSqft.push(s.avg_price_sqft);
      return acc;
    }, {} as Record<string, { label: string; month: number; year: number; prices: number[]; priceSqft: number[] }>);
    
    return Object.values(groupedByDate)
      .map(d => ({
        ...d,
        avgPrice: d.prices.length > 0 ? Math.round(d.prices.reduce((a, b) => a + b, 0) / d.prices.length) : null,
        avgPriceSqft: d.priceSqft.length > 0 ? Math.round(d.priceSqft.reduce((a, b) => a + b, 0) / d.priceSqft.length) : null,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  }, [filteredStats]);

  // City comparison data
  const cityComparisonData = useMemo(() => {
    if (!latestStats || latestStats.length === 0) return [];
    
    return latestStats
      .filter(s => PRIMARY_CITIES.includes(s.city))
      .sort((a, b) => (b.benchmark_price || 0) - (a.benchmark_price || 0))
      .slice(0, 10);
  }, [latestStats]);

  // Market health data (sales ratio by city)
  const marketHealthData = useMemo(() => {
    if (!latestStats || latestStats.length === 0) return [];
    
    return latestStats
      .filter(s => s.sales_ratio !== null)
      .sort((a, b) => (b.sales_ratio || 0) - (a.sales_ratio || 0))
      .slice(0, 10)
      .map(s => ({
        city: s.city,
        salesRatio: s.sales_ratio,
        marketType: s.market_type,
        daysOnMarket: s.days_on_market,
      }));
  }, [latestStats]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (!latestStats || latestStats.length === 0) return null;
    
    const prices = latestStats.map(s => s.benchmark_price).filter(Boolean) as number[];
    const salesRatios = latestStats.map(s => s.sales_ratio).filter(Boolean) as number[];
    const daysOnMarket = latestStats.map(s => s.days_on_market).filter(Boolean) as number[];
    const yoyChanges = latestStats.map(s => s.yoy_price_change).filter(Boolean) as number[];
    
    return {
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      avgSalesRatio: salesRatios.length > 0 ? Math.round(salesRatios.reduce((a, b) => a + b, 0) / salesRatios.length * 10) / 10 : null,
      avgDaysOnMarket: daysOnMarket.length > 0 ? Math.round(daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length) : null,
      avgYoyChange: yoyChanges.length > 0 ? Math.round(yoyChanges.reduce((a, b) => a + b, 0) / yoyChanges.length * 10) / 10 : null,
      totalCities: latestStats.length,
    };
  }, [latestStats]);

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getMarketTypeColor = (type: string | null) => {
    switch (type) {
      case 'sellers': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'balanced': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'buyers': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Market Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visual trends and insights for BC real estate markets
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/admin/market-data">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Data
              </Button>
            </Link>
          </div>
        </div>

        {/* Data Coverage Alert */}
        {dateRange.months < 12 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Limited Historical Data</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You have <strong>{dateRange.months} month(s)</strong> of data 
                    {dateRange.earliest && dateRange.latest && (
                      <> from {MONTH_NAMES[dateRange.earliest.month - 1]} {dateRange.earliest.year} to {MONTH_NAMES[dateRange.latest.month - 1]} {dateRange.latest.year}</>
                    )}.
                    For full trend analysis, upload at least 12 months of Snap Stats PDFs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(t => (
                  <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={selectedPropertyType} onValueChange={(v) => setSelectedPropertyType(v as 'condo' | 'townhome')}>
            <TabsList>
              <TabsTrigger value="condo" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Condos
              </TabsTrigger>
              <TabsTrigger value="townhome" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                Townhomes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Cards */}
        {summaryMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Benchmark Price</p>
                    <p className="text-2xl font-bold">{formatPrice(summaryMetrics.avgPrice)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {summaryMetrics.avgYoyChange !== null && (
                  <div className={`flex items-center gap-1 mt-2 text-sm ${summaryMetrics.avgYoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getChangeIcon(summaryMetrics.avgYoyChange)}
                    <span>{summaryMetrics.avgYoyChange > 0 ? '+' : ''}{summaryMetrics.avgYoyChange}% YoY</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Sales Ratio</p>
                    <p className="text-2xl font-bold">{summaryMetrics.avgSalesRatio ? `${summaryMetrics.avgSalesRatio}%` : '—'}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {summaryMetrics.avgSalesRatio && summaryMetrics.avgSalesRatio > 20 ? "Seller's market" : 
                   summaryMetrics.avgSalesRatio && summaryMetrics.avgSalesRatio < 12 ? "Buyer's market" : "Balanced"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Days on Market</p>
                    <p className="text-2xl font-bold">{summaryMetrics.avgDaysOnMarket ? `${summaryMetrics.avgDaysOnMarket} days` : '—'}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Average time to sell</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cities Tracked</p>
                    <p className="text-2xl font-bold">{summaryMetrics.totalCities}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedPropertyType === 'condo' ? 'Condo' : 'Townhome'} markets
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Trends Over Time
              </CardTitle>
              <CardDescription>
                Average benchmark prices {selectedCity !== 'all' ? `in ${selectedCity}` : 'across all cities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceChartData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceChartData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatPrice(v)}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{label}</p>
                                <p className="text-primary">
                                  Benchmark: {formatPrice(payload[0]?.value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
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
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No data available for selected filters
                </div>
              )}
            </CardContent>
          </Card>

          {/* City Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Price by City
              </CardTitle>
              <CardDescription>
                Benchmark prices comparison (latest data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cityComparisonData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityComparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(v) => formatPrice(v)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="city" 
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]?.payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.city}</p>
                                <p className="text-primary">{formatPrice(data.benchmark_price)}</p>
                                {data.yoy_price_change && (
                                  <p className={data.yoy_price_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {data.yoy_price_change > 0 ? '+' : ''}{data.yoy_price_change}% YoY
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="benchmark_price" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No city data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Health Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Market Activity
              </CardTitle>
              <CardDescription>
                Sales ratios by city (higher = seller's market)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketHealthData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketHealthData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        domain={[0, 40]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="city" 
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]?.payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.city}</p>
                                <p className="text-blue-600">Sales Ratio: {data.salesRatio}%</p>
                                <p className="text-muted-foreground">
                                  {data.marketType ? `${data.marketType.charAt(0).toUpperCase() + data.marketType.slice(1)}'s Market` : '—'}
                                </p>
                                {data.daysOnMarket && (
                                  <p className="text-amber-600">{data.daysOnMarket} days on market</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="salesRatio" 
                        fill="hsl(var(--chart-2))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No market data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* City Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>City Market Details</CardTitle>
            <CardDescription>
              Latest {selectedPropertyType} statistics for each city
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestStats && latestStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">City</th>
                      <th className="text-right py-3 px-2 font-medium">Benchmark</th>
                      <th className="text-right py-3 px-2 font-medium">$/Sqft</th>
                      <th className="text-right py-3 px-2 font-medium">YoY Change</th>
                      <th className="text-right py-3 px-2 font-medium">Sales Ratio</th>
                      <th className="text-center py-3 px-2 font-medium">Market</th>
                      <th className="text-right py-3 px-2 font-medium">Days on Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestStats
                      .sort((a, b) => (b.benchmark_price || 0) - (a.benchmark_price || 0))
                      .map((stat) => (
                        <tr key={stat.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{stat.city}</td>
                          <td className="py-3 px-2 text-right">{formatPrice(stat.benchmark_price)}</td>
                          <td className="py-3 px-2 text-right">
                            {stat.avg_price_sqft ? `$${stat.avg_price_sqft}` : '—'}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {stat.yoy_price_change !== null ? (
                              <span className={stat.yoy_price_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {stat.yoy_price_change > 0 ? '+' : ''}{stat.yoy_price_change}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {stat.sales_ratio ? `${stat.sales_ratio}%` : '—'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {stat.market_type && (
                              <Badge variant="outline" className={getMarketTypeColor(stat.market_type)}>
                                {stat.market_type.charAt(0).toUpperCase() + stat.market_type.slice(1)}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {stat.days_on_market ? `${stat.days_on_market} days` : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No data available. Upload Snap Stats to populate this dashboard.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple Explainer */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-3">📊 Understanding the Numbers</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-primary">Benchmark Price</p>
                <p className="text-muted-foreground">The typical price for a standard home in that area. Think of it as what "most" homes cost.</p>
              </div>
              <div>
                <p className="font-medium text-blue-600">Sales Ratio</p>
                <p className="text-muted-foreground">How many homes sold vs. listed. Above 20% = seller's market (prices rise). Below 12% = buyer's market.</p>
              </div>
              <div>
                <p className="font-medium text-amber-600">Days on Market</p>
                <p className="text-muted-foreground">Average time to sell. Lower = hot market. Higher = buyers have more time to negotiate.</p>
              </div>
              <div>
                <p className="font-medium text-green-600">YoY Change</p>
                <p className="text-muted-foreground">Year-over-year price change. Positive = prices went up from last year. Negative = prices dropped.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
