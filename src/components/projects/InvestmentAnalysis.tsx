import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, Home, Calculator, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvestmentAnalysisProps {
  projectName: string;
  city: string;
  neighborhood: string;
  startingPrice: number | null;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  completionYear: number | null;
}

/**
 * Market data estimates by city
 * 
 * SOURCES & METHODOLOGY:
 * - Price/Sqft: Based on REBGV & FVREB MLS HPI data (rebgv.org, fvreb.bc.ca)
 * - Rental Yields: Derived from CMHC Rental Market Survey (cmhc-schl.gc.ca/rental-market-report)
 * - 5-Year Appreciation: Historical average from BC Assessment & MLS benchmark data
 * - Rental Rates: CMHC Primary Rental Market data for Metro Vancouver & Fraser Valley
 * 
 * Note: These are illustrative estimates for educational purposes only.
 * Actual market conditions vary. Last reviewed: Q4 2024
 */
const MARKET_DATA: Record<string, { 
  avgPriceSqft: number; 
  rentalYield: number; 
  appreciation5yr: number;
  avgRent1br: number;
  avgRent2br: number;
  sourceNote: string;
}> = {
  "Vancouver": { avgPriceSqft: 1350, rentalYield: 3.2, appreciation5yr: 25, avgRent1br: 2400, avgRent2br: 3200, sourceNote: "REBGV MLS HPI" },
  "Burnaby": { avgPriceSqft: 1050, rentalYield: 3.5, appreciation5yr: 28, avgRent1br: 2200, avgRent2br: 2900, sourceNote: "REBGV MLS HPI" },
  "Surrey": { avgPriceSqft: 750, rentalYield: 4.2, appreciation5yr: 35, avgRent1br: 1900, avgRent2br: 2500, sourceNote: "FVREB MLS HPI" },
  "Langley": { avgPriceSqft: 720, rentalYield: 4.0, appreciation5yr: 32, avgRent1br: 1850, avgRent2br: 2400, sourceNote: "FVREB MLS HPI" },
  "Coquitlam": { avgPriceSqft: 950, rentalYield: 3.8, appreciation5yr: 30, avgRent1br: 2100, avgRent2br: 2800, sourceNote: "REBGV MLS HPI" },
  "Richmond": { avgPriceSqft: 1100, rentalYield: 3.4, appreciation5yr: 26, avgRent1br: 2300, avgRent2br: 3000, sourceNote: "REBGV MLS HPI" },
  "Delta": { avgPriceSqft: 680, rentalYield: 4.5, appreciation5yr: 30, avgRent1br: 1750, avgRent2br: 2300, sourceNote: "FVREB MLS HPI" },
  "Abbotsford": { avgPriceSqft: 580, rentalYield: 5.0, appreciation5yr: 35, avgRent1br: 1600, avgRent2br: 2100, sourceNote: "FVREB MLS HPI" },
  "Port Moody": { avgPriceSqft: 1000, rentalYield: 3.6, appreciation5yr: 28, avgRent1br: 2150, avgRent2br: 2850, sourceNote: "REBGV MLS HPI" },
  "New Westminster": { avgPriceSqft: 900, rentalYield: 3.9, appreciation5yr: 27, avgRent1br: 2000, avgRent2br: 2700, sourceNote: "REBGV MLS HPI" },
};

const DEFAULT_MARKET = { avgPriceSqft: 800, rentalYield: 4.0, appreciation5yr: 30, avgRent1br: 1900, avgRent2br: 2500, sourceNote: "BC Average" };

export function InvestmentAnalysis({
  projectName,
  city,
  neighborhood,
  startingPrice,
  projectType,
  completionYear,
}: InvestmentAnalysisProps) {
  const marketData = MARKET_DATA[city] || DEFAULT_MARKET;
  
  // Calculate estimated metrics
  const estimatedSqft = projectType === "townhome" ? 1400 : projectType === "condo" ? 650 : 800;
  const pricePerSqft = startingPrice ? Math.round(startingPrice / estimatedSqft) : marketData.avgPriceSqft;
  
  const estimatedRent = projectType === "townhome" 
    ? Math.round(marketData.avgRent2br * 1.3) 
    : marketData.avgRent2br;
  
  const yearsToCompletion = completionYear ? Math.max(0, completionYear - new Date().getFullYear()) : 2;
  const appreciationAtCompletion = Math.round(marketData.appreciation5yr * (yearsToCompletion / 5) * 10) / 10;
  
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
          <p className="text-[10px] text-muted-foreground">vs ${marketData.avgPriceSqft} avg</p>
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
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{marketData.rentalYield}%</p>
          <p className="text-[10px] text-muted-foreground">{city} average</p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/50 text-center">
          <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">5-Year Growth</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">+{marketData.appreciation5yr}%</p>
          <p className="text-[10px] text-muted-foreground">{neighborhood} trend</p>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-background/60 rounded-xl p-4 border border-border/30 mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Based on current {neighborhood} market data, <strong className="text-foreground">{projectName}</strong> presents 
          {pricePerSqft < marketData.avgPriceSqft ? " strong" : " competitive"} investment potential.
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
        <p className="text-[10px] text-muted-foreground text-center mb-1">
          <strong>Data Sources:</strong> {marketData.sourceNote}, CMHC Rental Market Survey, BC Assessment
        </p>
        <p className="text-[10px] text-muted-foreground text-center">
          *Illustrative estimates based on historical 5-year averages (Q4 2024). Past performance does not guarantee future results. 
          Consult a licensed financial advisor before making investment decisions.
        </p>
      </div>
    </section>
  );
}
