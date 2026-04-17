import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Building2, ChevronDown, MapPin, Calculator, Home, Map, BookOpen, Users, Tag } from "lucide-react";
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
  /** Keep header always visible on mobile/tablet but make it transparent, gaining a subtle glass bg on scroll */
  transparentOnMobile?: boolean;
}

export function ConversionHeader({ hideOnMobile = false, alwaysVisible = false, stickyOnMobile = false, transparentOnMobile = false }: ConversionHeaderProps) {
  const [open, setOpen] = useState(false);
  const [presaleOpen, setPresaleOpen] = useState(false);
  const [resaleOpen, setResaleOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Scroll-based header visibility for mobile/tablet
  const { isVisible } = useScrollHeader({ threshold: 100, sensitivity: 8 });
  const isMobileOrTablet = useIsMobileOrTablet();

  // Track scroll position for transparent header mode
  useEffect(() => {
    if (!transparentOnMobile) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnMobile]);

  const isActive = (path: string) => location.pathname === path;
  const isMapPage = location.pathname === "/map-search";

  return (
    <>
      <header 
        className={cn(
          "w-full z-50 shrink-0 transition-all duration-300",
          // Default background — solid white
          !transparentOnMobile && "bg-background",
          !transparentOnMobile && "border-b border-border/60 shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.07)]",
          // Transparent mode on mobile/tablet
          transparentOnMobile && isMobileOrTablet && "bg-background border-b border-border/60",
          // Desktop always gets solid bg regardless of transparentOnMobile
          transparentOnMobile && "lg:bg-background lg:border-b lg:border-border/60",
          // Desktop: sticky positioning (normal behavior)
          "lg:sticky lg:top-0",
          // Mobile/tablet: fixed positioning for edge-to-edge scrolling
          stickyOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0",
          !stickyOnMobile && !hideOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0 max-lg:transition-all max-lg:duration-300 max-lg:ease-out",
          // Hide completely on mobile/tablet for property pages with custom headers
          hideOnMobile && "hidden lg:block",
          // Scroll-based hide/show for mobile/tablet - skip if transparentOnMobile (always visible)
          !hideOnMobile && !alwaysVisible && !stickyOnMobile && !transparentOnMobile && isMobileOrTablet && !isVisible && "max-lg:-translate-y-full"
        )}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex h-14 md:h-[68px] items-center justify-between px-4 lg:px-8 lg:max-w-screen-xl lg:mx-auto">
          {/* Logo */}
          <Logo size="xl" className="-my-8 sm:-my-8 md:-my-8" />

          {/* ── Desktop Navigation ── */}
          <nav className="hidden lg:flex items-center">
            {/* Thin vertical separator after logo */}
            <div className="h-5 w-px bg-border/70 mr-7" />

            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">

                {/* ── Presale Dropdown ── */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "h-9 px-4 text-[13px] font-semibold tracking-wide bg-transparent rounded-lg transition-all duration-200",
                    "text-foreground/65 hover:text-foreground",
                    "hover:bg-foreground/[0.04] data-[state=open]:bg-foreground/[0.04]",
                    "data-[state=open]:text-foreground",
                    "[&>svg]:text-primary/70 [&>svg]:ml-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
                  )}>
                    Presale
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {/* Premium dropdown panel */}
                    <div className="w-[540px] bg-background rounded-2xl shadow-[0_20px_60px_-10px_hsl(var(--foreground)/0.14),0_0_0_1px_hsl(var(--border)/0.6)] overflow-hidden">
                      {/* Panel header */}
                      <div className="px-5 pt-5 pb-4 border-b border-border/50">
                        <Link
                          to="/presale-projects"
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/18 transition-colors">
                              <Building2 className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-foreground leading-none mb-0.5">All Presale Projects</div>
                              <p className="text-[11px] text-muted-foreground">Browse every new development →</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                            400+ homes
                          </span>
                        </Link>
                      </div>
                      {/* City columns */}
                      <div className="grid grid-cols-2 gap-0 p-5">
                        <div className="pr-5 border-r border-border/40">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
                            Presale Condos
                          </p>
                          <div className="space-y-0.5">
                            {CONDO_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-condos`}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-[13px] text-foreground/70 hover:text-foreground hover:bg-secondary/70 group"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div className="pl-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
                            Presale Townhomes
                          </p>
                          <div className="space-y-0.5">
                            {TOWNHOME_CITY_LINKS.map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-townhomes`}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-[13px] text-foreground/70 hover:text-foreground hover:bg-secondary/70 group"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
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

                {/* ── Move-In Ready Dropdown ── */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "h-9 px-4 text-[13px] font-semibold tracking-wide bg-transparent rounded-lg transition-all duration-200",
                    "text-foreground/65 hover:text-foreground",
                    "hover:bg-foreground/[0.04] data-[state=open]:bg-foreground/[0.04]",
                    "data-[state=open]:text-foreground",
                    "[&>svg]:text-primary/70 [&>svg]:ml-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
                  )}>
                    Move-In Ready
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[540px] bg-background rounded-2xl shadow-[0_20px_60px_-10px_hsl(var(--foreground)/0.14),0_0_0_1px_hsl(var(--border)/0.6)] overflow-hidden">
                      <div className="px-5 pt-5 pb-4 border-b border-border/50">
                        <Link
                          to="/properties"
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/18 transition-colors">
                              <Home className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-foreground leading-none mb-0.5">All Move-In Ready</div>
                              <p className="text-[11px] text-muted-foreground">New construction available now →</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                            Ready now
                          </span>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-0 p-5">
                        <div className="pr-5 border-r border-border/40">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
                            New Condos
                          </p>
                          <div className="space-y-0.5">
                            {RESALE_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/properties/${city.slug}?type=condo`}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-[13px] text-foreground/70 hover:text-foreground hover:bg-secondary/70 group"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div className="pl-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
                            New Townhomes
                          </p>
                          <div className="space-y-0.5">
                            {RESALE_CITY_LINKS.slice(0, 4).map((city) => (
                              <NavigationMenuLink key={`townhome-${city.slug}`} asChild>
                                <Link
                                  to={`/properties/${city.slug}?type=townhouse`}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-[13px] text-foreground/70 hover:text-foreground hover:bg-secondary/70 group"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
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

            {/* Plain text links — no icons, refined weight */}
            {[
              { to: "/assignments", label: "Assignments" },
              { to: "/blog", label: "Guides" },
              { to: "/faq", label: "FAQ" },
              { to: "/calculator", label: "Calculator" },
              { to: "/about", label: "About" },
              { to: "/login", label: "Agent Portal" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "h-9 px-4 flex items-center text-[13px] font-semibold tracking-wide rounded-lg transition-all duration-150",
                  isActive(to)
                    ? "text-foreground bg-foreground/[0.05]"
                    : "text-foreground/65 hover:text-foreground hover:bg-foreground/[0.04]"
                )}
              >
                {label}
                {isActive(to) && (
                  <span className="ml-2 h-1 w-1 rounded-full bg-primary inline-block" />
                )}
              </Link>
            ))}

            {/* Separator */}
            <div className="h-5 w-px bg-border/70 mx-4" />
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Ghost Map link */}
            <Link
              to="/map-search"
              className={cn(
                "h-9 px-4 flex items-center gap-2 text-[13px] font-semibold rounded-lg transition-all duration-150",
                isMapPage
                  ? "text-primary bg-primary/8"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.04]"
              )}
            >
              <Map className="h-3.5 w-3.5" />
              Map
            </Link>
            {/* Primary gold CTA */}
            <Button
              asChild
              size="sm"
              className="h-9 px-5 text-[13px] font-bold rounded-lg shadow-[0_2px_12px_hsl(var(--primary)/0.28)] hover:shadow-[0_4px_20px_hsl(var(--primary)/0.38)] transition-all duration-200"
            >
              <Link to="/presale-projects">
                View Projects
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

                      {/* Assignments */}
                      <Link
                        to="/assignments"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">Assignments</span>
                      </Link>

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
                        to="/faq"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">FAQ</span>
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

                      <div className="h-px bg-border/40 my-1" />

                      <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-lg font-semibold text-foreground">Agent Portal</span>
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
      {/* Skip spacer in transparent mode so hero extends behind header */}
      {!hideOnMobile && !transparentOnMobile && (
        <div className="h-14 md:h-16 lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} aria-hidden="true" />
      )}
    </>
  );
}
