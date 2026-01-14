import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useLatestCMHCData, calculateRentalYield } from "@/hooks/useCMHCRentalData";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Home,
  DollarSign,
  Activity,
  Clock,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  FileText,
  Percent
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface CityMarketStats {
  id: string;
  city: string;
  report_month: number;
  report_year: number;
  property_type: string;
  benchmark_price: number | null;
  avg_price_sqft: number | null;
  total_inventory: number | null;
  total_sales: number | null;
  sales_ratio: number | null;
  days_on_market: number | null;
  sale_to_list_ratio: number | null;
  hottest_price_band: string | null;
  hottest_price_band_ratio: number | null;
  market_type: string | null;
  yoy_price_change: number | null;
  mom_price_change: number | null;
  source_board: string | null;
  report_summary: string | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SOURCE_URLS: Record<string, string> = {
  'REBGV': 'https://www.rebgv.org/market-watch',
  'FVREB': 'https://www.fvreb.bc.ca/statistics',
};

const SOURCE_NAMES: Record<string, string> = {
  'REBGV': 'Real Estate Board of Greater Vancouver',
  'FVREB': 'Fraser Valley Real Estate Board',
};

export default function CityMarketReport() {
  const { city } = useParams<{ city: string }>();
  const [propertyType, setPropertyType] = useState<'condo' | 'townhome'>('condo');
  
  const cityName = city?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';

  // Fetch ONLY verified data (not estimated)
  const { data: allStats, isLoading } = useQuery({
    queryKey: ['city-market-report', cityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_stats')
        .select('*')
        .ilike('city', cityName)
        .neq('source_board', 'Estimated')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      if (error) throw error;
      return data as CityMarketStats[];
    },
    enabled: !!cityName,
  });

  // Fetch CMHC rental data
  const { data: cmhcData } = useLatestCMHCData(cityName);

  // Get latest stats for selected property type
  const latestStats = useMemo(() => {
    if (!allStats) return null;
    return allStats.find(s => s.property_type === propertyType);
  }, [allStats, propertyType]);

  // Calculate rental yield from verified sources
  const rentalYield = useMemo(() => {
    if (!cmhcData?.avg_rent_2br || !latestStats?.benchmark_price) return null;
    return calculateRentalYield(cmhcData.avg_rent_2br, latestStats.benchmark_price);
  }, [cmhcData, latestStats]);

  // Get historical data for charts (last 12 months)
  const historicalData = useMemo(() => {
    if (!allStats) return [];
    return allStats
      .filter(s => s.property_type === propertyType)
      .slice(0, 12)
      .reverse()
      .map(s => ({
        month: `${MONTH_NAMES[s.report_month - 1]} ${s.report_year}`,
        price: s.benchmark_price,
        salesRatio: s.sales_ratio,
        dom: s.days_on_market,
      }));
  }, [allStats, propertyType]);

  // Get available property types
  const availableTypes = useMemo(() => {
    if (!allStats) return [];
    return [...new Set(allStats.map(s => s.property_type))];
  }, [allStats]);

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const formatDate = (month: number, year: number) => {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  const getMarketTypeColor = (type: string | null) => {
    switch (type) {
      case 'sellers': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'balanced': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'buyers': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const breadcrumbItems = [
    { label: 'Market Reports', href: '/market-trends' },
    { label: `${cityName} Market Report` },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-80" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!allStats || allStats.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl font-bold mt-4 mb-4">{cityName} Market Report</h1>
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Verified Data Available</h2>
            <p className="text-muted-foreground mb-4">
              We don't have verified market data for {cityName} yet. Check back soon or explore other cities.
            </p>
            <Button asChild>
              <Link to="/market-trends">View All Market Data</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const sourceBoard = latestStats?.source_board || allStats[0]?.source_board;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{cityName} Real Estate Market Report {new Date().getFullYear()} | Presale Properties</title>
        <meta 
          name="description" 
          content={`${cityName} real estate market report with verified data from ${SOURCE_NAMES[sourceBoard || 'REBGV']}. Benchmark prices, sales ratios, days on market, and price trends.`} 
        />
        <link rel="canonical" href={`https://presaleproperties.lovable.app/market-report/${city}`} />
      </Helmet>

      <Header />

      <main className="flex-1">
        <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
          <Breadcrumbs items={breadcrumbItems} />

          {/* Header */}
          <div className="mt-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified Data Only
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {cityName} Real Estate Market Report
                </h1>
                {latestStats && (
                  <p className="text-muted-foreground mt-1">
                    Last updated: {formatDate(latestStats.report_month, latestStats.report_year)}
                  </p>
                )}
              </div>

              {/* Source Attribution */}
              {sourceBoard && (
                <Card className="bg-muted/50 border-primary/20 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Data Source</p>
                      <a 
                        href={SOURCE_URLS[sourceBoard]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {SOURCE_NAMES[sourceBoard]}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">
                        Official MLS® benchmark data
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Property Type Tabs */}
          <Tabs value={propertyType} onValueChange={(v) => setPropertyType(v as 'condo' | 'townhome')} className="mb-6">
            <TabsList>
              {availableTypes.includes('condo') && (
                <TabsTrigger value="condo" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Condos
                </TabsTrigger>
              )}
              {availableTypes.includes('townhome') && (
                <TabsTrigger value="townhome" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Townhomes
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {latestStats ? (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Benchmark Price</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPrice(latestStats.benchmark_price)}</p>
                  {latestStats.yoy_price_change !== null && (
                    <div className={`flex items-center gap-1 text-sm mt-1 ${latestStats.yoy_price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {latestStats.yoy_price_change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {latestStats.yoy_price_change > 0 ? '+' : ''}{latestStats.yoy_price_change}% YoY
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Price/Sqft</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {latestStats.avg_price_sqft ? `$${latestStats.avg_price_sqft}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Avg sale price per sqft</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Sales Ratio</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {latestStats.sales_ratio ? `${latestStats.sales_ratio}%` : '—'}
                  </p>
                  {latestStats.market_type && (
                    <Badge variant="outline" className={`mt-1 text-xs ${getMarketTypeColor(latestStats.market_type)}`}>
                      {latestStats.market_type.charAt(0).toUpperCase() + latestStats.market_type.slice(1)} Market
                    </Badge>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Days on Market</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {latestStats.days_on_market ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Average listing duration</p>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {latestStats.total_sales !== null && latestStats.total_inventory !== null && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Market Activity
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Sales</span>
                        <span className="font-medium">{latestStats.total_sales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Inventory</span>
                        <span className="font-medium">{latestStats.total_inventory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sale-to-List Ratio</span>
                        <span className="font-medium">{latestStats.sale_to_list_ratio ? `${latestStats.sale_to_list_ratio}%` : '—'}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {latestStats.hottest_price_band && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Hottest Price Band
                    </h3>
                    <p className="text-lg font-bold text-primary">{latestStats.hottest_price_band}</p>
                    {latestStats.hottest_price_band_ratio && (
                      <p className="text-sm text-muted-foreground">
                        {latestStats.hottest_price_band_ratio}% sales ratio in this range
                      </p>
                    )}
                  </Card>
                )}

                {latestStats.mom_price_change !== null && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Price Momentum
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Month-over-Month</span>
                        <span className={`font-medium ${latestStats.mom_price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {latestStats.mom_price_change > 0 ? '+' : ''}{latestStats.mom_price_change}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Year-over-Year</span>
                        <span className={`font-medium ${(latestStats.yoy_price_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(latestStats.yoy_price_change || 0) > 0 ? '+' : ''}{latestStats.yoy_price_change || 0}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* CMHC Rental Data Section */}
              {cmhcData && (
                <Card className="mb-8 border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      Rental Market Data
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        CMHC Verified
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Avg 1BR Rent</p>
                        <p className="text-xl font-bold">${cmhcData.avg_rent_1br?.toLocaleString() || '—'}</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Avg 2BR Rent</p>
                        <p className="text-xl font-bold">${cmhcData.avg_rent_2br?.toLocaleString() || '—'}</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Vacancy Rate</p>
                        <p className="text-xl font-bold">{cmhcData.vacancy_rate_overall || '—'}%</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Rental Yield</p>
                        <p className="text-xl font-bold text-green-600">{rentalYield || '—'}%</p>
                        <p className="text-[10px] text-muted-foreground">Based on 2BR rent</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Source: CMHC Rental Market Report {cmhcData.report_year}</span>
                      <a 
                        href="https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}
              {historicalData.length > 1 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Benchmark Price Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalData}>
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis 
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatPrice(value), 'Price']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
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

              {/* Market Summary */}
              {latestStats.report_summary && (
                <Card className="mb-8 bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Market Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {latestStats.report_summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Data Methodology */}
              <Card className="bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        Verified Data Methodology
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        All data on this page comes directly from the {SOURCE_NAMES[sourceBoard || 'REBGV']} 
                        Snap Stats reports. These are official MLS® benchmark statistics based on actual 
                        sales transactions. We do not display estimated or interpolated data.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white/50 text-green-700 border-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          MLS® Verified
                        </Badge>
                        <Badge variant="outline" className="bg-white/50 text-green-700 border-green-300">
                          <Calendar className="h-3 w-3 mr-1" />
                          Updated Monthly
                        </Badge>
                        <Badge variant="outline" className="bg-white/50 text-green-700 border-green-300">
                          <FileText className="h-3 w-3 mr-1" />
                          Official Source
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTAs */}
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <Button asChild size="lg" className="h-14">
                  <Link to={`/presale-projects?city=${encodeURIComponent(cityName)}`}>
                    <Building2 className="h-5 w-5 mr-2" />
                    View {cityName} Presale Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14">
                  <Link to={`/resale?city=${encodeURIComponent(cityName)}`}>
                    <Home className="h-5 w-5 mr-2" />
                    Browse Move-In Ready Homes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No verified {propertyType} data available for {cityName}. Try switching property types.
              </p>
            </Card>
          )}

          {/* Footer Source */}
          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>
              Data sourced from{' '}
              {sourceBoard && (
                <a 
                  href={SOURCE_URLS[sourceBoard]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {SOURCE_NAMES[sourceBoard]}
                </a>
              )}
              {' '}• Last updated:{' '}
              {latestStats ? formatDate(latestStats.report_month, latestStats.report_year) : 'N/A'}
              {' '}• Report ID: {latestStats?.id?.slice(0, 8)}
            </p>
            <p className="mt-2">
              The MLS® and MLS logos are trademarks of the Canadian Real Estate Association (CREA).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}