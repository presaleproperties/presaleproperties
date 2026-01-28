import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Home, MapPin, PawPrint, Sofa, Bed, Bath, 
  Square, ExternalLink, Search, Filter, X,
  Calendar, Check, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface RentalFilters {
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  petsAllowed: string;
  furnished: string;
  availability: string;
  search: string;
}

const BEDROOM_OPTIONS = [
  { value: "all", label: "All Bedrooms" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3+ Bedrooms" },
];

const PET_OPTIONS = [
  { value: "all", label: "All Pet Policies" },
  { value: "yes", label: "Pet Friendly" },
  { value: "no", label: "No Pets" },
];

const FURNISHED_OPTIONS = [
  { value: "all", label: "All Furnishing" },
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "partial", label: "Partially Furnished" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Availability" },
  { value: "immediate", label: "Immediate" },
  { value: "upcoming", label: "Upcoming" },
];

export function RentalListingsTable() {
  const [filters, setFilters] = useState<RentalFilters>({
    city: "all",
    minPrice: "",
    maxPrice: "",
    bedrooms: "all",
    petsAllowed: "all",
    furnished: "all",
    availability: "all",
    search: "",
  });
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Fetch cities for filter dropdown
  const { data: cities } = useQuery({
    queryKey: ["rental-cities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mls_listings")
        .select("city")
        .eq("is_rental", true)
        .eq("mls_status", "Active");
      
      const uniqueCities = [...new Set(data?.map(d => d.city).filter(Boolean))];
      return uniqueCities.sort();
    },
  });

  // Fetch rental listings with filters
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["rental-listings", filters, page],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("*", { count: "exact" })
        .eq("is_rental", true)
        .eq("mls_status", "Active")
        .order("lease_amount", { ascending: false });

      // Apply city filter
      if (filters.city !== "all") {
        query = query.eq("city", filters.city);
      }

      // Apply price filters
      if (filters.minPrice) {
        query = query.gte("lease_amount", parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte("lease_amount", parseInt(filters.maxPrice));
      }

      // Apply bedroom filter
      if (filters.bedrooms !== "all") {
        if (filters.bedrooms === "3") {
          query = query.gte("bedrooms_total", 3);
        } else {
          query = query.eq("bedrooms_total", parseInt(filters.bedrooms));
        }
      }

      // Apply pet filter
      if (filters.petsAllowed === "yes") {
        query = query.not("pets_allowed", "is", null).neq("pets_allowed", "No");
      } else if (filters.petsAllowed === "no") {
        query = query.or("pets_allowed.is.null,pets_allowed.eq.No");
      }

      // Apply furnished filter
      if (filters.furnished === "furnished") {
        query = query.eq("furnished", "Furnished");
      } else if (filters.furnished === "unfurnished") {
        query = query.eq("furnished", "Unfurnished");
      } else if (filters.furnished === "partial") {
        query = query.eq("furnished", "Partially Furnished");
      }

      // Apply search
      if (filters.search) {
        query = query.or(`unparsed_address.ilike.%${filters.search}%,street_name.ilike.%${filters.search}%,subdivision_name.ilike.%${filters.search}%`);
      }

      // Pagination
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { listings: data || [], total: count || 0 };
    },
  });

  const formatCurrency = (amount: number | null) => 
    amount ? `$${amount.toLocaleString()}` : "—";

  const getAvailabilityBadge = (listing: any) => {
    if (!listing.availability_date) {
      return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;
    }
    const availDate = new Date(listing.availability_date);
    const now = new Date();
    if (availDate <= now) {
      return <Badge variant="success">Immediate</Badge>;
    }
    return <Badge variant="secondary">{format(availDate, "MMM d, yyyy")}</Badge>;
  };

  const getPetBadge = (pets: string | null) => {
    if (!pets) return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;
    if (pets.toLowerCase() === "no") {
      return <Badge variant="destructive">No Pets</Badge>;
    }
    return <Badge variant="secondary">{pets}</Badge>;
  };

  const getFurnishedBadge = (furnished: string | null) => {
    if (!furnished) return null;
    if (furnished === "Furnished") {
      return <Badge variant="default">Furnished</Badge>;
    }
    if (furnished === "Partially Furnished") {
      return <Badge variant="secondary">Partial</Badge>;
    }
    return null;
  };

  const clearFilters = () => {
    setFilters({
      city: "all",
      minPrice: "",
      maxPrice: "",
      bedrooms: "all",
      petsAllowed: "all",
      furnished: "all",
      availability: "all",
      search: "",
    });
    setPage(0);
  };

  const hasActiveFilters = 
    filters.city !== "all" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.bedrooms !== "all" ||
    filters.petsAllowed !== "all" ||
    filters.furnished !== "all" ||
    filters.availability !== "all" ||
    filters.search !== "";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Rental Listings Management
              </CardTitle>
              <CardDescription>
                Browse and filter all rental listings in the database
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search address..."
                value={filters.search}
                onChange={(e) => {
                  setFilters(f => ({ ...f, search: e.target.value }));
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>

            <Select 
              value={filters.city} 
              onValueChange={(v) => { setFilters(f => ({ ...f, city: v })); setPage(0); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities?.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.bedrooms} 
              onValueChange={(v) => { setFilters(f => ({ ...f, bedrooms: v })); setPage(0); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                {BEDROOM_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.petsAllowed} 
              onValueChange={(v) => { setFilters(f => ({ ...f, petsAllowed: v })); setPage(0); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pet Policy" />
              </SelectTrigger>
              <SelectContent>
                {PET_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => { setFilters(f => ({ ...f, minPrice: e.target.value })); setPage(0); }}
            />
            <Input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => { setFilters(f => ({ ...f, maxPrice: e.target.value })); setPage(0); }}
            />
            <Select 
              value={filters.furnished} 
              onValueChange={(v) => { setFilters(f => ({ ...f, furnished: v })); setPage(0); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Furnishing" />
              </SelectTrigger>
              <SelectContent>
                {FURNISHED_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {listingsData?.total || 0} listings found
            </div>
          </div>

          {/* Listings Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead className="text-center">Beds/Baths</TableHead>
                      <TableHead className="text-center">Sqft</TableHead>
                      <TableHead>Pets</TableHead>
                      <TableHead>Furnished</TableHead>
                      <TableHead>Map</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingsData?.listings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No rental listings found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      listingsData?.listings.map((listing) => (
                        <TableRow 
                          key={listing.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedListing(listing)}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {listing.unparsed_address || `${listing.street_number || ''} ${listing.street_name || ''} ${listing.unit_number ? `#${listing.unit_number}` : ''}`.trim() || "—"}
                          </TableCell>
                          <TableCell>{listing.city}</TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {formatCurrency(listing.lease_amount)}/mo
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="flex items-center gap-1">
                                <Bed className="h-3 w-3" />
                                {listing.bedrooms_total || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="h-3 w-3" />
                                {listing.bathrooms_total || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {listing.living_area ? `${Math.round(listing.living_area)}` : "—"}
                          </TableCell>
                          <TableCell>{getPetBadge(listing.pets_allowed)}</TableCell>
                          <TableCell>{getFurnishedBadge(listing.furnished)}</TableCell>
                          <TableCell>
                            {listing.latitude && listing.longitude ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                              <a 
                                href={`https://www.realtor.ca/${listing.listing_id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {(listingsData?.total || 0) > pageSize && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, listingsData?.total || 0)} of {listingsData?.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * pageSize >= (listingsData?.total || 0)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Listing Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Rental Listing Details
                </DialogTitle>
                <DialogDescription>
                  MLS# {selectedListing.listing_id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Price & Address */}
                <div className="border-b pb-4">
                  <p className="text-3xl font-bold text-success">
                    {formatCurrency(selectedListing.lease_amount)}/mo
                  </p>
                  <p className="text-lg font-medium mt-1">
                    {selectedListing.unparsed_address || 
                      `${selectedListing.street_number || ''} ${selectedListing.street_name || ''} ${selectedListing.unit_number ? `#${selectedListing.unit_number}` : ''}`.trim()}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedListing.city}, {selectedListing.state_or_province} {selectedListing.postal_code}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Bed className="h-4 w-4" />
                      {selectedListing.bedrooms_total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Bath className="h-4 w-4" />
                      {selectedListing.bathrooms_total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Square className="h-4 w-4" />
                      {selectedListing.living_area ? Math.round(selectedListing.living_area) : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">Sqft</p>
                  </div>
                </div>

                {/* Rental-Specific Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Rental Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Pets:</span>
                      <span className="font-medium">{selectedListing.pets_allowed || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sofa className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Furnished:</span>
                      <span className="font-medium">{selectedListing.furnished || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium">
                        {selectedListing.availability_date 
                          ? format(new Date(selectedListing.availability_date), "MMM d, yyyy")
                          : "Immediate/Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Coordinates:</span>
                      <span className="font-medium">
                        {selectedListing.latitude && selectedListing.longitude ? "Yes" : "Missing"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Utilities */}
                {selectedListing.utilities_included && selectedListing.utilities_included.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Utilities Included</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.utilities_included.map((util: string) => (
                        <Badge key={util} variant="secondary">{util}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedListing.public_remarks && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedListing.public_remarks}
                    </p>
                  </div>
                )}

                {/* Agent Info */}
                {selectedListing.list_agent_name && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold">Listing Agent</h4>
                    <p className="text-sm">{selectedListing.list_agent_name}</p>
                    {selectedListing.list_office_name && (
                      <p className="text-sm text-muted-foreground">{selectedListing.list_office_name}</p>
                    )}
                  </div>
                )}

                {/* External Link */}
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <a 
                      href={`https://www.realtor.ca/${selectedListing.listing_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Realtor.ca
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
