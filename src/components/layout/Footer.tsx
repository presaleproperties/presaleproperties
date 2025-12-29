import { Link } from "react-router-dom";
import realBrokerLogo from "@/assets/real-broker-logo.avif";
import presaleLogo from "@/assets/presale-logo.png";

const CITY_LINKS = [
  { slug: "vancouver", name: "Vancouver", label: "Presale Condos Vancouver" },
  { slug: "surrey", name: "Surrey", label: "Surrey Presale Condos" },
  { slug: "langley", name: "Langley", label: "Langley Presale Condos" },
  { slug: "coquitlam", name: "Coquitlam", label: "Coquitlam Presale Condos" },
  { slug: "burnaby", name: "Burnaby", label: "Burnaby Presale Condos" },
  { slug: "delta", name: "Delta", label: "Delta Presale Condos" },
  { slug: "abbotsford", name: "Abbotsford", label: "Abbotsford Presale Condos" },
  { slug: "richmond", name: "Richmond", label: "Richmond Presale Condos" },
  { slug: "port-coquitlam", name: "Port Coquitlam", label: "Port Coquitlam Presales" },
  { slug: "new-westminster", name: "New Westminster", label: "New Westminster Presales" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 sm:py-12 px-4">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 col-span-2 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center">
              <img 
                src={presaleLogo} 
                alt="Presale Properties" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Metro Vancouver's #1 marketplace for presale condos, townhomes, and new construction homes with VIP pricing and floor plans.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Presale Condos by City</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/presale-projects" className="hover:text-foreground transition-colors">
                  All Presale Projects
                </Link>
              </li>
              {CITY_LINKS.slice(0, 4).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/presale-condos/${city.slug}`} 
                    className="hover:text-foreground transition-colors"
                    title={city.label}
                  >
                    {city.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Fraser Valley & More</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {CITY_LINKS.slice(4).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/presale-condos/${city.slug}`} 
                    className="hover:text-foreground transition-colors"
                    title={city.label}
                  >
                    {city.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/assignments" className="hover:text-foreground transition-colors">
                  Assignment Sales Vancouver
                </Link>
              </li>
              <li>
                <Link to="/buyers-guide" className="hover:text-foreground transition-colors">
                  Presale Buyer's Guide
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Presale News & Blog
                </Link>
              </li>
              <li>
                <Link to="/agents" className="hover:text-foreground transition-colors">
                  For Realtors
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
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
