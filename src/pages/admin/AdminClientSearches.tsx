import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  Trash2, 
  Save,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Eye,
  Send,
  Loader2,
  Building2,
  X,
  Search,
  Map,
  List
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CombinedListingsMap } from "@/components/map/CombinedListingsMap";

interface Client {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  alerts_enabled: boolean;
  alert_frequency: string;
}

interface SavedSearch {
  id: string;
  name: string;
  cities: string[] | null;
  neighborhoods: string[] | null;
  property_types: string[] | null;
  listing_types: string[] | null;
  price_min: number | null;
  price_max: number | null;
  beds_min: number | null;
  beds_max: number | null;
  is_active: boolean;
  alert_frequency: string;
  last_alert_at: string | null;
  created_at: string;
}

interface MatchedProperty {
  id: string;
  type: "resale" | "presale";
  name: string;
  address: string;
  city: string;
  neighborhood: string | null;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image: string | null;
  url: string;
  lat: number | null;
  lng: number | null;
}

const CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", "Coquitlam",
  "Delta", "Abbotsford", "New Westminster", "Port Coquitlam", "Port Moody",
  "Maple Ridge", "White Rock", "North Vancouver", "West Vancouver"
];

const PROPERTY_TYPES = [
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
  { value: "detached", label: "Detached" },
  { value: "duplex", label: "Duplex" },
];

const LISTING_TYPES = [
  { value: "resale", label: "Move-In Ready (Resale)" },
  { value: "presale", label: "Presale" },
  { value: "assignment", label: "Assignment" },
];

