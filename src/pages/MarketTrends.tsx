import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Info,
  MapPin
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";

interface CityMarketStats {
  id: string;
  city: string;
  report_month: number;
  report_year: number;
  property_type: string;
  benchmark_price: number | null;
  avg_price_sqft: number | null;
  median_sale_price: number | null;
  total_inventory: number | null;
  total_sales: number | null;
  sales_ratio: number | null;
  days_on_market: number | null;
  sale_to_list_ratio: number | null;
  market_type: string | null;
  yoy_price_change: number | null;
  mom_price_change: number | null;
}

const CITIES = [
  "All Cities",
  "Vancouver",
  "Surrey",
  "Burnaby",
  "Richmond",
  "Langley",
  "Coquitlam",
  "Delta",
  "Abbotsford",
  "New Westminster",
  "Port Coquitlam",
  "Maple Ridge",
  "North Vancouver"
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIME_RANGES = [
  { value: '1', label: '1 Month' },
  { value: '3', label: '3 Months' },
  { value: '6', label: '6 Months' },
  { value: '12', label: '1 Year' },
];

export default function MarketTrends() {
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [propertyType, setPropertyType] = useState<"condo" | "townhome">("condo");
  const [timeRange, setTimeRange] = useState("6");

  // Fetch all market stats
  const { data: allStats, isLoading } = useQuery({
    queryKey: ['public-market-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('*')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });
      
      if (error) throw error;
      return data as CityMarketStats[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get unique cities from data
  const availableCities = useMemo(() => {
    if (!allStats) return CITIES;
    const cities = [...new Set(allStats.map(s => s.city))].sort();
    return ["All Cities", ...cities];
  }, [allStats]);

  // Filter stats based on selections
  const filteredStats = useMemo(() => {
    if (!allStats) return [];
    
    let filtered = allStats.filter(s => s.property_type === propertyType);
    
    if (selectedCity !== "All Cities") {
      filtered = filtered.filter(s => s.city === selectedCity);
    }

    // Filter by time range
    const monthsBack = parseInt(timeRange);
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    
    filtered = filtered.filter(s => {
      const statDate = new Date(s.report_year, s.report_month - 1, 1);
      return statDate >= cutoffDate;
    });

    return filtered;
  }, [allStats, selectedCity, propertyType, timeRange]);

  // Get latest stats for summary cards
  const latestStats = useMemo(() => {
    if (!filteredStats.length) return null;
    
    if (selectedCity !== "All Cities") {
      return filteredStats[0];
    }
    
    // For "All Cities", aggregate the latest month's data
    const latestMonth = filteredStats[0]?.report_month;
    const latestYear = filteredStats[0]?.report_year;
    const latestMonthStats = filteredStats.filter(
      s => s.report_month === latestMonth && s.report_year === latestYear
    );
    
    if (!latestMonthStats.length) return null;
    
    // Calculate averages
    const avgBenchmark = latestMonthStats.reduce((sum, s) => sum + (s.benchmark_price || 0), 0) / latestMonthStats.length;
    const avgPriceSqft = latestMonthStats.reduce((sum, s) => sum + (s.avg_price_sqft || 0), 0) / latestMonthStats.length;
    const avgSalesRatio = latestMonthStats.reduce((sum, s) => sum + (s.sales_ratio || 0), 0) / latestMonthStats.length;
    const avgDaysOnMarket = latestMonthStats.reduce((sum, s) => sum + (s.days_on_market || 0), 0) / latestMonthStats.length;
    
    return {
      benchmark_price: Math.round(avgBenchmark),
      avg_price_sqft: Math.round(avgPriceSqft),
      sales_ratio: Math.round(avgSalesRatio * 10) / 10,
      days_on_market: Math.round(avgDaysOnMarket),
      market_type: avgSalesRatio >= 20 ? 'sellers' : avgSalesRatio >= 12 ? 'balanced' : 'buyers',
      report_month: latestMonth,
      report_year: latestYear,
    };
  }, [filteredStats, selectedCity]);

  // Prepare chart data for price trends
  const priceTrendData = useMemo(() => {
    if (!filteredStats.length) return [];

    // Group by month and calculate average if "All Cities"
    const monthlyData = new Map<string, { prices: number[], sqft: number[], sales: number[], month: number, year: number }>();
    
    filteredStats.forEach(stat => {
      const key = `${stat.report_year}-${stat.report_month}`;
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { prices: [], sqft: [], sales: [], month: stat.report_month, year: stat.report_year });
      }
      const data = monthlyData.get(key)!;
      if (stat.benchmark_price) data.prices.push(stat.benchmark_price);
      if (stat.avg_price_sqft) data.sqft.push(stat.avg_price_sqft);
      if (stat.sales_ratio) data.sales.push(stat.sales_ratio);
    });

    return Array.from(monthlyData.entries())
      .map(([key, data]) => ({
        name: `${MONTH_NAMES[data.month - 1]} ${data.year}`,
        price: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length / 1000),
        priceSqft: Math.round(data.sqft.reduce((a, b) => a + b, 0) / data.sqft.length),
        salesRatio: Math.round(data.sales.reduce((a, b) => a + b, 0) / data.sales.length * 10) / 10,
        sortKey: data.year * 100 + data.month,
      }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredStats]);

  // City comparison data (latest month only)
  const cityComparisonData = useMemo(() => {
    if (!allStats) return [];
    
    const latestMonth = allStats[0]?.report_month;
    const latestYear = allStats[0]?.report_year;
    
    return allStats
      .filter(s => 
        s.property_type === propertyType && 
        s.report_month === latestMonth && 
        s.report_year === latestYear
      )
      .map(s => ({
        city: s.city,
        price: Math.round((s.benchmark_price || 0) / 1000),
        salesRatio: s.sales_ratio || 0,
        daysOnMarket: s.days_on_market || 0,
        marketType: s.market_type,
      }))
      .sort((a, b) => b.price - a.price);
  }, [allStats, propertyType]);

  // Helper functions
  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getMarketTypeLabel = (type: string | null) => {
    switch (type) {
      case 'sellers': return "Seller's Market";
      case 'balanced': return "Balanced Market";
      case 'buyers': return "Buyer's Market";
      default: return "—";
    }
  };

  const getMarketTypeColor = (type: string | null) => {
    switch (type) {
      case 'sellers': return 'bg-red-100 text-red-700 border-red-200';
      case 'balanced': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'buyers': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBarColor = (marketType: string | null) => {
    switch (marketType) {
      case 'sellers': return 'hsl(var(--destructive))';
      case 'balanced': return 'hsl(var(--primary))';
      case 'buyers': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  return (
    <>
      <Helmet>
        <title>Market Trends | Metro Vancouver Real Estate Stats</title>
        <meta name="description" content="See the latest real estate market trends for condos and townhomes in Metro Vancouver. Easy-to-understand charts showing prices, sales, and market conditions." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-muted/50 to-background py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4">
                <BarChart3 className="h-3 w-3 mr-1" />
                Market Intelligence
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Metro Vancouver Market Trends
              </h1>
              <p className="text-lg text-muted-foreground">
                Real-time market data for {propertyType === 'condo' ? 'condos' : 'townhomes'} across Metro Vancouver.
                See what's happening with prices, sales activity, and market conditions in your city.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b bg-background sticky top-16 z-30">
          <div className="container px-4 py-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Property Type Toggle */}
              <Tabs value={propertyType} onValueChange={(v) => setPropertyType(v as 'condo' | 'townhome')}>
                <TabsList className="h-10">
                  <TabsTrigger value="condo" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Condos
                  </TabsTrigger>
                  <TabsTrigger value="townhome" className="gap-2">
                    <Home className="h-4 w-4" />
                    Townhomes
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* City Filter */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px] h-10">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time Range */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {TIME_RANGES.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      timeRange === range.value 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Data Date Badge */}
              {latestStats && (
                <Badge variant="outline" className="ml-auto">
                  Data: {MONTH_NAMES[latestStats.report_month - 1]} {latestStats.report_year}
                </Badge>
              )}
            </div>
          </div>
        </section>

        <div className="container px-4 py-8 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : !latestStats ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No market data available for this selection.</p>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Average Price</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">
                      {formatPrice(latestStats.benchmark_price)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Benchmark price for {propertyType === 'condo' ? 'condos' : 'townhomes'}
                    </p>
                  </CardContent>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">Price per Sqft</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">
                      ${latestStats.avg_price_sqft || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average price per square foot
                    </p>
                  </CardContent>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Sales Activity</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">
                      {latestStats.sales_ratio}%
                    </p>
                    <Badge variant="outline" className={`mt-1 text-xs ${getMarketTypeColor(latestStats.market_type)}`}>
                      {getMarketTypeLabel(latestStats.market_type)}
                    </Badge>
                  </CardContent>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Days on Market</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">
                      {latestStats.days_on_market || '—'} days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average time to sell
                    </p>
                  </CardContent>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                </Card>
              </div>

              {/* What This Means Box */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">What does this mean?</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {latestStats.market_type === 'sellers' ? (
                          <>
                            <strong>It's a Seller's Market.</strong> This means there are more buyers than homes for sale. 
                            Homes are selling quickly (often within {latestStats.days_on_market || 30} days) and prices are strong. 
                            If you're buying, be ready to act fast. If you're selling, this is a great time!
                          </>
                        ) : latestStats.market_type === 'balanced' ? (
                          <>
                            <strong>It's a Balanced Market.</strong> There's a healthy number of buyers and sellers. 
                            Homes are selling at a steady pace with fair prices for both sides. 
                            This gives buyers time to shop around while sellers can still get good offers.
                          </>
                        ) : (
                          <>
                            <strong>It's a Buyer's Market.</strong> There are more homes for sale than buyers looking. 
                            This means you may have more negotiating power on price, and homes take longer to sell (around {latestStats.days_on_market || 60} days). 
                            Great time to find a deal!
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Price Trend Chart */}
              {priceTrendData.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Price Trends Over Time
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      How {propertyType === 'condo' ? 'condo' : 'townhome'} prices have changed
                      {selectedCity !== "All Cities" ? ` in ${selectedCity}` : ' across Metro Vancouver'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] md:h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceTrendData}>
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${value}K`}
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value}K`, 'Avg Price']}
                            contentStyle={{ 
                              background: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* City Comparison Chart */}
              {selectedCity === "All Cities" && cityComparisonData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Compare Cities
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      See how {propertyType === 'condo' ? 'condo' : 'townhome'} prices compare across cities. 
                      Colors show market conditions: <span className="text-red-600">red = seller's market</span>, 
                      <span className="text-yellow-600"> yellow = balanced</span>, 
                      <span className="text-green-600"> green = buyer's market</span>.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] md:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cityComparisonData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            type="number"
                            tickFormatter={(value) => `$${value}K`}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            type="category"
                            dataKey="city"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value}K`, 'Price']}
                            contentStyle={{ 
                              background: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                            {cityComparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBarColor(entry.marketType)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* City Stats Table */}
              {selectedCity === "All Cities" && cityComparisonData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>City-by-City Breakdown</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Detailed stats for each city
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-sm">City</th>
                            <th className="text-right py-3 px-2 font-medium text-sm">Avg Price</th>
                            <th className="text-right py-3 px-2 font-medium text-sm">Sales Ratio</th>
                            <th className="text-right py-3 px-2 font-medium text-sm">Days to Sell</th>
                            <th className="text-center py-3 px-2 font-medium text-sm">Market</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cityComparisonData.map((city, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-2 font-medium">{city.city}</td>
                              <td className="py-3 px-2 text-right">${city.price}K</td>
                              <td className="py-3 px-2 text-right">{city.salesRatio}%</td>
                              <td className="py-3 px-2 text-right">{city.daysOnMarket} days</td>
                              <td className="py-3 px-2 text-center">
                                <Badge variant="outline" className={`text-xs ${getMarketTypeColor(city.marketType)}`}>
                                  {city.marketType === 'sellers' ? "Seller's" : city.marketType === 'buyers' ? "Buyer's" : "Balanced"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Understanding the Numbers */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">📊 Understanding the Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Sales Ratio</h4>
                      <p className="text-muted-foreground">
                        This tells us how "hot" the market is. It's the percentage of homes that sold vs. how many were for sale.
                      </p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>• <span className="text-red-600 font-medium">Above 20%</span> = Seller's market (homes sell fast!)</li>
                        <li>• <span className="text-yellow-600 font-medium">12-20%</span> = Balanced market (normal conditions)</li>
                        <li>• <span className="text-green-600 font-medium">Below 12%</span> = Buyer's market (more choice, less pressure)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Days on Market</h4>
                      <p className="text-muted-foreground">
                        The average time it takes for a home to sell. Fewer days means homes are selling quickly (hot market). 
                        More days means buyers have more time to decide.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Benchmark Price</h4>
                      <p className="text-muted-foreground">
                        This is the "typical" price for a home in that area. It's calculated by the Real Estate Board to show 
                        what a standard home costs, so you can compare apples to apples.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Price per Square Foot</h4>
                      <p className="text-muted-foreground">
                        How much you pay for each square foot of space. This helps you compare homes of different sizes. 
                        A smaller condo might cost less overall but have a higher price per sqft.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Source */}
              <p className="text-xs text-muted-foreground text-center">
                Data sourced from REBGV, FVREB, and CMHC. Updated monthly. 
                For investment decisions, please consult with a licensed real estate professional.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
