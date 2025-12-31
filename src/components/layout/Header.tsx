import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Building2, FileStack, BookOpen, Users, ChevronRight, ChevronDown, MapPin } from "lucide-react";
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

export function Header() {
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/presale-projects", label: "Presale Projects", icon: Building2 },
    { to: "/assignments", label: "Assignments", icon: FileStack },
    { to: "/blog", label: "Blog", icon: BookOpen },
    { to: "/agents", label: "For Agents", icon: Users, highlight: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
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

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Agent Login
            </Button>
          </Link>
          <Link to="/contact" className="hidden sm:block">
            <Button size="sm" className="shadow-gold">
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="shrink-0">
                <span className="sr-only">Toggle menu</span>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-full max-w-full p-0 bg-background border-l-0 shadow-2xl sm:max-w-sm [&>button]:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header with Logo and Close Button */}
                <div className="flex items-center justify-between px-6 py-5">
                  <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">
                      presale<span className="text-primary">properties</span>
                    </span>
                  </Link>
                  {/* Custom circular close button like REW */}
                  <button 
                    onClick={() => setOpen(false)}
                    className="w-11 h-11 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-foreground transition-colors"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>

                {/* Sign In / Sign Up Row */}
                <div className="flex items-center gap-6 px-6 pb-5">
                  <Link 
                    to="/login" 
                    onClick={() => setOpen(false)}
                    className="text-sm font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase"
                  >
                    Sign-In
                  </Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full h-12 font-bold tracking-widest text-sm rounded-md bg-foreground text-background hover:bg-foreground/90 uppercase">
                      Sign Up
                    </Button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-border mx-6" />

                {/* Large Navigation Links - REW Style */}
                <nav className="flex-1 pt-8 overflow-y-auto">
                  <div className="space-y-1 px-6">
                    <Link
                      to="/presale-projects"
                      onClick={() => setOpen(false)}
                      className="block text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3"
                    >
                      Presales
                    </Link>

                    <Link
                      to="/assignments"
                      onClick={() => setOpen(false)}
                      className="block text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3"
                    >
                      Assignments
                    </Link>

                    {/* Collapsible Cities Section */}
                    <Collapsible open={citiesOpen} onOpenChange={setCitiesOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3">
                        <span>Cities</span>
                        <ChevronDown className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${citiesOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-0 mt-1 mb-2">
                        {CITY_LINKS.map((city) => (
                          <Link
                            key={city.slug}
                            to={`/presale-condos/${city.slug}`}
                            onClick={() => setOpen(false)}
                            className="block text-xl font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                          >
                            {city.name}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    <Link
                      to="/agents"
                      onClick={() => setOpen(false)}
                      className="block text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3"
                    >
                      Agents
                    </Link>

                    <Link
                      to="/mortgage-calculator"
                      onClick={() => setOpen(false)}
                      className="block text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3"
                    >
                      Mortgages
                    </Link>

                    <Link
                      to="/presale-guide"
                      onClick={() => setOpen(false)}
                      className="block text-[28px] font-bold text-foreground hover:text-primary transition-colors py-3"
                    >
                      The Guide
                    </Link>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}