export default function AdminClientSearches() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSearch, setShowNewSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // View matches state
  const [viewingSearch, setViewingSearch] = useState<SavedSearch | null>(null);
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<MatchedProperty[]>([]);
  const [sending, setSending] = useState(false);
  const [showMapView, setShowMapView] = useState(true);

  // Transform matched properties for map display
  const mapResaleListings = useMemo(() => {
    return matchedProperties
      .filter(p => p.type === "resale" && p.lat && p.lng)
      .map(p => ({
        id: p.id,
        listing_key: p.id,
        listing_price: p.price,
        city: p.city,
        neighborhood: p.neighborhood,
        street_number: p.name.split(" ")[0] || null,
        street_name: p.name.split(" ").slice(1).join(" ") || null,
        property_type: "Residential",
        property_sub_type: null,
        bedrooms_total: p.beds,
        bathrooms_total: p.baths,
        living_area: p.sqft,
        latitude: p.lat,
        longitude: p.lng,
        photos: p.image ? [{ MediaURL: p.image }] : null,
        mls_status: "Active",
      }));
  }, [matchedProperties]);

  const mapPresaleProjects = useMemo(() => {
    return matchedProperties
      .filter(p => p.type === "presale" && p.lat && p.lng)
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.id,
        city: p.city,
        neighborhood: p.neighborhood || "",
        status: "Now Selling",
        project_type: "Condo",
        starting_price: p.price,
        featured_image: p.image,
        map_lat: p.lat,
        map_lng: p.lng,
      }));
  }, [matchedProperties]);

  const handleMapListingSelect = (id: string, type: "resale" | "presale") => {
    const property = matchedProperties.find(p => p.id === id && p.type === type);
    if (property) {
      toggleMatchSelection(property);
    }
  };
  
  // New search form state
  const [newSearch, setNewSearch] = useState({
    name: "",
    cities: [] as string[],
    property_types: [] as string[],
    listing_types: ["resale", "presale"] as string[],
    price_min: "",
    price_max: "",
    beds_min: "",
    beds_max: "",
    alert_frequency: "daily",
  });

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchSearches();
    }
  }, [clientId]);

  const fetchClient = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, email, first_name, last_name, alerts_enabled, alert_frequency")
      .eq("id", clientId)
      .single();

    if (error) {
      toast.error("Failed to load client");
      navigate("/admin/clients");
      return;
    }
    setClient(data);
  };

  const fetchSearches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load searches");
    } else {
      setSearches(data || []);
    }
    setLoading(false);
  };

  const handleToggleAlerts = async (enabled: boolean) => {
    const { error } = await supabase
      .from("clients")
      .update({ alerts_enabled: enabled })
      .eq("id", clientId);

    if (error) {
      toast.error("Failed to update alerts");
    } else {
      setClient(prev => prev ? { ...prev, alerts_enabled: enabled } : null);
      toast.success(enabled ? "Alerts enabled" : "Alerts disabled");
    }
  };

  const handleToggleSearch = async (searchId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("saved_searches")
      .update({ is_active: isActive })
      .eq("id", searchId);

    if (error) {
      toast.error("Failed to update search");
    } else {
      setSearches(prev => 
        prev.map(s => s.id === searchId ? { ...s, is_active: isActive } : s)
      );
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm("Delete this saved search?")) return;
    
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", searchId);

    if (error) {
      toast.error("Failed to delete search");
    } else {
      setSearches(prev => prev.filter(s => s.id !== searchId));
      toast.success("Search deleted");
    }
  };

  const handleCreateSearch = async () => {
    if (!newSearch.name) {
      toast.error("Please enter a search name");
      return;
    }
    if (newSearch.cities.length === 0) {
      toast.error("Please select at least one city");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("saved_searches")
      .insert({
        client_id: clientId,
        name: newSearch.name,
        cities: newSearch.cities,
        property_types: newSearch.property_types.length > 0 ? newSearch.property_types : null,
        listing_types: newSearch.listing_types,
        price_min: newSearch.price_min ? parseInt(newSearch.price_min) : null,
        price_max: newSearch.price_max ? parseInt(newSearch.price_max) : null,
        beds_min: newSearch.beds_min ? parseInt(newSearch.beds_min) : null,
        beds_max: newSearch.beds_max ? parseInt(newSearch.beds_max) : null,
        alert_frequency: newSearch.alert_frequency,
        is_active: true,
      });

    setSaving(false);
    if (error) {
      toast.error("Failed to create search");
    } else {
      toast.success("Search created! Client will receive alerts for matching properties.");
      setShowNewSearch(false);
      setNewSearch({
        name: "",
        cities: [],
        property_types: [],
        listing_types: ["resale", "presale"],
        price_min: "",
        price_max: "",
        beds_min: "",
        beds_max: "",
        alert_frequency: "daily",
      });
      fetchSearches();
    }
  };

  const toggleCity = (city: string) => {
    setNewSearch(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const togglePropertyType = (type: string) => {
    setNewSearch(prev => ({
      ...prev,
      property_types: prev.property_types.includes(type)
        ? prev.property_types.filter(t => t !== type)
        : [...prev.property_types, type]
    }));
  };

  const toggleListingType = (type: string) => {
    setNewSearch(prev => ({
      ...prev,
      listing_types: prev.listing_types.includes(type)
        ? prev.listing_types.filter(t => t !== type)
        : [...prev.listing_types, type]
    }));
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Fetch matching properties for a saved search
  const fetchMatches = async (search: SavedSearch) => {
    setViewingSearch(search);
    setMatchesLoading(true);
    setMatchedProperties([]);
    setSelectedMatches([]);

    try {
      const results: MatchedProperty[] = [];

      // Fetch MLS listings if resale is included
      if (!search.listing_types || search.listing_types.includes("resale")) {
        let query = supabase
          .from("mls_listings")
          .select("listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, property_type, bedrooms_total, bathrooms_total, living_area, photos, latitude, longitude")
          .eq("mls_status", "Active")
          .gte("year_built", 2024);

        if (search.cities?.length) {
          query = query.in("city", search.cities);
        }
        if (search.price_min) {
          query = query.gte("listing_price", search.price_min);
        }
        if (search.price_max) {
          query = query.lte("listing_price", search.price_max);
        }
        if (search.beds_min) {
          query = query.gte("bedrooms_total", search.beds_min);
        }

        const { data: mlsListings } = await query.order("created_at", { ascending: false }).limit(50);

        if (mlsListings) {
          for (const listing of mlsListings) {
            const photos = listing.photos as any[];
            results.push({
              id: listing.listing_key,
              type: "resale",
              name: `${listing.street_number || ""} ${listing.street_name || ""} ${listing.street_suffix || ""}`.trim(),
              address: listing.neighborhood || listing.city,
              city: listing.city,
              neighborhood: listing.neighborhood,
              price: listing.listing_price,
              beds: listing.bedrooms_total,
              baths: listing.bathrooms_total,
              sqft: listing.living_area,
              image: photos?.[0]?.MediaURL || null,
              url: `https://presaleproperties.ca/resale/${listing.listing_key}`,
              lat: listing.latitude,
              lng: listing.longitude,
            });
          }
        }
      }

      // Fetch presale projects if presale is included
      if (!search.listing_types || search.listing_types.includes("presale")) {
        let query = supabase
          .from("presale_projects")
          .select("id, name, slug, city, neighborhood, starting_price, featured_image, map_lat, map_lng")
          .eq("is_published", true);

        if (search.cities?.length) {
          query = query.in("city", search.cities);
        }
        if (search.price_min) {
          query = query.gte("starting_price", search.price_min);
        }
        if (search.price_max) {
          query = query.lte("starting_price", search.price_max);
        }

        const { data: presaleProjects } = await query.order("created_at", { ascending: false }).limit(50);

        if (presaleProjects) {
          for (const project of presaleProjects) {
            results.push({
              id: project.id,
              type: "presale",
              name: project.name,
              address: project.neighborhood,
              city: project.city,
              neighborhood: project.neighborhood,
              price: project.starting_price || 0,
              beds: null,
              baths: null,
              sqft: null,
              image: project.featured_image,
              url: `https://presaleproperties.ca/presale-projects/${project.slug}`,
              lat: project.map_lat,
              lng: project.map_lng,
            });
          }
        }
      }

      setMatchedProperties(results);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matching properties");
    } finally {
      setMatchesLoading(false);
    }
  };

  const toggleMatchSelection = (property: MatchedProperty) => {
    setSelectedMatches(prev => {
      const exists = prev.find(p => p.id === property.id && p.type === property.type);
      if (exists) {
        return prev.filter(p => !(p.id === property.id && p.type === property.type));
      }
      return [...prev, property];
    });
  };

  const isMatchSelected = (property: MatchedProperty) => {
    return selectedMatches.some(p => p.id === property.id && p.type === property.type);
  };

  const selectAllMatches = () => {
    setSelectedMatches([...matchedProperties]);
  };

  const sendSelectedProperties = async () => {
    if (!client || selectedMatches.length === 0) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-property-email", {
        body: {
          clientEmail: client.email,
          clientName: client.first_name || "there",
          properties: selectedMatches,
        },
      });

      if (error) throw error;

      toast.success(`Sent ${selectedMatches.length} properties to ${client.email}`);
      setViewingSearch(null);
      setSelectedMatches([]);
    } catch (error) {
      console.error("Error sending properties:", error);
      toast.error("Failed to send properties");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Property Alerts for {client?.first_name} {client?.last_name}
            </h1>
            <p className="text-muted-foreground">{client?.email}</p>
          </div>
        </div>

        {/* Master Alert Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Property Alerts
                </CardTitle>
                <CardDescription>
                  Send email notifications when new properties match saved searches
                </CardDescription>
              </div>
              <Switch
                checked={client?.alerts_enabled || false}
                onCheckedChange={handleToggleAlerts}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Saved Searches */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Saved Searches</h2>
          <Button onClick={() => setShowNewSearch(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Search
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : searches.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No saved searches yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a saved search to send property alerts to this client
              </p>
              <Button onClick={() => setShowNewSearch(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {searches.map((search) => (
              <Card key={search.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{search.name}</h3>
                        <Badge variant={search.is_active ? "default" : "secondary"}>
                          {search.is_active ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline">{search.alert_frequency}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        {search.cities?.length && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {search.cities.join(", ")}
                          </div>
                        )}
                        {search.property_types?.length && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {search.property_types.join(", ")}
                          </div>
                        )}
                        {(search.price_min || search.price_max) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatPrice(search.price_min) || "$0"} - {formatPrice(search.price_max) || "No max"}
                          </div>
                        )}
                        {search.beds_min && (
                          <span>{search.beds_min}+ beds</span>
                        )}
                      </div>
                      
                      {search.last_alert_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last alert: {format(new Date(search.last_alert_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMatches(search)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Matches
                      </Button>
                      <Switch
                        checked={search.is_active}
                        onCheckedChange={(checked) => handleToggleSearch(search.id, checked)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteSearch(search.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Search Dialog */}
        <Dialog open={showNewSearch} onOpenChange={setShowNewSearch}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Property Alert</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Search Name */}
              <div className="space-y-2">
                <Label>Search Name</Label>
                <Input
                  placeholder="e.g., Vancouver 2BR Condos"
                  value={newSearch.name}
                  onChange={(e) => setNewSearch(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Cities */}
              <div className="space-y-2">
                <Label>Cities *</Label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <Badge
                      key={city}
                      variant={newSearch.cities.includes(city) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Property Types */}
              <div className="space-y-2">
                <Label>Property Types (leave empty for all)</Label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      variant={newSearch.property_types.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePropertyType(type.value)}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Listing Types */}
              <div className="space-y-2">
                <Label>Listing Types</Label>
                <div className="flex flex-wrap gap-2">
                  {LISTING_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      variant={newSearch.listing_types.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleListingType(type.value)}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Price</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={newSearch.price_min}
                    onChange={(e) => setNewSearch(prev => ({ ...prev, price_min: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Price</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000000"
                    value={newSearch.price_max}
                    onChange={(e) => setNewSearch(prev => ({ ...prev, price_max: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Bedrooms</Label>
                  <Select
                    value={newSearch.beds_min || "any"}
                    onValueChange={(value) => setNewSearch(prev => ({ ...prev, beds_min: value === "any" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alert Frequency</Label>
                  <Select
                    value={newSearch.alert_frequency}
                    onValueChange={(value) => setNewSearch(prev => ({ ...prev, alert_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSearch(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSearch} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Creating..." : "Create Alert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Matches Dialog */}
        <Dialog open={!!viewingSearch} onOpenChange={() => setViewingSearch(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Matches for "{viewingSearch?.name}"
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showMapView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMapView(true)}
                  >
                    <Map className="h-4 w-4 mr-1" />
                    Map
                  </Button>
                  <Button
                    variant={!showMapView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMapView(false)}
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search Criteria Summary */}
              {viewingSearch && (
                <div className="px-6 py-3 bg-muted/50 border-b text-sm">
                  <div className="flex flex-wrap gap-3">
                    {viewingSearch.cities?.length && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {viewingSearch.cities.join(", ")}
                      </span>
                    )}
                    {(viewingSearch.price_min || viewingSearch.price_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatPrice(viewingSearch.price_min) || "$0"} - {formatPrice(viewingSearch.price_max) || "No max"}
                      </span>
                    )}
                    {viewingSearch.beds_min && (
                      <span>{viewingSearch.beds_min}+ beds</span>
                    )}
                  </div>
                </div>
              )}

              {/* Selection Header */}
              {matchedProperties.length > 0 && (
                <div className="flex items-center justify-between px-6 py-3 border-b">
                  <span className="text-sm text-muted-foreground">
                    {matchedProperties.length} matching properties • {selectedMatches.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllMatches}
                      disabled={selectedMatches.length === matchedProperties.length}
                    >
                      Select All
                    </Button>
                    {selectedMatches.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMatches([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Split View: Map + List */}
              <div className="flex-1 overflow-hidden">
                {matchesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : matchedProperties.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No matching properties found</p>
                      <p className="text-sm">Try adjusting the search criteria</p>
                    </div>
                  </div>
                ) : showMapView ? (
                  <div className="flex h-full">
                    {/* Map Panel */}
                    <div className="flex-1 relative">
                      {(mapResaleListings.length > 0 || mapPresaleProjects.length > 0) ? (
                        <CombinedListingsMap
                          resaleListings={mapResaleListings}
                          presaleProjects={mapPresaleProjects}
                          mode="all"
                          onListingSelect={handleMapListingSelect}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted/30">
                          <p className="text-muted-foreground text-sm">No properties with map coordinates</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Property List Panel */}
                    <div className="w-80 border-l flex flex-col">
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                          {matchedProperties.map((property) => (
                            <div
                              key={`${property.type}-${property.id}`}
                              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                isMatchSelected(property) ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                              }`}
                              onClick={() => toggleMatchSelection(property)}
                            >
                              <Checkbox checked={isMatchSelected(property)} className="mt-1" />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {property.type === "presale" ? "PRE" : "MIR"}
                                  </Badge>
                                  <span className="font-medium text-xs truncate">{property.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {property.city}
                                </p>
                                <p className="text-xs font-semibold text-primary">
                                  {formatPrice(property.price)}
                                </p>
                              </div>
                              
                              {property.image && (
                                <img
                                  src={property.image}
                                  alt={property.name}
                                  className="w-14 h-10 object-cover rounded shrink-0"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  /* List Only View */
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {matchedProperties.map((property) => (
                        <div
                          key={`${property.type}-${property.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isMatchSelected(property) ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleMatchSelection(property)}
                        >
                          <Checkbox checked={isMatchSelected(property)} />
                          
                          {property.image ? (
                            <img
                              src={property.image}
                              alt={property.name}
                              className="w-20 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                              {property.type === "presale" ? (
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              ) : (
                                <Home className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{property.name}</p>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {property.type === "presale" ? "Presale" : "Move-In Ready"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {property.address}, {property.city}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {formatPrice(property.price)}
                              </span>
                              {property.beds && <span>{property.beds} bed</span>}
                              {property.baths && <span>{property.baths} bath</span>}
                              {property.sqft && <span>{property.sqft} sqft</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Send Button */}
              <div className="flex gap-2 p-4 border-t bg-background">
                <Button variant="outline" className="flex-1" onClick={() => setViewingSearch(null)}>
                  Close
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={sendSelectedProperties}
                  disabled={sending || selectedMatches.length === 0}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {selectedMatches.length} {selectedMatches.length === 1 ? "Property" : "Properties"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
