import { MapPin, Train, School, ShoppingBag, Clock, Car, Footprints, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// Generate map search URL for internal linking
const generateMapSearchUrl = (name: string, lat?: number | null, lng?: number | null) => {
  const encodedName = encodeURIComponent(name);
  if (lat && lng) {
    return `/map-search?q=${encodedName}&lat=${lat}&lng=${lng}&zoom=15`;
  }
  return `/map-search?q=${encodedName}`;
};

interface LocationDeepDiveProps {
  projectName: string;
  city: string;
  neighborhood: string;
  address: string | null;
  mapLat: number | null;
  mapLng: number | null;
  nearSkytrain?: boolean;
}

// Neighborhood data with walkability and transit info - exported for schema generation
export const NEIGHBORHOOD_DATA: Record<string, {
  walkScore: number;
  transitScore: number;
  landmarks: { name: string; distance: string; type: "transit" | "shopping" | "nature" | "highway" }[];
  schools: { name: string; rating: number; distance: string }[];
  shopping: { name: string; distance: string }[];
}> = {
  "South Surrey": {
    walkScore: 45,
    transitScore: 35,
    landmarks: [
      { name: "Highway 99", distance: "5 min", type: "highway" },
      { name: "White Rock Beach", distance: "10 min", type: "nature" },
      { name: "Semiahmoo Town Centre", distance: "8 min", type: "shopping" },
    ],
    schools: [
      { name: "Semiahmoo Secondary", rating: 8, distance: "2.1 km" },
      { name: "White Rock Elementary", rating: 7, distance: "1.5 km" },
    ],
    shopping: [
      { name: "Morgan Crossing", distance: "3.2 km" },
      { name: "Grandview Corners", distance: "4.5 km" },
      { name: "White Rock restaurants", distance: "5 km" },
    ],
  },
  "Langley City": {
    walkScore: 65,
    transitScore: 45,
    landmarks: [
      { name: "Langley SkyTrain (2028)", distance: "10 min", type: "transit" },
      { name: "Highway 1", distance: "8 min", type: "highway" },
      { name: "Willowbrook Mall", distance: "5 min", type: "shopping" },
    ],
    schools: [
      { name: "Langley Secondary", rating: 7, distance: "1.8 km" },
      { name: "Nicomekl Elementary", rating: 8, distance: "0.9 km" },
    ],
    shopping: [
      { name: "Willowbrook Shopping Centre", distance: "2.1 km" },
      { name: "Langley Bypass shops", distance: "1.5 km" },
    ],
  },
  "Metrotown": {
    walkScore: 92,
    transitScore: 88,
    landmarks: [
      { name: "Metrotown SkyTrain", distance: "3 min", type: "transit" },
      { name: "Highway 1", distance: "5 min", type: "highway" },
      { name: "Metropolis at Metrotown", distance: "2 min", type: "shopping" },
    ],
    schools: [
      { name: "Burnaby South Secondary", rating: 8, distance: "1.2 km" },
      { name: "Marlborough Elementary", rating: 7, distance: "0.8 km" },
    ],
    shopping: [
      { name: "Metropolis at Metrotown", distance: "0.3 km" },
      { name: "Crystal Mall", distance: "0.8 km" },
    ],
  },
  "Downtown Vancouver": {
    walkScore: 98,
    transitScore: 95,
    landmarks: [
      { name: "Waterfront SkyTrain", distance: "5 min", type: "transit" },
      { name: "Lions Gate Bridge", distance: "10 min", type: "highway" },
      { name: "Stanley Park", distance: "10 min", type: "nature" },
    ],
    schools: [
      { name: "King George Secondary", rating: 7, distance: "2.5 km" },
      { name: "Lord Roberts Elementary", rating: 8, distance: "1.2 km" },
    ],
    shopping: [
      { name: "Pacific Centre", distance: "0.5 km" },
      { name: "Robson Street", distance: "0.3 km" },
    ],
  },
  "Brentwood": {
    walkScore: 85,
    transitScore: 82,
    landmarks: [
      { name: "Brentwood SkyTrain", distance: "3 min", type: "transit" },
      { name: "Highway 1", distance: "5 min", type: "highway" },
      { name: "The Amazing Brentwood", distance: "2 min", type: "shopping" },
    ],
    schools: [
      { name: "Brentwood Park Elementary", rating: 7, distance: "0.6 km" },
      { name: "Alpha Secondary", rating: 7, distance: "1.5 km" },
    ],
    shopping: [
      { name: "The Amazing Brentwood", distance: "0.2 km" },
      { name: "Lougheed Town Centre", distance: "3.5 km" },
    ],
  },
};

// Default data for neighborhoods without specific data - exported for schema generation
export const DEFAULT_NEIGHBORHOOD_DATA = {
  walkScore: 55,
  transitScore: 40,
  landmarks: [
    { name: "Major Highway", distance: "10 min", type: "highway" as const },
    { name: "Local Park", distance: "5 min", type: "nature" as const },
  ],
  schools: [
    { name: "Local Elementary", rating: 7, distance: "1.5 km" },
    { name: "Local Secondary", rating: 7, distance: "2.5 km" },
  ],
  shopping: [
    { name: "Local shopping centre", distance: "2 km" },
    { name: "Grocery stores", distance: "1 km" },
  ],
};

// Helper to get neighborhood data for a specific neighborhood
export const getNeighborhoodData = (neighborhood: string) => {
  return NEIGHBORHOOD_DATA[neighborhood] || DEFAULT_NEIGHBORHOOD_DATA;
};

// Generate amenity schema for structured data
export const generateAmenitySchema = (neighborhood: string, nearSkytrain?: boolean) => {
  const data = getNeighborhoodData(neighborhood);
  return {
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", "name": "Walk Score", "value": data.walkScore },
      { "@type": "LocationFeatureSpecification", "name": "Transit Score", "value": data.transitScore },
      ...(nearSkytrain ? [{ "@type": "LocationFeatureSpecification", "name": "Near SkyTrain", "value": true }] : [])
    ],
    nearbySchools: data.schools.map(school => ({
      "@type": "School",
      "name": school.name,
      "distance": school.distance
    })),
    nearbyShopping: data.shopping.map(shop => ({
      "@type": "LocalBusiness",
      "name": shop.name,
      "distance": shop.distance
    }))
  };
};

