import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Building2, ChevronDown, MapPin, Calculator, Home, Map, BookOpen, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// City links for condos (primary navigation)
const CONDO_CITY_LINKS = [
  { slug: "surrey", name: "Surrey" },
  { slug: "vancouver", name: "Vancouver" },
  { slug: "langley", name: "Langley" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "richmond", name: "Richmond" },
  { slug: "delta", name: "Delta" },
  { slug: "abbotsford", name: "Abbotsford" },
];

// City links for townhomes
const TOWNHOME_CITY_LINKS = [
  { slug: "surrey", name: "Surrey" },
  { slug: "langley", name: "Langley" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "burnaby", name: "Burnaby" },
];

// Resale city links - matching 8 target cities for new construction
const RESALE_CITY_LINKS = [
  { slug: "vancouver", name: "Vancouver" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "surrey", name: "Surrey" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "langley", name: "Langley" },
  { slug: "delta", name: "Delta" },
  { slug: "abbotsford", name: "Abbotsford" },
  { slug: "chilliwack", name: "Chilliwack" },
];

interface ConversionHeaderProps {
  /** Hide header on mobile/tablet - useful for property detail pages with custom sticky headers */
  hideOnMobile?: boolean;
  /** Always keep header visible (disable scroll-hide behavior) - useful for map pages */
  alwaysVisible?: boolean;
  /** Use sticky instead of fixed on mobile - useful for full-height layouts like map search */
  stickyOnMobile?: boolean;
}

