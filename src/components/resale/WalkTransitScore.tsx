import { useEffect, useState, useCallback } from "react";
import { Footprints, Train, Bike, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WalkTransitScoreProps {
  latitude: number;
  longitude: number;
}

interface ScoreData {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  walkLabel: string;
  transitLabel: string;
  bikeLabel: string;
}

interface NearbyCount {
  schools: number;
  grocery: number;
  transit: number;
  parks: number;
  healthcare: number;
  restaurants: number;
  shops: number;
}

function buildOverpassQuery(lat: number, lon: number): string {
  const queries = [
    // Schools (500m radius)
    `node["amenity"~"school|kindergarten"](around:500,${lat},${lon});`,
    `way["amenity"~"school|kindergarten"](around:500,${lat},${lon});`,
    // Grocery (800m radius)
    `node["shop"~"supermarket|grocery|convenience"](around:800,${lat},${lon});`,
    // Transit (1km radius)
    `node["public_transport"="station"](around:1000,${lat},${lon});`,
    `node["railway"~"station|halt|tram_stop"](around:1000,${lat},${lon});`,
    `node["highway"="bus_stop"](around:500,${lat},${lon});`,
    // Parks (800m radius)
    `node["leisure"~"park|playground"](around:800,${lat},${lon});`,
    `way["leisure"~"park|playground"](around:800,${lat},${lon});`,
    // Healthcare (1km radius)
    `node["amenity"~"hospital|clinic|doctors|pharmacy"](around:1000,${lat},${lon});`,
    // Restaurants & Cafes (500m radius)
    `node["amenity"~"restaurant|cafe|fast_food"](around:500,${lat},${lon});`,
    // Shops (500m radius)
    `node["shop"~"mall|department_store|clothes|bakery"](around:500,${lat},${lon});`,
  ];

  return `[out:json][timeout:15];(${queries.join('')});out count;`;
}

function categorizeElement(tags: Record<string, string>): keyof NearbyCount | null {
  if (tags.amenity === "school" || tags.amenity === "kindergarten") return "schools";
  if (tags.shop === "supermarket" || tags.shop === "grocery" || tags.shop === "convenience") return "grocery";
  if (tags.public_transport || tags.railway || tags.highway === "bus_stop") return "transit";
  if (tags.leisure === "park" || tags.leisure === "playground") return "parks";
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "doctors" || tags.amenity === "pharmacy") return "healthcare";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe" || tags.amenity === "fast_food") return "restaurants";
  if (tags.shop === "mall" || tags.shop === "department_store" || tags.shop === "clothes" || tags.shop === "bakery") return "shops";
  return null;
}

function calculateScores(counts: NearbyCount): ScoreData {
  // Walk Score calculation (based on walkable amenities)
  // Weighted scoring: grocery (30%), restaurants (20%), shops (15%), schools (15%), parks (10%), healthcare (10%)
  let walkScore = 0;
  walkScore += Math.min(counts.grocery * 8, 30); // Max 30 points from grocery
  walkScore += Math.min(counts.restaurants * 2, 20); // Max 20 points from restaurants
  walkScore += Math.min(counts.shops * 3, 15); // Max 15 points from shops
  walkScore += Math.min(counts.schools * 5, 15); // Max 15 points from schools
  walkScore += Math.min(counts.parks * 3, 10); // Max 10 points from parks
  walkScore += Math.min(counts.healthcare * 3, 10); // Max 10 points from healthcare
  walkScore = Math.min(Math.round(walkScore), 100);

  // Transit Score calculation (based on transit options)
  let transitScore = 0;
  // Bus stops contribute up to 40 points, stations up to 60 points
  const busStops = Math.min(counts.transit, 10);
  const stations = Math.max(0, counts.transit - busStops);
  transitScore += busStops * 4; // 4 points per bus stop, max 40
  transitScore += stations * 15; // 15 points per station, max 60
  transitScore = Math.min(Math.round(transitScore), 100);

  // Bike Score (based on parks, bike-friendly infrastructure proximity)
  let bikeScore = 0;
  bikeScore += Math.min(counts.parks * 8, 40); // Parks are great for biking
  bikeScore += Math.min(counts.grocery * 5, 25); // Close amenities = less driving
  bikeScore += Math.min(counts.restaurants * 2, 20); // Entertainment nearby
  bikeScore += Math.min(counts.transit * 2, 15); // Multi-modal options
  bikeScore = Math.min(Math.round(bikeScore), 100);

  return {
    walkScore,
    transitScore,
    bikeScore,
    walkLabel: getWalkLabel(walkScore),
    transitLabel: getTransitLabel(transitScore),
    bikeLabel: getBikeLabel(bikeScore),
  };
}

