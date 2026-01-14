import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Menu, X, Building2, ChevronDown, MapPin, Home, Map } from "lucide-react";
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
];

// Resale city links
const RESALE_CITY_LINKS = [
  { slug: "vancouver", name: "Vancouver" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "surrey", name: "Surrey" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "langley", name: "Langley" },
];

interface ConversionHeaderProps {
  hideOnMobile?: boolean;
}

export function ConversionHeader({ hideOnMobile = false }: ConversionHeaderProps) {
  const [open, setOpen] = useState(false);
  const [presaleOpen, setPresaleOpen] = useState(false);
  const [resaleOpen, setResaleOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const location = useLocation();
  
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

  const openCallBack = () => {
    setModalOpen(true);
    setOpen(false);
    trackCTAClick({
      cta_type: "callback_request",
      cta_label: "Contact Us",
      cta_location: "header",
    });
  };

  return (
    <>
      <header 
        className={cn(
          "w-full bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 z-50",
          "border-b border-border/50",
          // Desktop: sticky
          "lg:sticky lg:top-0",
          // Mobile/tablet: fixed with smooth transition
          !hideOnMobile && "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          hideOnMobile && "hidden lg:block",
          !hideOnMobile && isMobileOrTablet && !isVisible && "max-lg:-translate-y-full"
        )}
      >
        <div className="flex h-14 lg:h-16 items-center justify-between px-4 lg:container lg:px-6">
          {/* Logo */}
          <Logo size="xl" className="-my-6" />

          {/* Desktop Navigation - Clean and minimal */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                {/* Presale Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 bg-transparent data-[state=open]:bg-muted/50 rounded-lg transition-all">
                    Presale
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[380px] p-5 bg-background rounded-xl shadow-xl border border-border/50">
                      {/* Main Link */}
                      <Link 
                        to="/presale-projects" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">All Presale Projects</div>
                          <p className="text-xs text-muted-foreground">Browse all upcoming developments</p>
                        </div>
                      </Link>
                      
                      {/* City Grid */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">By City</p>
                        <div className="grid grid-cols-2 gap-1">
                          {CONDO_CITY_LINKS.map((city) => (
                            <NavigationMenuLink key={city.slug} asChild>
                              <Link
                                to={`/${city.slug}-presale-condos`}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/70 transition-colors text-sm text-foreground/80 hover:text-foreground"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {city.name}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Move-In Ready Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 bg-transparent data-[state=open]:bg-muted/50 rounded-lg transition-all">
                    Move-In Ready
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[380px] p-5 bg-background rounded-xl shadow-xl border border-border/50">
                      {/* Main Links */}
                      <div className="space-y-1">
                        <Link 
                          to="/resale" 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <Home className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">All New Homes</div>
                            <p className="text-xs text-muted-foreground">Brand new, ready to move in</p>
                          </div>
                        </Link>
                        <Link 
                          to="/map-search" 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <Map className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Map Search</div>
                            <p className="text-xs text-muted-foreground">Find by location</p>
                          </div>
                        </Link>
                      </div>
                      
                      {/* City Grid */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">By City</p>
                        <div className="grid grid-cols-2 gap-1">
                          {RESALE_CITY_LINKS.map((city) => (
                            <NavigationMenuLink key={city.slug} asChild>
                              <Link
                                to={`/resale/${city.slug}`}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/70 transition-colors text-sm text-foreground/80 hover:text-foreground"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {city.name}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            {/* Direct Links */}
            <Link
              to="/blog"
              className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all flex items-center"
            >
              Blog
            </Link>
            <Link
              to="/calculator"
              className="h-10 px-4 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all flex items-center"
            >
              Calculator
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button 
              size="sm" 
              onClick={openCallBack} 
              className="h-10 px-5 font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </div>

          {/* Mobile/Tablet Menu */}
          <div className="flex items-center gap-0 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 rounded-full hover:bg-muted/70 transition-colors"
                >
                  <span className="sr-only">Menu</span>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full max-w-full sm:max-w-[400px] p-0 bg-background border-l border-border/50 [&>button]:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <Logo size="lg" onClick={() => setOpen(false)} />
                    <button 
                      onClick={() => setOpen(false)}
                      className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 space-y-1">
                      {/* Presale Section */}
                      <Collapsible open={presaleOpen} onOpenChange={setPresaleOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-lg font-semibold">Presale</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform duration-200",
                            presaleOpen && "rotate-180"
                          )} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1 ml-4 pl-9 border-l-2 border-muted space-y-1">
                          <Link
                            to="/presale-projects"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                          >
                            All Projects
                          </Link>
                          {CONDO_CITY_LINKS.map((city) => (
                            <Link
                              key={city.slug}
                              to={`/${city.slug}-presale-condos`}
                              onClick={() => setOpen(false)}
                              className="block px-4 py-3 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              {city.name}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Move-In Ready Section */}
                      <Collapsible open={resaleOpen} onOpenChange={setResaleOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Home className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-lg font-semibold">Move-In Ready</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform duration-200",
                            resaleOpen && "rotate-180"
                          )} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1 ml-4 pl-9 border-l-2 border-muted space-y-1">
                          <Link
                            to="/resale"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                          >
                            All Listings
                          </Link>
                          <Link
                            to="/map-search"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                          >
                            Map Search
                          </Link>
                          {RESALE_CITY_LINKS.map((city) => (
                            <Link
                              key={city.slug}
                              to={`/resale/${city.slug}`}
                              onClick={() => setOpen(false)}
                              className="block px-4 py-3 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              {city.name}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Direct Links */}
                      <Link
                        to="/blog"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-lg">📝</span>
                        </div>
                        <span className="text-lg font-semibold">Blog</span>
                      </Link>

                      <Link
                        to="/calculator"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-lg">🧮</span>
                        </div>
                        <span className="text-lg font-semibold">Calculator</span>
                      </Link>
                    </div>
                  </nav>

                  {/* Footer CTA */}
                  <div className="p-4 border-t border-border/50 bg-muted/30">
                    <Button 
                      onClick={openCallBack}
                      className="w-full h-12 text-base font-semibold rounded-xl"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Contact Us
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header on mobile/tablet */}
      {!hideOnMobile && (
        <div className="h-14 lg:hidden" aria-hidden="true" />
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
