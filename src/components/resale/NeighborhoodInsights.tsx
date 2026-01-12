import { 
  GraduationCap, 
  Train, 
  ShoppingBag, 
  UtensilsCrossed, 
  TreePine, 
  Stethoscope,
  ExternalLink,
  School,
  BookOpen,
  Building,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NeighborhoodInsightsProps {
  neighborhood: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

// BC School Districts by city
const schoolDistrictData: Record<string, { 
  districtNumber: number; 
  districtName: string;
  website: string;
}> = {
  "Vancouver": { districtNumber: 39, districtName: "Vancouver", website: "https://www.vsb.bc.ca" },
  "Surrey": { districtNumber: 36, districtName: "Surrey", website: "https://www.surreyschools.ca" },
  "Burnaby": { districtNumber: 41, districtName: "Burnaby", website: "https://burnabyschools.ca" },
  "Richmond": { districtNumber: 38, districtName: "Richmond", website: "https://www.sd38.bc.ca" },
  "Coquitlam": { districtNumber: 43, districtName: "Coquitlam", website: "https://www.sd43.bc.ca" },
  "Port Coquitlam": { districtNumber: 43, districtName: "Coquitlam", website: "https://www.sd43.bc.ca" },
  "Port Moody": { districtNumber: 43, districtName: "Coquitlam", website: "https://www.sd43.bc.ca" },
  "Langley": { districtNumber: 35, districtName: "Langley", website: "https://www.sd35.bc.ca" },
  "Delta": { districtNumber: 37, districtName: "Delta", website: "https://www.deltasd.bc.ca" },
  "New Westminster": { districtNumber: 40, districtName: "New Westminster", website: "https://newwestschools.ca" },
  "North Vancouver": { districtNumber: 44, districtName: "North Vancouver", website: "https://www.sd44.ca" },
  "West Vancouver": { districtNumber: 45, districtName: "West Vancouver", website: "https://westvancouverschools.ca" },
  "Abbotsford": { districtNumber: 34, districtName: "Abbotsford", website: "https://www.abbyschools.ca" },
  "Chilliwack": { districtNumber: 33, districtName: "Chilliwack", website: "https://www.sd33.bc.ca" },
  "Maple Ridge": { districtNumber: 42, districtName: "Maple Ridge - Pitt Meadows", website: "https://www.sd42.ca" },
  "Pitt Meadows": { districtNumber: 42, districtName: "Maple Ridge - Pitt Meadows", website: "https://www.sd42.ca" },
  "Mission": { districtNumber: 75, districtName: "Mission", website: "https://www.mpsd.ca" },
  "White Rock": { districtNumber: 36, districtName: "Surrey", website: "https://www.surreyschools.ca" },
};

const categories = [
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
  const district = schoolDistrictData[city];
  
  const getSearchUrl = (searchQuery: string) => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/search/${searchQuery}/@${latitude},${longitude},14z`;
    }
    return `https://www.google.com/maps/search/${searchQuery}+near+${encodeURIComponent(locationName)}+BC`;
  };

  const getFraserInstituteUrl = () => {
    return `https://www.compareschoolrankings.org/school-rankings-by-city/british-columbia/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          Neighborhood Insights
        </h2>
        <p className="text-sm text-muted-foreground">
          Explore what's nearby in {locationName}, {city !== locationName ? city : "BC"}
        </p>
      </div>

      {/* Schools & Education Section */}
      <div className="bg-muted/30 rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Schools & Education</h3>
            {district && (
              <p className="text-xs text-muted-foreground">
                School District #{district.districtNumber} - {district.districtName}
              </p>
            )}
          </div>
        </div>

        {/* School Types Grid */}
        <div className="grid grid-cols-3 gap-2">
          <a
            href={getSearchUrl("elementary+school")}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-3 bg-background hover:bg-muted/50 rounded-lg transition-colors text-center"
          >
            <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary mb-1" />
            <span className="text-xs font-medium">Elementary</span>
          </a>
          <a
            href={getSearchUrl("secondary+school+high+school")}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-3 bg-background hover:bg-muted/50 rounded-lg transition-colors text-center"
          >
            <School className="h-5 w-5 text-muted-foreground group-hover:text-primary mb-1" />
            <span className="text-xs font-medium">Secondary</span>
          </a>
          <a
            href={getSearchUrl("private+school")}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-3 bg-background hover:bg-muted/50 rounded-lg transition-colors text-center"
          >
            <Building className="h-5 w-5 text-muted-foreground group-hover:text-primary mb-1" />
            <span className="text-xs font-medium">Private</span>
          </a>
        </div>

        {/* School Ratings & District Links */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs rounded-full gap-1.5"
            asChild
          >
            <a
              href={getFraserInstituteUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Star className="h-3 w-3" />
              School Rankings
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          {district && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-full gap-1.5"
              asChild
            >
              <a
                href={district.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                District Website
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs rounded-full gap-1.5"
            asChild
          >
            <a
              href={`https://www.bced.gov.bc.ca/apps/imcl/imclWeb/FindSchool.do`}
              target="_blank"
              rel="noopener noreferrer"
            >
              BC School Finder
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        {/* District Info Badge */}
        {district && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Badge variant="secondary" className="text-xs">
              SD{district.districtNumber}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {district.districtName} School District serves this area
            </span>
          </div>
        )}
      </div>
      
      {/* Other Amenities Grid */}
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

      {/* Walk Score & Additional Links */}
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