function getWalkLabel(score: number): string {
  if (score >= 90) return "Walker's Paradise";
  if (score >= 70) return "Very Walkable";
  if (score >= 50) return "Somewhat Walkable";
  if (score >= 25) return "Car-Dependent";
  return "Almost All Errands Require a Car";
}

function getTransitLabel(score: number): string {
  if (score >= 90) return "Excellent Transit";
  if (score >= 70) return "Excellent Transit";
  if (score >= 50) return "Good Transit";
  if (score >= 25) return "Some Transit";
  return "Minimal Transit";
}

function getBikeLabel(score: number): string {
  if (score >= 90) return "Biker's Paradise";
  if (score >= 70) return "Very Bikeable";
  if (score >= 50) return "Bikeable";
  if (score >= 25) return "Somewhat Bikeable";
  return "Minimal Bike Infrastructure";
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 25) return "text-orange-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function WalkTransitScore({ latitude, longitude }: WalkTransitScoreProps) {
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchScores = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    
    try {
      // Build a simpler query to count amenities
      const bbox = `(around:1000,${latitude},${longitude})`;
      const query = `[out:json][timeout:15];
        (
          node["amenity"~"school|kindergarten"]${bbox};
          way["amenity"~"school|kindergarten"]${bbox};
          node["shop"~"supermarket|grocery|convenience"]${bbox};
          node["public_transport"="station"]${bbox};
          node["railway"~"station|halt|tram_stop"]${bbox};
          node["highway"="bus_stop"](around:500,${latitude},${longitude});
          node["leisure"~"park|playground"]${bbox};
          way["leisure"~"park|playground"]${bbox};
          node["amenity"~"hospital|clinic|doctors|pharmacy"]${bbox};
          node["amenity"~"restaurant|cafe|fast_food"](around:500,${latitude},${longitude});
          node["shop"~"mall|department_store|clothes|bakery"](around:500,${latitude},${longitude});
        );
        out body;`;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      
      // Count by category
      const counts: NearbyCount = {
        schools: 0,
        grocery: 0,
        transit: 0,
        parks: 0,
        healthcare: 0,
        restaurants: 0,
        shops: 0,
      };

      data.elements.forEach((el: any) => {
        const category = categorizeElement(el.tags || {});
        if (category) {
          counts[category]++;
        }
      });

      const calculatedScores = calculateScores(counts);
      setScores(calculatedScores);
    } catch (err) {
      console.error("Error fetching walkability scores:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  if (isLoading) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 md:p-6 border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Calculating walkability scores...</span>
        </div>
      </div>
    );
  }

  if (error || !scores) {
    return null; // Silently fail - don't show broken UI
  }

  const scoreItems = [
    {
      icon: Footprints,
      label: "Walk Score",
      score: scores.walkScore,
      description: scores.walkLabel,
      tooltip: "Walk Score measures the walkability of any address based on the distance to nearby amenities.",
    },
    {
      icon: Train,
      label: "Transit Score",
      score: scores.transitScore,
      description: scores.transitLabel,
      tooltip: "Transit Score measures how well a location is served by public transit.",
    },
    {
      icon: Bike,
      label: "Bike Score",
      score: scores.bikeScore,
      description: scores.bikeLabel,
      tooltip: "Bike Score measures whether an area is good for biking based on infrastructure and topography.",
    },
  ];

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Walkability & Transit</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Scores are estimated based on nearby amenities within walking distance. Higher scores indicate better walkability.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {scoreItems.map(({ icon: Icon, label, score, description, tooltip }) => (
          <TooltipProvider key={label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center text-center p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-help">
                  {/* Score Circle */}
                  <div className="relative mb-2">
                    <svg className="w-14 h-14 md:w-16 md:h-16 -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="fill-none stroke-muted stroke-[6]"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className={`fill-none stroke-[6] ${getScoreBgColor(score)}`}
                        strokeLinecap="round"
                        strokeDasharray={`${score * 2.83} 283`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg md:text-xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                  </div>
                  
                  {/* Icon & Label */}
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                  
                  {/* Description */}
                  <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                    {description}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export default WalkTransitScore;
