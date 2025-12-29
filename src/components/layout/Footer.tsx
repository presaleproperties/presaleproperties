import { Link } from "react-router-dom";

const CITY_LINKS = [
  { slug: "vancouver", name: "Vancouver" },
  { slug: "surrey", name: "Surrey" },
  { slug: "langley", name: "Langley" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "delta", name: "Delta" },
  { slug: "abbotsford", name: "Abbotsford" },
  { slug: "richmond", name: "Richmond" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 sm:py-12 px-4">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 col-span-2 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                presale<span className="text-primary">properties</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Discover presale projects and assignments across Greater Vancouver.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Presales by City</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/presale-projects" className="hover:text-foreground transition-colors">
                  All Projects
                </Link>
              </li>
              {CITY_LINKS.slice(0, 4).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/presale-condos-${city.slug}`} 
                    className="hover:text-foreground transition-colors"
                  >
                    {city.name} Presales
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">More Cities</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {CITY_LINKS.slice(4).map((city) => (
                <li key={city.slug}>
                  <Link 
                    to={`/presale-condos-${city.slug}`} 
                    className="hover:text-foreground transition-colors"
                  >
                    {city.name} Presales
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/assignments" className="hover:text-foreground transition-colors">
                  Browse Assignments
                </Link>
              </li>
              <li>
                <Link to="/buyers-guide" className="hover:text-foreground transition-colors">
                  Buyer's Guide
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/agents" className="hover:text-foreground transition-colors">
                  For Agents
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

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} PresaleProperties.com. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            info@presaleproperties.com
          </p>
        </div>
      </div>
    </footer>
  );
}