export function ConversionHeader({ hideOnMobile = false, alwaysVisible = false, stickyOnMobile = false }: ConversionHeaderProps) {
  const [open, setOpen] = useState(false);
  const [presaleOpen, setPresaleOpen] = useState(false);
  const [resaleOpen, setResaleOpen] = useState(false);
  const location = useLocation();
  
  // Scroll-based header visibility for mobile/tablet
  const { isVisible } = useScrollHeader({ threshold: 100, sensitivity: 8 });
  const isMobileOrTablet = useIsMobileOrTablet();

  const isActive = (path: string) => location.pathname === path;
  const isMapPage = location.pathname === "/map-search";

  return (
    <>
      <header 
        className={cn(
          "w-full bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 z-50 shrink-0",
          // Premium border with subtle gold tint
          "border-b border-border/60",
          // Desktop: sticky positioning (normal behavior)
          "lg:sticky lg:top-0",
          // Mobile/tablet: fixed positioning for edge-to-edge scrolling
          stickyOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0",
          !stickyOnMobile && !hideOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          // Hide completely on mobile/tablet for property pages with custom headers
          hideOnMobile && "hidden lg:block",
          // Scroll-based hide/show for mobile/tablet (slide up when hidden) - skip if alwaysVisible or stickyOnMobile
          !hideOnMobile && !alwaysVisible && !stickyOnMobile && isMobileOrTablet && !isVisible && "max-lg:-translate-y-full"
        )}
      >
        <div className="flex h-14 md:h-16 items-center justify-between px-4 lg:container">
          {/* Logo */}
          <Logo size="xl" className="-my-8 sm:-my-8 md:-my-8" />

          {/* Desktop Navigation - Premium styled */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                {/* Presale Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 bg-transparent data-[state=open]:bg-accent/10 rounded-lg transition-colors">
                    <Building2 className="h-4 w-4 mr-2 text-primary" />
                    Presale
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[520px] p-5 bg-background rounded-xl shadow-lg border border-border/50">
                      {/* Header Link */}
                      <Link 
                        to="/presale-projects" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors group mb-4"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">All Presale Projects</div>
                          <p className="text-xs text-muted-foreground">Browse all new developments</p>
                        </div>
                      </Link>
                      
                      <div className="h-px bg-border/60 mb-4" />
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Presale Condos</p>
                          <div className="space-y-1">
                            {CONDO_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-condos`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 transition-colors text-sm text-foreground/80 hover:text-foreground"
                                >
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Presale Townhomes</p>
                          <div className="space-y-1">
                            {TOWNHOME_CITY_LINKS.map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-townhomes`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 transition-colors text-sm text-foreground/80 hover:text-foreground"
                                >
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Move-In Ready Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 bg-transparent data-[state=open]:bg-accent/10 rounded-lg transition-colors">
                    <Home className="h-4 w-4 mr-2 text-primary" />
                    Move-In Ready
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[520px] p-5 bg-background rounded-xl shadow-lg border border-border/50">
                      {/* Header Link */}
                      <Link 
                        to="/properties" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors group mb-4"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">All Move-In Ready</div>
                          <p className="text-xs text-muted-foreground">New construction homes available now</p>
                        </div>
                      </Link>
                      
                      <div className="h-px bg-border/60 mb-4" />
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">New Condos</p>
                          <div className="space-y-1">
                            {RESALE_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/properties/${city.slug}?type=condo`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 transition-colors text-sm text-foreground/80 hover:text-foreground"
                                >
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">New Townhomes</p>
                          <div className="space-y-1">
                            {RESALE_CITY_LINKS.slice(0, 4).map((city) => (
                              <NavigationMenuLink key={`townhome-${city.slug}`} asChild>
                                <Link
                                  to={`/properties/${city.slug}?type=townhouse`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 transition-colors text-sm text-foreground/80 hover:text-foreground"
                                >
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            {/* Simple nav links */}
            <Link
              to="/blog"
              className={cn(
                "h-10 px-4 flex items-center text-sm font-medium rounded-lg transition-colors",
                isActive("/blog") 
                  ? "text-foreground bg-secondary/60" 
                  : "text-foreground/80 hover:text-foreground hover:bg-accent/10"
              )}
            >
              <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              Guides
            </Link>
            <Link
              to="/calculator"
              className={cn(
                "h-10 px-4 flex items-center text-sm font-medium rounded-lg transition-colors",
                isActive("/calculator") 
                  ? "text-foreground bg-secondary/60" 
                  : "text-foreground/80 hover:text-foreground hover:bg-accent/10"
              )}
            >
              <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
              Calculator
            </Link>
            <Link
              to="/about"
              className={cn(
                "h-10 px-4 flex items-center text-sm font-medium rounded-lg transition-colors",
                isActive("/about") 
                  ? "text-foreground bg-secondary/60" 
                  : "text-foreground/80 hover:text-foreground hover:bg-accent/10"
              )}
            >
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              About
            </Link>
          </nav>

          {/* Desktop CTA - Map Search */}
          <div className="hidden lg:flex items-center gap-3">
            <Button 
              asChild 
              size="sm" 
              className={cn(
                "h-9 px-4 font-medium rounded-md",
                "bg-primary hover:bg-primary/90",
                "text-primary-foreground",
                "transition-colors duration-200",
                isMapPage && "ring-1 ring-primary/30"
              )}
            >
              <Link to="/map-search">
                <Map className="h-4 w-4 mr-2" />
                Map Search
              </Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-1 lg:hidden">
            {/* Mobile Map CTA - Always visible */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-11 w-11 rounded-full shrink-0",
                isMapPage 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
              )}
              asChild
            >
              <Link to="/map-search">
                <Map className="h-5 w-5" />
                <span className="sr-only">Map Search</span>
              </Link>
            </Button>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 rounded-full shrink-0 text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                >
                  <span className="sr-only">Toggle menu</span>
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full max-w-full p-0 bg-background border-l-0 sm:max-w-sm [&>button]:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Header with Logo and Close Button */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                    <Logo size="lg" onClick={() => setOpen(false)} />
                    <button 
                      onClick={() => setOpen(false)}
                      className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto">
                    <div className="px-5 py-2">
                      {/* Presale Section */}
                      <Collapsible open={presaleOpen} onOpenChange={setPresaleOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-4 group">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-lg font-semibold text-foreground">Presale</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform duration-200",
                            presaleOpen && "rotate-180"
                          )} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-2">
                          <Link
                            to="/presale-projects"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-secondary/60 transition-colors mb-2"
                          >
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-medium">View All Projects</span>
                          </Link>
                          <div className="pl-3 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">By City</p>
                            {CONDO_CITY_LINKS.slice(0, 6).map((city) => (
                              <Link
                                key={city.slug}
                                to={`/${city.slug}-presale-condos`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-secondary/40 transition-colors"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {city.name}
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="h-px bg-border/40 my-1" />

                      {/* Move-In Ready Section */}
                      <Collapsible open={resaleOpen} onOpenChange={setResaleOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-4 group">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Home className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-lg font-semibold text-foreground">Move-In Ready</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform duration-200",
                            resaleOpen && "rotate-180"
                          )} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-2">
                          <Link
                            to="/properties"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-secondary/60 transition-colors mb-2"
                          >
                            <Home className="h-4 w-4 text-primary" />
                            <span className="font-medium">View All Listings</span>
                          </Link>
                          <div className="pl-3 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">By City</p>
                            {RESALE_CITY_LINKS.slice(0, 6).map((city) => (
                              <Link
                                key={city.slug}
                                to={`/properties/${city.slug}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-secondary/40 transition-colors"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {city.name}
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="h-px bg-border/40 my-1" />

                      {/* Simple Links */}
                      <Link
                        to="/blog"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">Guides</span>
                      </Link>

                      <div className="h-px bg-border/40 my-1" />

                      <Link
                        to="/calculator"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center">
                          <Calculator className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">Calculator</span>
                      </Link>

                      <div className="h-px bg-border/40 my-1" />

                      <Link
                        to="/about"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">About</span>
                      </Link>
                    </div>
                  </nav>

                  {/* Map CTA - Bottom */}
                  <div className="px-5 py-4 border-t border-border/60">
                    <Link to="/map-search" onClick={() => setOpen(false)}>
                      <Button 
                        className={cn(
                          "w-full h-11 font-medium rounded-lg",
                          "bg-primary hover:bg-primary/90",
                          "text-primary-foreground",
                          "transition-colors duration-200"
                        )}
                      >
                        <Map className="h-5 w-5 mr-2" />
                        Map Search
                      </Button>
                    </Link>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-secondary/30">
                    <p className="text-xs text-muted-foreground text-center">
                      Vancouver's New Construction Marketplace
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header on mobile/tablet - prevents content from hiding under header */}
      {!hideOnMobile && (
        <div className="h-14 md:h-16 lg:hidden" aria-hidden="true" />
      )}
    </>
  );
}
