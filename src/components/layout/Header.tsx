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
import presaleLogo from "@/assets/presale-logo.png";

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
        <Link to="/" className="flex items-center shrink-0">
          <img 
            src={presaleLogo} 
            alt="Presale Properties" 
            className="h-12 sm:h-14 w-auto object-contain"
          />
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
              className="w-[280px] p-0 bg-background border-l-0 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Navigation Links */}
                <nav className="flex-1 pt-8 overflow-y-auto">
                  <div className="space-y-1 px-3">
                    {/* Presale Projects with Cities Dropdown */}
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

                    {/* Collapsible Cities Section */}
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

                    {/* Other Nav Links */}
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
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive("/agents") 
                          ? "bg-primary/10 text-primary" 
                          : "text-primary hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-[15px] font-medium">For Agents</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 space-y-2 border-t">
                  <Link to="/login" onClick={() => setOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-11 font-medium">
                      Agent Login
                    </Button>
                  </Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="block">
                    <Button className="w-full h-11 font-medium">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}