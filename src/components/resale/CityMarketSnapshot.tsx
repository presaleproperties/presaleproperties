import { useLatestCityStats, useLatestReportDate } from "@/hooks/useMarketStats";
import { TrendingUp, TrendingDown, Building2, Home, Clock, Activity, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CityMarketSnapshotProps {
  city: string;
  propertyType?: 'condo' | 'townhome';
  compact?: boolean;
}

export function CityMarketSnapshot({ city, propertyType = 'condo', compact = false }: CityMarketSnapshotProps) {
  const { data: stats, isLoading } = useLatestCityStats(city, propertyType);
  const { data: reportDate } = useLatestReportDate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null; // No data available
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getMarketTypeColor = (type: string | null) => {
    switch (type) {
      case 'sellers': return 'bg-danger/10 text-danger border-danger/30';
      case 'balanced': return 'bg-warning/10 text-warning border-warning/30';
      case 'buyers': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const metrics = [
    {
      label: 'Benchmark Price',
      value: formatPrice(stats.benchmark_price || stats.median_sale_price),
      icon: DollarSign,
      change: stats.yoy_price_change,
    },
    {
      label: 'Price/Sqft',
      value: stats.avg_price_sqft ? `$${stats.avg_price_sqft}` : '—',
      icon: Building2,
    },
    {
      label: 'Sales Ratio',
      value: stats.sales_ratio ? `${stats.sales_ratio}%` : '—',
      icon: Activity,
      subtext: stats.market_type ? stats.market_type.charAt(0).toUpperCase() + stats.market_type.slice(1) + ' Market' : undefined,
    },
    {
      label: 'Days on Market',
      value: stats.days_on_market ? `${stats.days_on_market} days` : '—',
      icon: Clock,
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">{formatPrice(stats.benchmark_price)}</span>
        <span className="text-muted-foreground">${stats.avg_price_sqft}/sqft</span>
        {stats.yoy_price_change && (
          <span className={stats.yoy_price_change >= 0 ? 'text-success' : 'text-danger'}>
            {stats.yoy_price_change > 0 ? '+' : ''}{stats.yoy_price_change}% YoY
          </span>
        )}
        <Badge variant="outline" className={getMarketTypeColor(stats.market_type)}>
          {stats.market_type || 'N/A'}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          {propertyType === 'condo' ? <Building2 className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          {city} {propertyType === 'condo' ? 'Condo' : 'Townhome'} Market
        </h3>
        {reportDate && (
          <div className="flex items-center gap-2">
            {stats.source_board === 'MLS New Construction' && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success-strong border-success/30">
                ✓ MLS Verified
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Data: {reportDate.label}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold">{metric.value}</span>
                {metric.change !== undefined && metric.change !== null && (
                  <span className={`text-xs flex items-center gap-0.5 ${metric.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                )}
              </div>
              {metric.subtext && (
                <span className="text-xs text-muted-foreground">{metric.subtext}</span>
              )}
            </div>
          );
        })}
      </div>

      {stats.hottest_price_band && (
        <div className="text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
          <span className="text-muted-foreground">Hottest Price Band: </span>
          <span className="font-medium">{stats.hottest_price_band}</span>
          {stats.hottest_price_band_ratio && (
            <span className="text-primary ml-2">({stats.hottest_price_band_ratio}% sales ratio)</span>
          )}
        </div>
      )}
    </div>
  );
}
