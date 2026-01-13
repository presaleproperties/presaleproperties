import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, Home, Calculator, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface InvestmentAnalysisProps {
  projectName: string;
  city: string;
  neighborhood: string;
  startingPrice: number | null;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  completionYear: number | null;
}

interface MarketData {
  city: string;
  avg_price_sqft: number;
  rental_yield: number;
  appreciation_5yr: number;
  avg_rent_1br: number;
  avg_rent_2br: number;
  source_name: string;
  source_url: string | null;
  last_verified_date: string;
}

const DEFAULT_MARKET: MarketData = {
  city: "BC Average",
  avg_price_sqft: 800,
  rental_yield: 4.0,
  appreciation_5yr: 30,
  avg_rent_1br: 1900,
  avg_rent_2br: 2500,
  source_name: "BC Average",
  source_url: null,
  last_verified_date: new Date().toISOString().split('T')[0],
};

export function InvestmentAnalysis({
  projectName,
  city,
  neighborhood,
  startingPrice,
  projectType,
  completionYear,
}: InvestmentAnalysisProps) {
  // Fetch market data from database
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-data', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .ilike('city', city)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching market data:', error);
        return DEFAULT_MARKET;
      }
      
      return data || DEFAULT_MARKET;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const data = marketData || DEFAULT_MARKET;
  
  // Calculate estimated metrics
  const estimatedSqft = projectType === "townhome" ? 1400 : projectType === "condo" ? 650 : 800;
  const pricePerSqft = startingPrice ? Math.round(startingPrice / estimatedSqft) : data.avg_price_sqft;
  
  const estimatedRent = projectType === "townhome" 
    ? Math.round(data.avg_rent_2br * 1.3) 
    : data.avg_rent_2br;
  
  const yearsToCompletion = completionYear ? Math.max(0, completionYear - new Date().getFullYear()) : 2;
  const appreciationAtCompletion = Math.round(data.appreciation_5yr * (yearsToCompletion / 5) * 10) / 10;
  
  const futureValue = startingPrice 
    ? Math.round(startingPrice * (1 + appreciationAtCompletion / 100))
    : null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl p-5 md:p-6 border border-primary/20">
        <Skeleton className="h-8 w-48 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-xl" />
      </section>
    );
  }

  return (
    <section 
      id="investment-analysis" 
      className="bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl p-5 md:p-6 border border-primary/20"
      aria-label="Investment potential analysis"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-foreground">Investment Potential</h2>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
        <div className="bg-background/80 rounded-xl p-4 border border-border/50 text-center">
          <DollarSign className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Price/Sq Ft</p>
          <p className="text-lg font-bold text-foreground">${pricePerSqft}</p>
          <p className="text-[10px] text-muted-foreground">vs ${data.avg_price_sqft} avg</p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/50 text-center">
          <Home className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Est. Rent</p>
          <p className="text-lg font-bold text-foreground">{formatPrice(estimatedRent)}</p>
          <p className="text-[10px] text-muted-foreground">per month</p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/50 text-center">
          <BarChart3 className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Rental Yield</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.rental_yield}%</p>
          <p className="text-[10px] text-muted-foreground">{city} average</p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/50 text-center">
          <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">5-Year Growth</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">+{data.appreciation_5yr}%</p>
          <p className="text-[10px] text-muted-foreground">{neighborhood} trend</p>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-background/60 rounded-xl p-4 border border-border/30 mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Based on current {neighborhood} market data, <strong className="text-foreground">{projectName}</strong> presents 
          {pricePerSqft < data.avg_price_sqft ? " strong" : " competitive"} investment potential.
          {futureValue && startingPrice && (
            <> At {formatPrice(startingPrice)}, the estimated value at completion ({completionYear}) 
            could reach <strong className="text-green-600 dark:text-green-400">{formatPrice(futureValue)}</strong> based on 
            historical {city} appreciation trends.</>
          )}
          {projectType === "townhome" && " Townhomes in this area typically offer higher rental yields and stronger family demand."}
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 h-11">
          <Link to={`/calculator?price=${startingPrice || 500000}&city=${encodeURIComponent(city)}`}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Your ROI
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1 h-11">
          <Link to={`/blog/${city.toLowerCase()}-presales-2026`}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {city} Market Report
          </Link>
        </Button>
      </div>

      {/* Source & Disclaimer */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground mb-1">
          <span className="font-medium">Source:</span>
          {data.source_url ? (
            <a 
              href={data.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              {data.source_name}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : (
            <span>{data.source_name}</span>
          )}
          <span className="text-muted-foreground/60">•</span>
          <span>Verified {formatDate(data.last_verified_date)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          *Illustrative estimates based on historical 5-year averages. Past performance does not guarantee future results. 
          Consult a licensed financial advisor before making investment decisions.
        </p>
      </div>
    </section>
  );
}