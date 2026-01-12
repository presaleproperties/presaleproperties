import { 
  GraduationCap, 
  Train, 
  ShoppingBag, 
  UtensilsCrossed, 
  TreePine, 
  Stethoscope,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NeighborhoodInsightsProps {
  neighborhood: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

const categories = [
  { 
    icon: GraduationCap, 
    label: "Schools", 
    searchQuery: "schools",
    description: "Elementary, secondary & private schools"
  },
  { 
    icon: Train, 
    label: "Transit", 
    searchQuery: "transit+station",
    description: "SkyTrain, bus & transit hubs"
  },
  { 
    icon: ShoppingBag, 
    label: "Shopping", 
    searchQuery: "shopping+mall",
    description: "Malls, grocery & retail"
  },
  { 
    icon: UtensilsCrossed, 
    label: "Dining", 
    searchQuery: "restaurants",
    description: "Restaurants, cafes & bars"
  },
  { 
    icon: TreePine, 
    label: "Parks", 
    searchQuery: "parks",
    description: "Parks, trails & recreation"
  },
  { 
    icon: Stethoscope, 
    label: "Healthcare", 
    searchQuery: "hospital+clinic",
    description: "Hospitals, clinics & pharmacies"
  },
];

export function NeighborhoodInsights({ 
  neighborhood, 
  city, 
  latitude, 
  longitude 
}: NeighborhoodInsightsProps) {
  const locationName = neighborhood || city;
  
  const getSearchUrl = (searchQuery: string) => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/search/${searchQuery}/@${latitude},${longitude},14z`;
    }
    return `https://www.google.com/maps/search/${searchQuery}+near+${encodeURIComponent(locationName)}+BC`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          Neighborhood Insights
        </h2>
        <p className="text-sm text-muted-foreground">
          Explore what's nearby in {locationName}, {city !== locationName ? city : "BC"}
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map(({ icon: Icon, label, searchQuery, description }) => (
          <a
            key={label}
            href={getSearchUrl(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
            <div className="mt-auto pt-2 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Explore</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </a>
        ))}
      </div>

      {/* Walk Score CTA */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-full gap-1.5"
          asChild
        >
          <a
            href={`https://www.walkscore.com/score/${encodeURIComponent(locationName + " " + city + " BC")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Walk Score
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-full gap-1.5"
          asChild
        >
          <a
            href={`https://www.google.com/maps/search/grocery+stores/@${latitude || 49.2827},${longitude || -123.1207},14z`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nearby Groceries
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
