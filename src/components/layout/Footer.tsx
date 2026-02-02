import { Link } from "react-router-dom";
import realBrokerLogo from "@/assets/real-broker-logo.avif";
import { Logo } from "@/components/ui/Logo";

// Primary cities for condos
const CONDO_CITY_LINKS = [
  { slug: "surrey", name: "Surrey Presale Condos" },
  { slug: "vancouver", name: "Vancouver Presale Condos" },
  { slug: "langley", name: "Langley Presale Condos" },
  { slug: "coquitlam", name: "Coquitlam Presale Condos" },
  { slug: "burnaby", name: "Burnaby Presale Condos" },
  { slug: "richmond", name: "Richmond Presale Condos" },
  { slug: "delta", name: "Delta Presale Condos" },
  { slug: "abbotsford", name: "Abbotsford Presale Condos" },
];

// Primary cities for townhomes
const TOWNHOME_CITY_LINKS = [
  { slug: "surrey", name: "Surrey Presale Townhomes" },
  { slug: "langley", name: "Langley Presale Townhomes" },
  { slug: "coquitlam", name: "Coquitlam Presale Townhomes" },
  { slug: "burnaby", name: "Burnaby Presale Townhomes" },
  { slug: "vancouver", name: "Vancouver Presale Townhomes" },
  { slug: "richmond", name: "Richmond Presale Townhomes" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="py-8 sm:py-12 px-4 lg:container lg:px-4">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-6">
          <div className="space-y-4 col-span-2 sm:col-span-2 md:col-span-1">
            <Logo size="xl" className="-my-8 sm:-my-8 md:-my-8" />
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
              {CONDO_CITY_LINKS.slice(0, 5).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/${city.slug}-presale-condos`} 
                    className="hover:text-foreground transition-colors"
                    title={city.name}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* More Condos + Townhomes */}
          <nav aria-label="More cities" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">More Cities</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {CONDO_CITY_LINKS.slice(5).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/${city.slug}-presale-condos`} 
                    className="hover:text-foreground transition-colors"
                    title={city.name}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Presale Townhomes */}
          <nav aria-label="Presale townhomes by city" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Presale Townhomes</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {TOWNHOME_CITY_LINKS.map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/${city.slug}-presale-townhomes`} 
                    className="hover:text-foreground transition-colors"
                    title={city.name}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Move-In Ready Homes */}
          <nav aria-label="Move-in ready homes" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Move-In Ready</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/properties" className="hover:text-foreground transition-colors">
                  All New Homes
                </Link>
              </li>
              <li>
                <Link to="/map-search" className="hover:text-foreground transition-colors">
                  Map Search
                </Link>
              </li>
              <li>
                <Link to="/properties/vancouver" className="hover:text-foreground transition-colors">
                  Vancouver Homes
                </Link>
              </li>
              <li>
                <Link to="/properties/surrey" className="hover:text-foreground transition-colors">
                  Surrey Homes
                </Link>
              </li>
              <li>
                <Link to="/properties/langley" className="hover:text-foreground transition-colors">
                  Langley Homes
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Resources" className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/guides" className="hover:text-foreground transition-colors">
                  Guides & Resources
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="hover:text-foreground transition-colors">
                  Calculator
                </Link>
              </li>
              <li>
                <Link to="/guides/presale-guides" className="hover:text-foreground transition-colors">
                  Presale Guides
                </Link>
              </li>
              <li>
                <Link to="/guides/market-updates" className="hover:text-foreground transition-colors">
                  Market Updates
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/developers" className="hover:text-foreground transition-colors">
                  Developers
                </Link>
              </li>
              <li>
                <Link to="/for-agents" className="hover:text-foreground transition-colors">
                  Agent Portal
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>
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
          <p className="text-xs text-muted-foreground">
            info@presaleproperties.com | 672-258-1100
          </p>
        </div>
      </div>
    </footer>
  );
}
