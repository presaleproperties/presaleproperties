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

// Reusable collapsible nav group: <details> on mobile/tablet, always-open on desktop (lg+)
function FooterNavGroup({
  title,
  links,
  ariaLabel,
  prefixLink,
}: {
  title: string;
  links: { label: string; href: string }[];
  ariaLabel: string;
  prefixLink?: { label: string; href: string };
}) {
  return (
    <nav aria-label={ariaLabel}>
      {/* Mobile/tablet: collapsible */}
      <details className="lg:hidden group border-b border-border/50 py-3">
        <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-foreground">
          {title}
          <span className="text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">+</span>
        </summary>
        <ul className="space-y-2 text-xs text-muted-foreground pt-3 pl-1">
          {prefixLink && (
            <li><Link to={prefixLink.href} className="hover:text-foreground transition-colors">{prefixLink.label}</Link></li>
          )}
          {links.map((link) => (
            <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
          ))}
        </ul>
      </details>

      {/* Desktop: always-open list */}
      <div className="hidden lg:block">
        <h4 className="text-xs font-semibold mb-2">{title}</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {prefixLink && (
            <li><Link to={prefixLink.href} className="hover:text-foreground transition-colors">{prefixLink.label}</Link></li>
          )}
          {links.map((link) => (
            <li key={link.href}><Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link></li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Footer() {
  // Tablet/mobile: trim price links to top 4
  const PRICE_LINKS_COMPACT = PRICE_LINKS.slice(0, 4);

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="py-6 lg:py-8 px-4 lg:container lg:px-4">

        {/* Brand — always visible */}
        <div className="space-y-2 mb-4 lg:mb-0">
          <Logo size="xl" className="-my-10" />
          <p className="text-xs text-muted-foreground leading-relaxed pt-1 max-w-md">
            Metro Vancouver's presale marketplace. VIP pricing, floor plans &amp; early access.
          </p>
        </div>

        {/* Mobile/tablet: stacked collapsibles */}
        <div className="lg:hidden">
          <FooterNavGroup
            title="Presale Condos"
            ariaLabel="Presale condos by city"
            links={CONDO_CITY_LINKS}
            prefixLink={{ label: "All Projects", href: "/presale-projects" }}
          />
          <FooterNavGroup
            title="Presale Townhomes"
            ariaLabel="Presale townhomes by city"
            links={TOWNHOME_CITY_LINKS}
          />
          <FooterNavGroup
            title="Neighbourhoods"
            ariaLabel="Neighbourhoods"
            links={NEIGHBOURHOOD_LINKS}
          />
          <FooterNavGroup
            title="Move-In Ready"
            ariaLabel="Move-in ready homes"
            links={MOVE_IN_LINKS}
          />
          <FooterNavGroup
            title="Resources"
            ariaLabel="Resources"
            links={RESOURCE_LINKS}
          />
        </div>

        {/* Desktop (≥1024px): full 6-column grid */}
        <div className="hidden lg:grid gap-6 grid-cols-6 mt-6">
          <div /> {/* spacer to align with brand col above when stacked */}
          <FooterNavGroup
            title="Presale Condos"
            ariaLabel="Presale condos by city"
            links={CONDO_CITY_LINKS}
            prefixLink={{ label: "All Projects", href: "/presale-projects" }}
          />
          <FooterNavGroup
            title="Presale Townhomes"
            ariaLabel="Presale townhomes by city"
            links={TOWNHOME_CITY_LINKS}
          />
          <FooterNavGroup
            title="Neighbourhoods"
            ariaLabel="Neighbourhoods"
            links={NEIGHBOURHOOD_LINKS}
          />
          <FooterNavGroup
            title="Move-In Ready"
            ariaLabel="Move-in ready homes"
            links={MOVE_IN_LINKS}
          />
          <FooterNavGroup
            title="Resources"
            ariaLabel="Resources"
            links={RESOURCE_LINKS}
          />
        </div>

        {/* Browse by Price — compact (top 4) on mobile/tablet, full on desktop */}
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs font-semibold mr-3">Browse by Price:</span>
          <span className="text-xs text-muted-foreground">
            {/* Mobile/tablet: top 4 + see all */}
            <span className="lg:hidden">
              {PRICE_LINKS_COMPACT.map((link, i) => (
                <span key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                  {i < PRICE_LINKS_COMPACT.length - 1 && <span className="mx-2 text-border">·</span>}
                </span>
              ))}
              <span className="mx-2 text-border">·</span>
              <Link to="/presale-projects" className="font-semibold text-foreground hover:underline">See all price ranges</Link>
            </span>

            {/* Desktop: full list */}
            <span className="hidden lg:inline">
              {PRICE_LINKS.map((link, i) => (
                <span key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                  {i < PRICE_LINKS.length - 1 && <span className="mx-2 text-border">·</span>}
                </span>
              ))}
            </span>
          </span>
        </div>

        {/* Bottom bar — brokerage + legal in one row */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <img
              src={realBrokerLogo}
              alt="Real Broker"
              width={80}
              height={28}
              className="h-7 w-auto object-contain shrink-0 transform-none"
            />
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
