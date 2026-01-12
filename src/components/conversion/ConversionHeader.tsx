import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Phone, Menu, X, Building2, FileStack, BookOpen, Users, ChevronRight, ChevronDown, MapPin, Calculator, Home, Map } from "lucide-react";
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

export function ConversionHeader() {
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [resaleCitiesOpen, setResaleCitiesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const location = useLocation();

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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/98 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm">
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
                    Resale
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
                            <p className="text-xs text-muted-foreground">Browse all MLS listings</p>
                          </div>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t pt-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">CONDOS BY CITY</p>
                          <div className="space-y-0.5">
                            {RESALE_CITY_LINKS.map((city) => (
                              <NavigationMenuLink key={city.slug} asChild>
                                <Link
                                  to={`/resale/${city.slug}`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">QUICK LINKS</p>
                          <div className="space-y-0.5">
                            <NavigationMenuLink asChild>
                              <Link
                                to="/resale-map"
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                              >
                                <Map className="h-3 w-3 text-muted-foreground" />
                                Map Search
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link
                                to="/resale?new=true"
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                              >
                                <Home className="h-3 w-3 text-muted-foreground" />
                                New Construction Only
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

          {/* Mobile Menu */}
          <div className="flex items-center gap-0.5 lg:hidden">
            {/* Mobile Home Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 shrink-0" 
              asChild
            >
              <Link to="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                  <span className="sr-only">Toggle menu</span>
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] p-0 bg-background border-l-0 shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  <nav className="flex-1 pt-6 overflow-y-auto">
                    <div className="space-y-1 px-4">
                      <Link
                        to="/presale-projects"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                          isActive("/presale-projects") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-base font-medium">Presale</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Collapsible open={citiesOpen} onOpenChange={setCitiesOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-200 text-foreground hover:bg-muted">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span className="text-base font-medium">Browse by City</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${citiesOpen ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-5 space-y-1 mt-1">
                          <p className="text-xs font-semibold text-muted-foreground px-4 py-1">Condos</p>
                          {CONDO_CITY_LINKS.slice(0, 6).map((city) => (
                            <Link
                              key={`condo-${city.slug}`}
                              to={`/${city.slug}-presale-condos`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <span className="text-sm font-medium">{city.name} Condos</span>
                            </Link>
                          ))}
                          <p className="text-xs font-semibold text-muted-foreground px-4 py-1 pt-2">Townhomes</p>
                          {TOWNHOME_CITY_LINKS.map((city) => (
                            <Link
                              key={`townhome-${city.slug}`}
                              to={`/${city.slug}-presale-townhomes`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <span className="text-sm font-medium">{city.name} Townhomes</span>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      <Link
                        to="/resale"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                          isActive("/resale") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Home className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-base font-medium">Resale</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Collapsible open={resaleCitiesOpen} onOpenChange={setResaleCitiesOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-200 text-foreground hover:bg-muted">
                          <div className="flex items-center gap-3">
                            <Map className="h-5 w-5 text-muted-foreground" />
                            <span className="text-base font-medium">Resale by City</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${resaleCitiesOpen ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-5 space-y-1 mt-1">
                          <p className="text-xs font-semibold text-muted-foreground px-4 py-1">Browse by City</p>
                          {RESALE_CITY_LINKS.map((city) => (
                            <Link
                              key={`resale-city-${city.slug}`}
                              to={`/resale/${city.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <span className="text-sm font-medium">{city.name}</span>
                            </Link>
                          ))}
                          <p className="text-xs font-semibold text-muted-foreground px-4 py-1 pt-2">Townhomes</p>
                          {RESALE_CITY_LINKS.map((city) => (
                            <Link
                              key={`resale-townhome-${city.slug}`}
                              to={`/resale?city=${city.name}&type=Townhouse`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <span className="text-sm font-medium">{city.name} Townhomes</span>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      <Link
                        to="/blog"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                          isActive("/blog") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-base font-medium">Blog</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Link
                        to="/calculator"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                          isActive("/calculator") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Calculator className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-base font-medium">Calculator</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                    </div>
                  </nav>

                  <div className="p-5 space-y-3 border-t">
                    <Button onClick={openChatNow} className="w-full h-12 font-semibold text-base">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Chat Now
                    </Button>
                    <Button variant="outline" onClick={openCallBack} className="w-full h-12 font-semibold text-base">
                      <Phone className="h-5 w-5 mr-2" />
                      Request a Call Back
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AccessPackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        variant="fit_call"
        source="header"
      />
    </>
  );
}
