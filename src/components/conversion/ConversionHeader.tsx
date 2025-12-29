import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Phone, Menu, X, Building2, FileStack, BookOpen, Users, ChevronRight, ChevronDown, MapPin, Search } from "lucide-react";
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

export function ConversionHeader() {
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
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
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_request_callback", {
        page_path: window.location.pathname,
        source: "header",
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight">
              presale<span className="text-primary">properties</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent">
                    Presale Projects
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 bg-background">
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
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">BY CITY</p>
                        <div className="grid grid-cols-2 gap-1">
                          {CITY_LINKS.map((city) => (
                            <NavigationMenuLink key={city.slug} asChild>
                              <Link
                                to={`/presale-condos/${city.slug}`}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm"
                              >
                                <MapPin className="h-3 w-3 text-muted-foreground" />
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
            
            <Link
              to="/assignments"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Assignments
            </Link>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/agents"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              For Agents
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openCallBack}>
              <Phone className="h-4 w-4 mr-2" />
              Request a Call Back
            </Button>
            <Button size="sm" onClick={openChatNow} className="bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-1 lg:hidden">
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
              onClick={openChatNow}
            >
              <MessageCircle className="h-5 w-5" />
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
                className="w-[280px] p-0 bg-background border-l-0 shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  <nav className="flex-1 pt-8 overflow-y-auto">
                    <div className="space-y-1 px-3">
                      <Link
                        to="/presale-projects"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive("/presale-projects") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-[15px] font-medium">Presale Projects</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Collapsible open={citiesOpen} onOpenChange={setCitiesOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-foreground hover:bg-muted">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[15px] font-medium">Cities</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${citiesOpen ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 space-y-1 mt-1">
                          {CITY_LINKS.map((city) => (
                            <Link
                              key={city.slug}
                              to={`/presale-condos/${city.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <span className="text-sm">{city.name}</span>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      <Link
                        to="/assignments"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive("/assignments") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileStack className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-[15px] font-medium">Assignments</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Link
                        to="/blog"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive("/blog") 
                            ? "bg-primary/10 text-primary" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-[15px] font-medium">Blog</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>

                      <Link
                        to="/agents"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-primary hover:bg-primary/5"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-[15px] font-medium">For Agents</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>
                    </div>
                  </nav>

                  <div className="p-4 space-y-2 border-t">
                    <Button onClick={openChatNow} className="w-full h-11 font-medium bg-[#25D366] hover:bg-[#20BD5A] text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" onClick={openCallBack} className="w-full h-11 font-medium">
                      <Phone className="h-4 w-4 mr-2" />
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
