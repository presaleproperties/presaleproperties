import { Link } from "react-router-dom";
import realBrokerLogo from "@/assets/real-broker-logo.avif";
import { Logo } from "@/components/ui/Logo";

// Primary cities for condos
const CONDO_CITY_LINKS = [
  { label: "Surrey Presale Condos", href: "/presale-projects/surrey/condos" },
  { label: "Vancouver Presale Condos", href: "/presale-projects/vancouver/condos" },
  { label: "Langley Presale Condos", href: "/presale-projects/langley/condos" },
  { label: "Coquitlam Presale Condos", href: "/presale-projects/coquitlam/condos" },
  { label: "Burnaby Presale Condos", href: "/presale-projects/burnaby/condos" },
  { label: "Richmond Presale Condos", href: "/presale-projects/richmond/condos" },
  { label: "Delta Presale Condos", href: "/presale-projects/delta/condos" },
  { label: "Abbotsford Presale Condos", href: "/presale-projects/abbotsford/condos" },
  { label: "North Vancouver Condos", href: "/presale-projects/north-vancouver/condos" },
  { label: "New Westminster Condos", href: "/presale-projects/new-westminster/condos" },
  { label: "Port Moody Condos", href: "/presale-projects/port-moody/condos" },
  { label: "Maple Ridge Condos", href: "/presale-projects/maple-ridge/condos" },
];

// Townhome links
const TOWNHOME_CITY_LINKS = [
  { label: "Surrey Presale Townhomes", href: "/presale-projects/surrey/townhomes" },
  { label: "Langley Presale Townhomes", href: "/presale-projects/langley/townhomes" },
  { label: "Coquitlam Presale Townhomes", href: "/presale-projects/coquitlam/townhomes" },
  { label: "Burnaby Presale Townhomes", href: "/presale-projects/burnaby/townhomes" },
  { label: "Vancouver Presale Townhomes", href: "/presale-projects/vancouver/townhomes" },
  { label: "Richmond Presale Townhomes", href: "/presale-projects/richmond/townhomes" },
  { label: "Abbotsford Townhomes", href: "/presale-projects/abbotsford/townhomes" },
  { label: "North Van Townhomes", href: "/presale-projects/north-vancouver/townhomes" },
  { label: "Maple Ridge Townhomes", href: "/presale-projects/maple-ridge/townhomes" },
  { label: "Port Coquitlam Townhomes", href: "/presale-projects/port-coquitlam/townhomes" },
  { label: "Assignments", href: "/assignments" },
  { label: "Sell Your Assignment", href: "/assignments/sell-your-assignment" },
  { label: "Buying an Assignment Guide", href: "/assignments/buying-an-assignment" },
  { label: "Map Search", href: "/map-search" },
];

// Neighbourhood links
const NEIGHBOURHOOD_LINKS = [
  { label: "Surrey City Centre", href: "/surrey-city-centre-presale" },
  { label: "Langley Willoughby", href: "/langley-willoughby-presale" },
  { label: "Surrey Cloverdale", href: "/surrey-cloverdale-presale" },
  { label: "South Surrey", href: "/south-surrey-presale" },
  { label: "Burnaby Metrotown", href: "/burnaby-metrotown-presale" },
  { label: "Burnaby Brentwood", href: "/burnaby-brentwood-presale" },
  { label: "Coquitlam Burquitlam", href: "/coquitlam-burquitlam-presale" },
  { label: "Mount Pleasant", href: "/vancouver-mount-pleasant-presale" },
  { label: "Richmond Brighouse", href: "/richmond-brighouse-presale" },
  { label: "North Van Lonsdale", href: "/north-vancouver-lonsdale-presale" },
];

// Move-in ready links
const MOVE_IN_LINKS = [
  { label: "All New Homes", href: "/properties" },
  { label: "Map Search", href: "/map-search" },
  { label: "Vancouver Homes", href: "/properties/vancouver" },
  { label: "Surrey Homes", href: "/properties/surrey" },
  { label: "Burnaby Homes", href: "/properties/burnaby" },
  { label: "Coquitlam Homes", href: "/properties/coquitlam" },
  { label: "Richmond Homes", href: "/properties/richmond" },
  { label: "Langley Homes", href: "/properties/langley" },
  { label: "Abbotsford Homes", href: "/properties/abbotsford" },
  { label: "North Vancouver Homes", href: "/properties/north-vancouver" },
  { label: "Delta Homes", href: "/properties/delta" },
  { label: "New Westminster Homes", href: "/properties/new-westminster" },
  { label: "Port Moody Homes", href: "/properties/port-moody" },
  { label: "Maple Ridge Homes", href: "/properties/maple-ridge" },
  { label: "Popular Searches", href: "/properties/popular-searches" },
];

