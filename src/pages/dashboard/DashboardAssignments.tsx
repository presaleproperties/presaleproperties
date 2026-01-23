import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgentSubscription } from "@/hooks/useAgentSubscription";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { 
  Map, 
  LayoutGrid,
  Search, 
  Heart, 
  Lock, 
  Crown, 
  Building2,
  SlidersHorizontal,
  MessageSquare,
  Loader2,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronRight,
  X
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

const CITIES = ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "Langley", "New Westminster", "Delta", "Abbotsford"];
const BEDS_OPTIONS = [
  { value: "any", label: "Any Beds" },
  { value: "1", label: "1+ Bed" },
  { value: "2", label: "2+ Beds" },
  { value: "3", label: "3+ Beds" },
];
const PRICE_RANGES = [
  { value: "any", label: "Any Price", min: 0, max: Infinity },
  { value: "0-500000", label: "Under $500K", min: 0, max: 500000 },
  { value: "500000-750000", label: "$500K - $750K", min: 500000, max: 750000 },
  { value: "750000-1000000", label: "$750K - $1M", min: 750000, max: 1000000 },
  { value: "1000000-1500000", label: "$1M - $1.5M", min: 1000000, max: 1500000 },
  { value: "1500000-999999999", label: "$1.5M+", min: 1500000, max: Infinity },
];

export default function DashboardAssignments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canAccessAssignments, loading: subLoading, tierLabel } = useAgentSubscription();
  
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("any");
  const [selectedBeds, setSelectedBeds] = useState("any");
  const [selectedPrice, setSelectedPrice] = useState("any");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch assignments
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["agent-assignments", selectedCity, selectedBeds, selectedPrice],
    queryFn: async () => {
      let query = supabase
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

      // Apply filters
      if (selectedCity !== "any") {
        query = query.eq("city", selectedCity);
      }
      if (selectedBeds !== "any") {
        query = query.gte("beds", parseInt(selectedBeds));
      }
      if (selectedPrice !== "any") {
        const range = PRICE_RANGES.find(r => r.value === selectedPrice);
        if (range) {
          query = query.gte("assignment_price", range.min);
          if (range.max !== Infinity) {
            query = query.lte("assignment_price", range.max);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: canAccessAssignments,
  });

  // Fetch saved assignments
  const { data: savedData } = useQuery({
    queryKey: ["saved-assignments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_assignments")
        .select("listing_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(s => s.listing_id);
    },
    enabled: !!user && canAccessAssignments,
  });

  const savedIds = useMemo(() => new Set(savedData || []), [savedData]);
  const assignments = assignmentsData || [];

  // Filter by search and saved
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          a.title?.toLowerCase().includes(q) ||
          a.project_name?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.neighborhood?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (showSavedOnly && !savedIds.has(a.id)) {
        return false;
      }
      return true;
    });
  }, [assignments, searchQuery, showSavedOnly, savedIds]);

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
      } else {
        await supabase
          .from("saved_assignments")
          .insert({ user_id: user.id, listing_id: listingId });
      }
      queryClient.invalidateQueries({ queryKey: ["saved-assignments"] });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const activeFilterCount = [
    selectedCity !== "any",
    selectedBeds !== "any",
    selectedPrice !== "any",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCity("any");
    setSelectedBeds("any");
    setSelectedPrice("any");
    setSearchQuery("");
    setShowSavedOnly(false);
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["agent-assignments"] });
  }, [queryClient]);

  // Filter Controls Component
  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">City</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="any">All Cities</option>
          {CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Bedrooms</label>
        <select
          value={selectedBeds}
          onChange={(e) => setSelectedBeds(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {BEDS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Price Range</label>
        <select
          value={selectedPrice}
          onChange={(e) => setSelectedPrice(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {PRICE_RANGES.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

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
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {[
              { tier: "Core", price: "$99/mo", features: ["Full assignment access", "Map & list view", "Save favorites"] },
              { tier: "Pro", price: "$199/mo", features: ["Everything in Core", "Direct agent contact", "Priority alerts"], popular: true },
              { tier: "Elite", price: "$399/mo", features: ["Everything in Pro", "Off-market access", "Dedicated support"] },
            ].map((plan) => (
              <Card key={plan.tier} className={cn("relative", plan.popular && "border-primary shadow-lg")}>
                {plan.popular && <Badge className="absolute -top-2 right-4 bg-primary">Most Popular</Badge>}
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
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Assignment Portal
            </h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredAssignments.length}</span> assignments available
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="ml-2 text-primary hover:underline">
                  Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Crown className="h-3 w-3 mr-1" />
              {tierLabel} Member
            </Badge>
          </div>
        </div>

        {/* City Filter Chips */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSelectedCity("any")}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                selectedCity === "any"
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              All Cities
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectedCity === city
                    ? "bg-foreground text-background"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project, neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            {/* Saved Toggle */}
            <Button
              variant={showSavedOnly ? "default" : "outline"}
              size="sm"
              className="h-10"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
            >
              <Heart className={cn("h-4 w-4 mr-2", showSavedOnly && "fill-current")} />
              Saved ({savedIds.size})
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border border-input rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors",
                  viewMode === "grid" ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors",
                  viewMode === "map" ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                <Map className="h-4 w-4" />
                Map
              </button>
            </div>

            {/* Mobile Filters */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden relative h-10 px-3">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterControls />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterControls />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : viewMode === "map" ? (
              <SafeMapWrapper height="h-[600px]">
                <Suspense fallback={
                  <div className="h-[600px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }>
                  <div className="h-[600px] rounded-xl overflow-hidden border border-border">
                    <AssignmentsMap 
                      assignments={filteredAssignments}
                      savedIds={savedIds}
                      onToggleSave={toggleSave}
                      currentUserId={user?.id}
                    />
                  </div>
                </Suspense>
              </SafeMapWrapper>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isSaved={savedIds.has(assignment.id)}
                    onToggleSave={() => toggleSave(assignment.id)}
                    isOwn={assignment.agent_id === user?.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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
    ? `${assignment.completion_month}/${assignment.completion_year}`
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
