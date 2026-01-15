import { useState, useEffect } from "react";
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
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
      </div>
    </AdminLayout>
  );
}
