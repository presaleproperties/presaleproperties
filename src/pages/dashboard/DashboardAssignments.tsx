import { useState, useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgentSubscription } from "@/hooks/useAgentSubscription";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { 
  Map, 
  List, 
  Search, 
  Heart, 
  Lock, 
  Crown, 
  Building2,
  Filter,
  SlidersHorizontal,
  MessageSquare,
  Loader2,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the map component
const AssignmentsMap = lazy(() => import("@/components/assignments/AssignmentsMap"));

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  completion_month: number | null;
  completion_year: number | null;
  construction_status: string;
  map_lat: number | null;
  map_lng: number | null;
  agent_id: string;
  status: string;
  listing_photos?: { url: string; sort_order: number }[];
}

interface SavedAssignment {
  listing_id: string;
}

const CITIES = ["All Cities", "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "Langley", "New Westminster", "Delta", "Abbotsford"];
const BEDS_OPTIONS = ["Any Beds", "1+", "2+", "3+"];
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under $500K", min: 0, max: 500000 },
  { label: "$500K - $750K", min: 500000, max: 750000 },
  { label: "$750K - $1M", min: 750000, max: 1000000 },
  { label: "$1M - $1.5M", min: 1000000, max: 1500000 },
  { label: "$1.5M+", min: 1500000, max: Infinity },
];