// Resources links
const RESOURCE_LINKS = [
  { label: "Guides & Resources", href: "/guides" },
  { label: "Calculator", href: "/calculator" },
  { label: "Presale Guides", href: "/guides/presale-guides" },
  { label: "Market Updates", href: "/guides/market-updates" },
  { label: "Blog", href: "/blog" },
  { label: "Developers", href: "/developers" },
  { label: "Agent Portal", href: "/login" },
  { label: "Contact Us", href: "/contact" },
  { label: "Presale Process", href: "/presale-process" },
  { label: "ROI Calculator", href: "/roi-calculator" },
];

// Browse by price links
const PRICE_LINKS = [
  { label: "Surrey Condos Under $500K", href: "/presale-projects/surrey/condos-under-500k" },
  { label: "Surrey Condos Under $600K", href: "/presale-projects/surrey/condos-under-600k" },
  { label: "Langley Condos Under $500K", href: "/presale-projects/langley/condos-under-500k" },
  { label: "Langley Condos Under $600K", href: "/presale-projects/langley/condos-under-600k" },
  { label: "Burnaby Condos Under $700K", href: "/presale-projects/burnaby/condos-under-700k" },
  { label: "Vancouver Condos Under $800K", href: "/presale-projects/vancouver/condos-under-800k" },
  { label: "Abbotsford Condos Under $500K", href: "/presale-projects/abbotsford/condos-under-500k" },
  { label: "Surrey Townhomes Under $700K", href: "/presale-projects/surrey/townhomes-under-700k" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="py-6 lg:py-8 px-4 lg:container lg:px-4">

        {/* Main grid — tighter on desktop */}
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">

          {/* Brand */}
          <div className="space-y-2 col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo size="xl" className="-my-10" />
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Metro Vancouver's presale marketplace. VIP pricing, floor plans &amp; early access.
            </p>
          </div>

          {/* Presale Condos */}
          <nav aria-label="Presale condos by city">
            <h4 className="text-xs font-semibold mb-2">Presale Condos</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><Link to="/presale-projects" className="hover:text-foreground transition-colors">All Projects</Link></li>
              {CONDO_CITY_LINKS.map((link) => (
                <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Presale Townhomes */}
          <nav aria-label="Presale townhomes by city">
            <h4 className="text-xs font-semibold mb-2">Presale Townhomes</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {TOWNHOME_CITY_LINKS.map((link) => (
                <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Neighbourhoods */}
          <nav aria-label="Neighbourhoods">
            <h4 className="text-xs font-semibold mb-2">Neighbourhoods</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {NEIGHBOURHOOD_LINKS.map((link) => (
                <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Move-In Ready */}
          <nav aria-label="Move-in ready homes">
            <h4 className="text-xs font-semibold mb-2">Move-In Ready</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {MOVE_IN_LINKS.map((link) => (
                <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h4 className="text-xs font-semibold mb-2">Resources</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Browse by Price — compact inline */}
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs font-semibold mr-3">Browse by Price:</span>
          <span className="text-xs text-muted-foreground">
            {PRICE_LINKS.map((link, i) => (
              <span key={link.href}>
                <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                {i < PRICE_LINKS.length - 1 && <span className="mx-2 text-border">·</span>}
              </span>
            ))}
          </span>
        </div>

        {/* Bottom bar — brokerage + legal in one row */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={realBrokerLogo} alt="Real Broker" className="h-7 w-auto object-contain" />
            <p className="text-xs text-muted-foreground">Real Broker · 3211 152 St, Building C, Suite 402, Surrey, BC V3Z 1H8</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-center">
            <span>© {new Date().getFullYear()} PresaleProperties.com</span>
            <span className="text-border">·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="text-border">·</span>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
            <span className="text-border">·</span>
            <a href="/sitemap.xml" className="hover:text-foreground transition-colors">Sitemap</a>
            <span className="text-border">·</span>
            <a href="mailto:info@presaleproperties.com" className="hover:text-foreground transition-colors">info@presaleproperties.com</a>
            <span className="text-border">·</span>
            <a href="tel:6722581100" className="hover:text-foreground transition-colors">672-258-1100</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
