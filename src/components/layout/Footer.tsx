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
  { label: "Agent Portal", href: "/for-agents" },
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
      <div className="py-8 sm:py-12 px-4 lg:container lg:px-4">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <div className="space-y-4 col-span-2 sm:col-span-3 md:col-span-1">
            <Logo size="xl" className="-my-10 sm:-my-10 md:-my-10" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Metro Vancouver's #1 marketplace for presale condos, townhomes, and new construction homes with VIP pricing and floor plans.
            </p>
          </div>

          {/* Presale Condos by City */}
          <nav aria-label="Presale condos by city" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Presale Condos</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/presale-projects" className="hover:text-foreground transition-colors">
                  All Presale Projects
                </Link>
              </li>
              {CONDO_CITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Presale Townhomes */}
          <nav aria-label="Presale townhomes by city" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Presale Townhomes</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {TOWNHOME_CITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Neighbourhoods */}
          <nav aria-label="Neighbourhoods" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Neighbourhoods</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {NEIGHBOURHOOD_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Move-In Ready Homes */}
          <nav aria-label="Move-in ready homes" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Move-In Ready</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {MOVE_IN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Browse by Price */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold mb-3">Browse by Price</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {PRICE_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Brokerage Section */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-center">
            <img 
              src={realBrokerLogo} 
              alt="Real Broker" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">Real Broker</p>
              <p className="text-xs text-muted-foreground">
                666 Burrard St, Suite 500, Vancouver, British Columbia V6C 3P6
              </p>
            </div>
          </div>
        </div>

        {/* SEO keyword footer section */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-4xl mx-auto">
            PresaleProperties.com features new presale condos in Vancouver, Surrey presale townhomes, 
            Langley new condos presale, Coquitlam pre-construction condos, Burnaby presale pricing, 
            Delta presale condos, and Abbotsford presale developments. Get VIP access to floor plans, 
            pricing, incentives, and early registration across Metro Vancouver and the Fraser Valley.
          </p>
          <p className="text-[10px] text-muted-foreground/70 text-center mt-3 max-w-2xl mx-auto">
            We specialize exclusively in new construction: presale projects and move-in ready homes under 6 months old. No resale properties.
          </p>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} PresaleProperties.com. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>·</span>
            <a href="mailto:info@presaleproperties.com" className="hover:text-foreground transition-colors">info@presaleproperties.com</a>
            <span>|</span>
            <a href="tel:6722581100" className="hover:text-foreground transition-colors">672-258-1100</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
