import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Building2, BookOpen, Calculator, FileText } from "lucide-react";

const POPULAR_CITIES = [
  { name: "Vancouver", slug: "vancouver", count: "50+" },
  { name: "Surrey", slug: "surrey", count: "40+" },
  { name: "Burnaby", slug: "burnaby", count: "35+" },
  { name: "Coquitlam", slug: "coquitlam", count: "25+" },
  { name: "Langley", slug: "langley", count: "30+" },
  { name: "Delta", slug: "delta", count: "20+" },
  { name: "Abbotsford", slug: "abbotsford", count: "15+" },
  { name: "Chilliwack", slug: "chilliwack", count: "10+" },
];

const QUICK_LINKS = [
  { 
    title: "Guides & Resources", 
    description: "Expert presale education hub",
    href: "/guides",
    icon: BookOpen 
  },
  { 
    title: "Investment Calculator", 
    description: "Analyze your ROI and cash flow",
    href: "/calculator",
    icon: Calculator 
  },
  { 
    title: "Market Updates", 
    description: "Latest BC presale trends",
    href: "/guides/market-updates",
    icon: FileText 
  },
  { 
    title: "Browse Presales", 
    description: "View all presale developments",
    href: "/presale-projects",
    icon: Building2 
  },
];

const RESALE_CITY_LINKS = [
  { name: "Vancouver", slug: "vancouver" },
  { name: "Surrey", slug: "surrey" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Delta", slug: "delta" },
  { name: "Langley", slug: "langley" },
  { name: "Abbotsford", slug: "abbotsford" },
  { name: "Chilliwack", slug: "chilliwack" },
];

export function RelatedContent() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          {/* Presale Cities */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
              Presale Projects
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_CITIES.slice(0, 6).map((city) => (
                <Link 
                  key={city.slug} 
                  to={`/presale-condos/${city.slug}`}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">
                          {city.name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Resale Cities */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
              Homes for Sale
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {RESALE_CITY_LINKS.slice(0, 6).map((city) => (
                <Link 
                  key={city.slug} 
                  to={`/resale/${city.slug}`}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">
                          {city.name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
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
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <link.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all shrink-0" />
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
