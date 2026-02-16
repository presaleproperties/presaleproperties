import { useState, useEffect, useRef } from "react";
import { MapPin, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CITIES = [
  { slug: "all", name: "All Metro Vancouver" },
  { slug: "vancouver", name: "Vancouver" },
  { slug: "surrey", name: "Surrey" },
  { slug: "langley", name: "Langley" },
  { slug: "coquitlam", name: "Coquitlam" },
  { slug: "burnaby", name: "Burnaby" },
  { slug: "delta", name: "Delta" },
  { slug: "richmond", name: "Richmond" },
  { slug: "abbotsford", name: "Abbotsford" },
];

interface MobileContextBarProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  alertCount?: number;
}

export function MobileContextBar({ 
  selectedCity, 
  onCityChange, 
  alertCount = 0 
}: MobileContextBarProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const selectedCityName = CITIES.find(c => c.slug === selectedCity)?.name || "All Metro Vancouver";

  // Scroll detection - only show when at top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Only show when scrolled to top (within threshold)
      setIsVisible(currentScrollY <= scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCitySelect = (slug: string) => {
    onCityChange(slug);
    setLocationOpen(false);
  };

  return (
    <div 
      className={cn(
        "sticky z-40 bg-background border-b border-border md:hidden",
        "transition-all duration-300 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Location Selector - Compact */}
        <Sheet open={locationOpen} onOpenChange={setLocationOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 active:opacity-70 transition-opacity">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground max-w-[180px] truncate">
                {selectedCityName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="text-lg font-bold">Select Location</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pb-6">
              {CITIES.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => handleCitySelect(city.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    selectedCity === city.slug 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium text-sm">{city.name}</span>
                  {selectedCity === city.slug && (
                    <span className="ml-auto">✓</span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Notification Bell - Smaller */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {alertCount > 0 && (
            <Badge 
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[9px] bg-destructive text-destructive-foreground"
            >
              {alertCount > 9 ? "9+" : alertCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