export default function DashboardAssignments() {
  const { user } = useAuth();
  const { canAccessAssignments, loading: subLoading, tierLabel, hasActiveSubscription } = useAgentSubscription();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedBeds, setSelectedBeds] = useState("Any Beds");
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);

  // Map visibility
  const [isMapVisible, setIsMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading map
  useEffect(() => {
    if (!canAccessAssignments) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (mapRef.current) {
      observer.observe(mapRef.current);
    }
    
    return () => observer.disconnect();
  }, [canAccessAssignments]);

  useEffect(() => {
    if (user && canAccessAssignments) {
      fetchAssignments();
      fetchSavedAssignments();
    }
  }, [user, canAccessAssignments]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, title, project_name, city, neighborhood,
          assignment_price, original_price, beds, baths, interior_sqft,
          completion_month, completion_year, construction_status, map_lat, map_lng,
          agent_id, status,
          listing_photos(url, sort_order)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments((data as Assignment[]) || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAssignments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("saved_assignments")
        .select("listing_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedIds(new Set(data?.map(s => s.listing_id) || []));
    } catch (error) {
      console.error("Error fetching saved assignments:", error);
    }
  };

  const toggleSave = async (listingId: string) => {
    if (!user) return;

    const isSaved = savedIds.has(listingId);

    try {
      if (isSaved) {
        await supabase
          .from("saved_assignments")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      } else {
        await supabase
          .from("saved_assignments")
          .insert({ user_id: user.id, listing_id: listingId });
        setSavedIds(prev => new Set([...prev, listingId]));
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          a.title?.toLowerCase().includes(query) ||
          a.project_name?.toLowerCase().includes(query) ||
          a.city?.toLowerCase().includes(query) ||
          a.neighborhood?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // City filter
      if (selectedCity !== "All Cities" && a.city !== selectedCity) {
        return false;
      }

      // Beds filter
      if (selectedBeds !== "Any Beds") {
        const minBeds = parseInt(selectedBeds.replace("+", ""));
        if (a.beds < minBeds) return false;
      }

      // Price filter
      if (a.assignment_price < selectedPriceRange.min || a.assignment_price > selectedPriceRange.max) {
        return false;
      }

      // Saved filter
      if (showSavedOnly && !savedIds.has(a.id)) {
        return false;
      }

      return true;
    });
  }, [assignments, searchQuery, selectedCity, selectedBeds, selectedPriceRange, showSavedOnly, savedIds]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  // Show paywall if no subscription
  if (!subLoading && !canAccessAssignments) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Assignment Portal</h1>
          <p className="text-muted-foreground mb-8">
            Unlock access to all assignment listings with an active subscription. 
            Browse the map, save favorites, and connect directly with listing agents.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {[
              { tier: "Core", price: "$99/mo", features: ["Full assignment access", "Map & list view", "Save favorites"] },
              { tier: "Pro", price: "$199/mo", features: ["Everything in Core", "Direct agent contact", "Priority alerts"], popular: true },
              { tier: "Elite", price: "$399/mo", features: ["Everything in Pro", "Off-market access", "Dedicated support"] },
            ].map((plan) => (
              <Card key={plan.tier} className={cn(
                "relative",
                plan.popular && "border-primary shadow-lg"
              )}>
                {plan.popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">Most Popular</Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.tier}</CardTitle>
                  <p className="text-2xl font-bold">{plan.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Crown className="h-3 w-3 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant={plan.popular ? "default" : "outline"}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Questions? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Assignment Portal</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Crown className="h-3 w-3 mr-1" />
                {tierLabel} Member
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredAssignments.length} assignments available
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showSavedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
            >
              <Heart className={cn("h-4 w-4 mr-2", showSavedOnly && "fill-current")} />
              Saved ({savedIds.size})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project, city, or neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={selectedBeds}
                onChange={(e) => setSelectedBeds(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {BEDS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select
                value={selectedPriceRange.label}
                onChange={(e) => {
                  const range = PRICE_RANGES.find(r => r.label === e.target.value);
                  if (range) setSelectedPriceRange(range);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.label} value={range.label}>{range.label}</option>
                ))}
              </select>
            </div>

            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("map")}
                className={cn(
                  "px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors",
                  view === "map" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Map className="h-4 w-4" />
                Map
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors",
                  view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : view === "map" ? (
          <div ref={mapRef}>
            <SafeMapWrapper height="h-[600px]">
              {isMapVisible && (
                <Suspense fallback={
                  <div className="h-[600px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }>
                  <AssignmentsMap 
                    assignments={filteredAssignments}
                    savedIds={savedIds}
                    onToggleSave={toggleSave}
                    currentUserId={user?.id}
                  />
                </Suspense>
              )}
            </SafeMapWrapper>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  isSaved={savedIds.has(assignment.id)}
                  onToggleSave={() => toggleSave(assignment.id)}
                  isOwn={assignment.agent_id === user?.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  isSaved: boolean;
  onToggleSave: () => void;
  isOwn: boolean;
}

function AssignmentCard({ assignment, isSaved, onToggleSave, isOwn }: AssignmentCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const savings = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : null;

  const mainPhoto = assignment.listing_photos?.sort((a, b) => a.sort_order - b.sort_order)?.[0]?.url;

  const completionText = assignment.completion_month && assignment.completion_year
    ? `${assignment.completion_month} ${assignment.completion_year}`
    : assignment.completion_year
    ? `${assignment.completion_year}`
    : null;

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] bg-muted">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={assignment.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Save button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSave();
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/90 hover:bg-background transition-colors shadow-sm"
        >
          <Heart className={cn(
            "h-5 w-5",
            isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"
          )} />
        </button>

        {/* Own listing badge */}
        {isOwn && (
          <Badge className="absolute top-3 left-3 bg-primary">Your Listing</Badge>
        )}

        {/* Savings badge */}
        {savings && savings > 0 && (
          <Badge className="absolute bottom-3 left-3 bg-green-600 text-white">
            Save {formatPrice(savings)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-1">{assignment.title || assignment.project_name}</h3>
          <p className="font-bold text-primary whitespace-nowrap">
            {formatPrice(assignment.assignment_price)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {assignment.neighborhood ? `${assignment.neighborhood}, ` : ""}{assignment.city}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {assignment.beds} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {assignment.baths} bath
          </span>
          {assignment.interior_sqft && (
            <span>{assignment.interior_sqft} sqft</span>
          )}
        </div>

        {completionText && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            Completion: {completionText}
          </div>
        )}

        <div className="flex gap-2">
          <Link to={`/assignments/${assignment.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          {!isOwn && (
            <Button variant="default" size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
