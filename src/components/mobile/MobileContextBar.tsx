import { useState, useEffect } from "react";
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

  const selectedCityName = CITIES.find(c => c.slug === selectedCity)?.name || "All Metro Vancouver";

  const handleCitySelect = (slug: string) => {
    onCityChange(slug);
    setLocationOpen(false);
  };

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Location Selector */}
        <Sheet open={locationOpen} onOpenChange={setLocationOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 active:opacity-70 transition-opacity">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground max-w-[180px] truncate">
                {selectedCityName}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>Select Location</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {CITIES.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => handleCitySelect(city.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    selectedCity === city.slug 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{city.name}</span>
                  {selectedCity === city.slug && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {alertCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-destructive text-destructive-foreground"
            >
              {alertCount > 9 ? "9+" : alertCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
