import { Link } from "react-router-dom";
import { Building2, Home, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TwoWaysToBuy() {
  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl text-foreground">
            Two Ways to Buy New
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            100% new construction only. Every home is brand new, never lived in.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Presale Card */}
          <Card className="relative overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] sm:text-xs font-semibold border-primary text-primary">
                      PRESALE
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1.5">
                    Presale Projects
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Pre-construction condos and townhomes. Purchase during construction, take possession in 2-3 years. Lock in today's pricing.
                  </p>
                  <Link to="/presale-projects">
                    <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Browse Presale
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Move-In Ready Card */}
          <Card className="relative overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Home className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-[10px] sm:text-xs font-semibold bg-emerald-600 text-white">
                      MOVE-IN READY
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1.5">
                    Move-In Ready (&lt; 6 Months Old)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Just completed new construction. Move in within 30-60 days. Built within last 6 months, never lived in.
                  </p>
                  <Link to="/properties">
                    <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                      View Available Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
