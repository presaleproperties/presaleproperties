import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Building2, FileText, BookOpen } from "lucide-react";

const POPULAR_CITIES = [
  { name: "Vancouver", slug: "vancouver", count: "50+" },
  { name: "Surrey", slug: "surrey", count: "40+" },
  { name: "Burnaby", slug: "burnaby", count: "35+" },
  { name: "Coquitlam", slug: "coquitlam", count: "25+" },
  { name: "Langley", slug: "langley", count: "30+" },
  { name: "Richmond", slug: "richmond", count: "20+" },
];

const QUICK_LINKS = [
  { 
    title: "Buyer's Guide", 
    description: "Learn about assignments & presales",
    href: "/buyers-guide",
    icon: BookOpen 
  },
  { 
    title: "Browse Projects", 
    description: "View all presale developments",
    href: "/presale-projects",
    icon: Building2 
  },
  { 
    title: "Assignment Listings", 
    description: "Find assignment opportunities",
    href: "/assignments",
    icon: FileText 
  },
];

export function RelatedContent() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Popular Cities */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
              Explore by City
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POPULAR_CITIES.map((city) => (
                <Link 
                  key={city.slug} 
                  to={`/presale-condos-${city.slug}`}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {city.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {city.count} projects
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <Link 
              to="/presale-projects" 
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
            >
              View all cities
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
              Quick Links
            </h2>
            <div className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} to={link.href} className="group block">
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
