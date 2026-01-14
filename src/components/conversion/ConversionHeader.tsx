import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Phone, Menu, X, Building2, FileStack, BookOpen, Users, ChevronRight, ChevronDown, MapPin, Calculator, Home, Map, TrendingUp } from "lucide-react";
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
import { AccessPackModal } from "./AccessPackModal";
import { supabase } from "@/integrations/supabase/client";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
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
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [resaleCitiesOpen, setResaleCitiesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const location = useLocation();
  
  // Scroll-based header visibility for mobile/tablet
  const { isVisible } = useScrollHeader({ threshold: 100, sensitivity: 8 });
  const isMobileOrTablet = useIsMobileOrTablet();

  useEffect(() => {
    const fetchWhatsapp = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) setWhatsappNumber(data.value as string);
    };
    fetchWhatsapp();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in learning about presale projects. Can you help me?")}`;

  const openChatNow = () => {
    setOpen(false);
    trackCTAClick({
      cta_type: "whatsapp_click",
      cta_label: "Chat Now",
      cta_location: "header",
    });
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_chat_now", {
        page_path: window.location.pathname,
        source: "header",
      });
    }
    window.open(whatsappLink, "_blank");
  };

  const openCallBack = () => {
    setModalOpen(true);
    setOpen(false);
    trackCTAClick({
      cta_type: "callback_request",
      cta_label: "Request a Call Back",
      cta_location: "header",
    });
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_request_callback", {
        page_path: window.location.pathname,
        source: "header",
      });
    }
  };

  return (
    <>
      <header 
        className={cn(
          "w-full border-b border-border bg-background/98 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm z-50 shrink-0 overflow-hidden",
          // Desktop: sticky positioning (normal behavior)
          "lg:sticky lg:top-0",
          // Mobile/tablet: sticky if stickyOnMobile, otherwise fixed for edge-to-edge
          stickyOnMobile && "max-lg:relative",
          !stickyOnMobile && !hideOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          // Hide completely on mobile/tablet for property pages with custom headers
          hideOnMobile && "hidden lg:block",
          // Scroll-based hide/show for mobile/tablet (slide up when hidden) - skip if alwaysVisible or stickyOnMobile
          !hideOnMobile && !alwaysVisible && !stickyOnMobile && isMobileOrTablet && !isVisible && "max-lg:-translate-y-full"
        )}
      >
        {/* Desktop: standard height with oversized logo */}
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:container">
          <Logo size="xl" className="-my-8 sm:-my-8 md:-my-8" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent">
                    Presale
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[500px] p-4 bg-background">
                      <div className="mb-3">
                        <Link 
                          to="/presale-projects" 
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-sm font-medium">All Projects</div>
                            <p className="text-xs text-muted-foreground">Browse all presale developments</p>
                          </div>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t pt-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">PRESALE CONDOS</p>
                          <div className="space-y-0.5">
                            {CONDO_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-condos`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name} Condos
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">PRESALE TOWNHOMES</p>
                          <div className="space-y-0.5">
                            {TOWNHOME_CITY_LINKS.map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/${city.slug}-presale-townhomes`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name} Townhomes
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent">
                    Move-In Ready
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[500px] p-4 bg-background">
                      <div className="mb-3">
                        <Link 
                          to="/resale" 
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Home className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-sm font-medium">All Listings</div>
                            <p className="text-xs text-muted-foreground">Browse all new construction homes</p>
                          </div>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t pt-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">NEW CONDOS</p>
                          <div className="space-y-0.5">
                            {RESALE_CITY_LINKS.slice(0, 6).map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/resale/${city.slug}?type=condo`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name} Condos
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">NEW TOWNHOMES</p>
                          <div className="space-y-0.5">
                            {RESALE_CITY_LINKS.slice(0, 4).map((city) => (
                              <NavigationMenuLink key={`townhome-${city.slug}`} asChild>
                                <Link
                                  to={`/resale/${city.slug}?type=townhouse`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name} Townhomes
                                </Link>
                              </NavigationMenuLink>
                            ))}
                            <div className="border-t my-2" />
                            <NavigationMenuLink asChild>
                              <Link
                                to="/map-search?mode=resale"
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                              >
                                <Map className="h-3 w-3 text-muted-foreground" />
                                Map Search
                              </Link>
                            </NavigationMenuLink>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/calculator"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Calculator
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center">
            <Button size="sm" onClick={openCallBack} className="shadow-sm">
              <Phone className="h-4 w-4 mr-2" />
              Request a Call Back
            </Button>
          </div>

          {/* Mobile Menu - Improved touch targets */}
          <div className="flex items-center gap-1 lg:hidden">
            {/* Mobile Home Button - 48x48 minimum */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 touch-active" 
              asChild
            >
              <Link to="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 touch-active">
                  <span className="sr-only">Toggle menu</span>
                  {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full max-w-full p-0 bg-background border-l-0 shadow-2xl sm:max-w-sm [&>button]:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Header with Logo and Close Button */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <Logo size="xl" onClick={() => setOpen(false)} />
                    {/* Custom circular close button */}
                    <button 
                      onClick={() => setOpen(false)}
                      className="w-11 h-11 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-foreground transition-colors"
                    >
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </div>

                  {/* Contact CTA Row */}
                  <div className="flex items-center gap-6 px-6 pb-5">
                    <Link to="/contact" onClick={() => setOpen(false)} className="flex-1">
                      <Button className="w-full h-12 font-bold tracking-widest text-sm rounded-md bg-foreground text-background hover:bg-foreground/90 uppercase">
                        Contact Us
                      </Button>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border mx-6" />

                  {/* Large Navigation Links - REW Style */}
                  <nav aria-label="Mobile navigation" className="flex-1 pt-8 overflow-y-auto">
                    <div className="space-y-0 px-6">
                      <Link
                        to="/presale-projects"
                        onClick={() => setOpen(false)}
                        className="block text-[32px] font-extrabold text-foreground hover:text-primary transition-colors py-4"
                      >
                        Presales
                      </Link>

                      <Link
                        to="/resale"
                        onClick={() => setOpen(false)}
                        className="block text-[32px] font-extrabold text-foreground hover:text-primary transition-colors py-4"
                      >
                        Move-In Ready
                      </Link>

                      {/* Collapsible Cities Section */}
                      <Collapsible open={citiesOpen} onOpenChange={setCitiesOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-[32px] font-extrabold text-foreground hover:text-primary transition-colors py-4">
                          <span>Cities</span>
                          <ChevronDown className={`h-7 w-7 text-muted-foreground transition-transform duration-200 ${citiesOpen ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 space-y-0 mt-1 mb-2">
                          {CONDO_CITY_LINKS.map((city) => (
                            <Link
                              key={city.slug}
                              to={`/${city.slug}-presale-condos`}
                              onClick={() => setOpen(false)}
                              className="block text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors py-3"
                            >
                              {city.name}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      <Link
                        to="/blog"
                        onClick={() => setOpen(false)}
                        className="block text-[32px] font-extrabold text-foreground hover:text-primary transition-colors py-4"
                      >
                        Blog
                      </Link>

                      <Link
                        to="/calculator"
                        onClick={() => setOpen(false)}
                        className="block text-[32px] font-extrabold text-foreground hover:text-primary transition-colors py-4"
                      >
                        Calculator
                      </Link>

                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header on mobile/tablet - prevents content from hiding under header */}
      {/* Only show spacer when header is fixed (not when stickyOnMobile makes it relative) */}
      {!hideOnMobile && !stickyOnMobile && (
        <div className="h-14 md:h-16 lg:hidden" aria-hidden="true" />
      )}

      <AccessPackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        variant="fit_call"
        source="header"
      />
    </>
  );
}