export function LocationDeepDive({
  projectName,
  city,
  neighborhood,
  address,
  mapLat,
  mapLng,
  nearSkytrain,
}: LocationDeepDiveProps) {
  const data = getNeighborhoodData(neighborhood);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    return "Car-Dependent";
  };

  return (
    <section 
      id="location" 
      className="bg-muted/30 rounded-xl p-4 md:p-5 lg:p-6"
      aria-label="Location and neighborhood details"
    >
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">Location & Neighborhood</h2>
      </div>

      {/* Walk & Transit Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Footprints className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase">Walk Score</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(data.walkScore)}`}>
              {data.walkScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(data.walkScore)}</p>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Train className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase">Transit Score</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(data.transitScore)}`}>
              {data.transitScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {nearSkytrain ? "Near SkyTrain" : data.transitScore >= 70 ? "Excellent Transit" : "Some Transit"}
          </p>
        </div>
      </div>

      {/* Transit & Accessibility */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Transit & Accessibility
        </h3>
        <ul className="space-y-2">
          {data.landmarks.map((landmark, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <Link 
                to={generateMapSearchUrl(landmark.name, mapLat, mapLng)}
                className="text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                {landmark.name}
              </Link>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {landmark.distance}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Schools */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          Nearby Schools
        </h3>
        <ul className="space-y-2">
          {data.schools.map((school, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Link 
                  to={generateMapSearchUrl(school.name, mapLat, mapLng)}
                  className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  {school.name}
                </Link>
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                  {school.rating}/10
                </span>
              </div>
              <span className="text-muted-foreground text-xs">{school.distance}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Shopping & Dining */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          Shopping & Dining
        </h3>
        <ul className="space-y-2">
          {data.shopping.map((shop, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <Link 
                to={generateMapSearchUrl(shop.name, mapLat, mapLng)}
                className="text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                {shop.name}
              </Link>
              <span className="text-muted-foreground text-xs">{shop.distance}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Link */}
      {mapLat && mapLng && (
        <Link 
          to={`/map-search?lat=${mapLat}&lng=${mapLng}&zoom=15`}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <MapPin className="h-4 w-4 text-primary" />
          View {projectName} on Map
        </Link>
      )}
    </section>
  );
}
