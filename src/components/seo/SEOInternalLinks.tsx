import { Link } from "react-router-dom";
import { Building2, Home, MapPin, DollarSign, Compass } from "lucide-react";

interface SEOInternalLinksProps {
  city: string;
  citySlug: string;
  propertyType?: string;
  currentPrice?: number;
  type: "presale" | "resale";
}

const CITIES = [
  { name: "Vancouver", slug: "vancouver" },
  { name: "Surrey", slug: "surrey" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Langley", slug: "langley" },
  { name: "Richmond", slug: "richmond" },
  { name: "Delta", slug: "delta" },
  { name: "Abbotsford", slug: "abbotsford" },
];

const PRICE_RANGES_RESALE = [
  { label: "Under $750K", slug: "under-750k", max: 750000 },
  { label: "Under $1M", slug: "under-1m", max: 1000000 },
  { label: "Under $1.5M", slug: "under-1.5m", max: 1500000 },
  { label: "$2M+ Luxury", slug: "luxury", max: 999999999 },
];

const PRICE_RANGES_PRESALE = [
  { label: "Under $500K", slug: "500k" },
  { label: "Under $700K", slug: "700k" },
  { label: "Under $900K", slug: "900k" },
  { label: "Under $1M", slug: "1000k" },
];

export function SEOInternalLinks({ city, citySlug, propertyType, currentPrice, type }: SEOInternalLinksProps) {
  const isResale = type === "resale";
  const otherCities = CITIES.filter(c => c.slug !== citySlug).slice(0, 5);

  return (
    <section className="border-t pt-8 mt-12">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        Explore More New Homes
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Property Types */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            By Property Type
          </h3>
          <ul className="space-y-2 text-sm">
            {isResale ? (
              <>
                <li><Link to={`/properties/${citySlug}/condos`} className="text-foreground hover:text-primary transition-colors">New Condos in {city}</Link></li>
                <li><Link to={`/properties/${citySlug}/townhouses`} className="text-foreground hover:text-primary transition-colors">New Townhouses in {city}</Link></li>
                <li><Link to={`/properties/${citySlug}/houses`} className="text-foreground hover:text-primary transition-colors">New Houses in {city}</Link></li>
                <li><Link to={`/properties/${citySlug}/duplexes`} className="text-foreground hover:text-primary transition-colors">New Duplexes in {city}</Link></li>
              </>
            ) : (
              <>
                <li><Link to={`/${citySlug}-presale-condos`} className="text-foreground hover:text-primary transition-colors">Presale Condos in {city}</Link></li>
                <li><Link to={`/${citySlug}-presale-townhomes`} className="text-foreground hover:text-primary transition-colors">Presale Townhomes in {city}</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Price Ranges */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            By Price Range
          </h3>
          <ul className="space-y-2 text-sm">
            {isResale ? (
              PRICE_RANGES_RESALE.map(range => (
                <li key={range.slug}>
                  <Link 
                    to={`/properties/${citySlug}/${range.slug}`} 
                    className={`transition-colors ${currentPrice && currentPrice <= range.max ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                  >
                    {range.label} in {city}
                  </Link>
                </li>
              ))
            ) : (
              PRICE_RANGES_PRESALE.map(range => (
                <li key={range.slug}>
                  <Link 
                    to={`/presale-condos-under-${range.slug}-${citySlug}`} 
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {range.label} in {city}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Same Type in Other Cities */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Other Cities
          </h3>
          <ul className="space-y-2 text-sm">
            {otherCities.map(c => (
              <li key={c.slug}>
                <Link 
                  to={isResale ? `/properties/${c.slug}` : `/${c.slug}-presale-condos`} 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {isResale ? `New Homes in ${c.name}` : `Presales in ${c.name}`}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cross-Type Links */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            {isResale ? "Presale Projects" : "Move-In Ready"}
          </h3>
          <ul className="space-y-2 text-sm">
            {isResale ? (
              <>
                <li><Link to={`/${citySlug}-presale-condos`} className="text-foreground hover:text-primary transition-colors">Presale Condos in {city}</Link></li>
                <li><Link to={`/${citySlug}-presale-townhomes`} className="text-foreground hover:text-primary transition-colors">Presale Townhomes in {city}</Link></li>
                <li><Link to="/presale-projects" className="text-foreground hover:text-primary transition-colors">All Presale Projects</Link></li>
                <li><Link to="/presale-guide" className="text-foreground hover:text-primary transition-colors">Presale Buyer's Guide</Link></li>
              </>
            ) : (
              <>
                <li><Link to={`/properties/${citySlug}`} className="text-foreground hover:text-primary transition-colors">Move-In Ready in {city}</Link></li>
                <li><Link to={`/properties/${citySlug}/condos`} className="text-foreground hover:text-primary transition-colors">New Condos in {city}</Link></li>
                <li><Link to={`/properties/${citySlug}/townhouses`} className="text-foreground hover:text-primary transition-colors">New Townhouses in {city}</Link></li>
                <li><Link to="/properties" className="text-foreground hover:text-primary transition-colors">All Move-In Ready Homes</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Resources */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="font-medium text-sm text-muted-foreground mb-3">Helpful Resources</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/calculator" className="text-primary hover:underline">Investment Calculator</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/mortgage-calculator" className="text-primary hover:underline">Mortgage Calculator</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/buyers-guide" className="text-primary hover:underline">Buyer's Guide</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/blog" className="text-primary hover:underline">Market Insights</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/contact" className="text-primary hover:underline">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
