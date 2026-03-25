import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { generateProjectUrl } from "@/lib/seoUrls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Bell, 
  Mail, 
  Activity,
  RefreshCw,
  TrendingUp,
  Clock,
  MapPin,
  Home,
  DollarSign,
  Upload,
  ExternalLink,
  Loader2,
  Send,
  Building2,
  ChevronRight,
  MousePointerClick,
  Heart,
  FileText,
  Phone,
  Calendar,
  Target,
  Sparkles,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Client {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  persona: string | null;
  status: string;
  preferred_cities: string[] | null;
  price_min: number | null;
  price_max: number | null;
  alerts_enabled: boolean;
  last_seen_at: string | null;
  total_property_views: number;
  total_site_visits: number;
  intent_score: number;
  tags: string[] | null;
  created_at: string;
}

interface ClientActivity {
  id: string;
  activity_type: string;
  project_name: string | null;
  listing_key: string | null;
  city: string | null;
  price: number | null;
  page_url: string | null;
  page_title: string | null;
  created_at: string;
  utm_source: string | null;
}

interface SearchProperty {
  id: string;
  type: "resale" | "presale";
  name: string;
  address: string;
  city: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image: string | null;
  url: string;
}

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientActivity, setClientActivity] = useState<ClientActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withAlerts: 0,
    highIntent: 0
  });
  const [importing, setImporting] = useState(false);
  const [loftySearchOpen, setLoftySearchOpen] = useState(false);
  
  // Property search and send state
  const [propertySearchOpen, setPropertySearchOpen] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProperty[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<SearchProperty[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendToClient, setSendToClient] = useState<Client | null>(null);

  const importLeadsAsClients = async () => {
    if (!confirm("Import all existing leads as clients? This will skip duplicates.")) return;
    setImporting(true);
    try {
      const { data: leads } = await supabase
        .from("project_leads")
        .select("name, email, phone, persona, visitor_id, intent_score, city_interest");
      
      if (!leads?.length) {
        toast.info("No leads to import");
        return;
      }

      let imported = 0;
      for (const lead of leads) {
        const [firstName, ...lastParts] = (lead.name || "").split(" ");
        const { error } = await supabase.from("clients").upsert({
          email: lead.email,
          first_name: firstName || null,
          last_name: lastParts.join(" ") || null,
          phone: lead.phone,
          persona: lead.persona || "buyer",
          visitor_id: lead.visitor_id,
          intent_score: lead.intent_score || 0,
          source: "import",
        }, { onConflict: "email" });
        
        if (!error) imported++;
      }
      
      toast.success(`Imported ${imported} clients`);
      fetchClients();
    } catch (error) {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      setClients(data || []);
      
      setStats({
        total: data?.length || 0,
        active: data?.filter(c => c.status === "active").length || 0,
        withAlerts: data?.filter(c => c.alerts_enabled).length || 0,
        highIntent: data?.filter(c => c.intent_score >= 20).length || 0
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientActivity = async (clientId: string) => {
    setActivityLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_activity")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setClientActivity(data || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    fetchClientActivity(client.id);
  };

  // Search properties (both MLS and presale)
  const searchProperties = async () => {
    if (!propertySearchQuery.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const query = propertySearchQuery.toLowerCase();
      const results: SearchProperty[] = [];
      
      // Search MLS listings
      const { data: mlsListings } = await supabase
        .from("mls_listings")
        .select("listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, property_type, bedrooms_total, bathrooms_total, living_area, photos")
        .eq("mls_status", "Active")
        .gte("year_built", 2024)
        .or(`city.ilike.%${query}%,street_name.ilike.%${query}%,neighborhood.ilike.%${query}%,listing_key.ilike.%${query}%`)
        .limit(12);
      
      if (mlsListings) {
        for (const listing of mlsListings) {
          const photos = listing.photos as any[];
          results.push({
            id: listing.listing_key,
            type: "resale",
            name: `${listing.street_number || ""} ${listing.street_name || ""} ${listing.street_suffix || ""}`.trim(),
            address: `${listing.neighborhood || listing.city}`,
            city: listing.city,
            price: listing.listing_price,
            beds: listing.bedrooms_total,
            baths: listing.bathrooms_total,
            sqft: listing.living_area,
            image: photos?.[0]?.MediaURL || null,
            url: `https://presaleproperties.com/resale/${listing.listing_key}`,
          });
        }
      }
      
      // Search presale projects
      const { data: presaleProjects } = await supabase
          .from("presale_projects")
          .select("id, name, slug, city, neighborhood, project_type, starting_price, featured_image")
        .eq("is_published", true)
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,neighborhood.ilike.%${query}%`)
        .limit(12);
      
      if (presaleProjects) {
        for (const project of presaleProjects) {
          results.push({
            id: project.id,
            type: "presale",
            name: project.name,
            address: project.neighborhood,
            city: project.city,
            price: project.starting_price || 0,
            beds: null,
            baths: null,
            sqft: null,
            image: project.featured_image,
            url: `https://presaleproperties.com${generateProjectUrl({ slug: project.slug, neighborhood: project.neighborhood || project.city, projectType: (project.project_type || "condo") as any })}`,
          });
        }
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching properties:", error);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const togglePropertySelection = (property: SearchProperty) => {
    setSelectedProperties(prev => {
      const exists = prev.find(p => p.id === property.id && p.type === property.type);
      if (exists) {
        return prev.filter(p => !(p.id === property.id && p.type === property.type));
      }
      return [...prev, property];
    });
  };

  const isPropertySelected = (property: SearchProperty) => {
    return selectedProperties.some(p => p.id === property.id && p.type === property.type);
  };

  const sendPropertiesToClient = async () => {
    if (!sendToClient || selectedProperties.length === 0) return;
    
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-property-email", {
        body: {
          clientEmail: sendToClient.email,
          clientName: sendToClient.first_name || "there",
          clientId: sendToClient.id,
          properties: selectedProperties,
        },
      });
      
      if (error) throw error;
      
      toast.success(`Sent ${selectedProperties.length} properties to ${sendToClient.email}`);
      setPropertySearchOpen(false);
      setSelectedProperties([]);
      setSearchResults([]);
      setPropertySearchQuery("");
      setSendToClient(null);
    } catch (error) {
      console.error("Error sending properties:", error);
      toast.error("Failed to send properties");
    } finally {
      setSending(false);
    }
  };

  const openPropertySearch = (client: Client) => {
    setSendToClient(client);
    setPropertySearchOpen(true);
    setSelectedProperties([]);
    setSearchResults([]);
    setPropertySearchQuery("");
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.email.toLowerCase().includes(query) ||
      client.first_name?.toLowerCase().includes(query) ||
      client.last_name?.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    );
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "property_view": return <Home className="h-4 w-4 text-blue-500" />;
      case "page_view": return <Eye className="h-4 w-4 text-gray-500" />;
      case "search": return <Search className="h-4 w-4 text-purple-500" />;
      case "favorite": return <Heart className="h-4 w-4 text-red-500" />;
      case "email_click": return <MousePointerClick className="h-4 w-4 text-green-500" />;
      case "form_submit": return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "property_view": return "Viewed property";
      case "page_view": return "Visited page";
      case "search": return "Searched";
      case "favorite": return "Saved property";
      case "email_click": return "Clicked email link";
      case "form_submit": return "Submitted form";
      default: return type.replace(/_/g, " ");
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getIntentColor = (score: number) => {
    if (score >= 30) return "bg-green-500 text-white";
    if (score >= 20) return "bg-emerald-500 text-white";
    if (score >= 10) return "bg-amber-500 text-white";
    return "bg-gray-200 text-gray-700";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Client Management
            </h1>
            <p className="text-muted-foreground text-sm">
              Track clients, set up searches, send properties, and view activity
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setLoftySearchOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Lofty CRM
            </Button>
            <Button variant="outline" size="sm" onClick={importLeadsAsClients} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : "Import Leads"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchClients}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/clients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Clients</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-background to-emerald-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-background to-amber-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">With Alerts</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.withAlerts}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-background to-purple-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">High Intent</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.highIntent}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No clients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Get started by adding your first client"}
              </p>
              <Button onClick={() => navigate("/admin/clients/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <Card 
                key={client.id} 
                className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20"
                onClick={() => handleViewClient(client)}
              >
                <CardContent className="p-4">
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {client.first_name || client.last_name 
                            ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                            : "Unnamed Client"}
                        </h3>
                        <Badge className={`shrink-0 text-xs ${getIntentColor(client.intent_score)}`}>
                          {client.intent_score}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      {client.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewClient(client); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPropertySearch(client); }}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Properties
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.id}/searches`); }}>
                          <Bell className="h-4 w-4 mr-2" />
                          Setup Alerts
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.id}/edit`); }}>
                          Edit Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Client Criteria */}
                  <div className="space-y-2 mb-3">
                    {client.preferred_cities?.length ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{client.preferred_cities.slice(0, 3).join(", ")}</span>
                        {client.preferred_cities.length > 3 && (
                          <Badge variant="secondary" className="text-xs shrink-0">+{client.preferred_cities.length - 3}</Badge>
                        )}
                      </div>
                    ) : null}
                    {(client.price_min || client.price_max) && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatPrice(client.price_min) || "$0"} – {formatPrice(client.price_max) || "No max"}</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Stats */}
                  <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">{client.total_property_views}</span>
                      <span className="text-muted-foreground text-xs">views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium">{client.total_site_visits}</span>
                      <span className="text-muted-foreground text-xs">visits</span>
                    </div>
                    {client.last_seen_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(client.last_seen_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                      {client.status}
                    </Badge>
                    {client.alerts_enabled && (
                      <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600">
                        <Bell className="h-3 w-3" />
                        Alerts On
                      </Badge>
                    )}
                    {client.persona && (
                      <Badge variant="outline" className="text-xs">
                        {client.persona}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-8"
                      onClick={(e) => { e.stopPropagation(); openPropertySearch(client); }}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Send
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.id}/searches`); }}
                    >
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      Alerts
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={(e) => { e.stopPropagation(); handleViewClient(client); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Client Detail Drawer */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">
                    {selectedClient?.first_name || selectedClient?.last_name 
                      ? `${selectedClient?.first_name || ""} ${selectedClient?.last_name || ""}`.trim()
                      : "Client Details"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedClient?.email}</p>
                </div>
                {selectedClient && (
                  <Badge className={`${getIntentColor(selectedClient.intent_score)} text-sm px-3`}>
                    Intent: {selectedClient.intent_score}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            {selectedClient && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-6 mt-4 w-fit">
                    <TabsTrigger value="activity" className="gap-2">
                      <Activity className="h-4 w-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="details" className="gap-2">
                      <Users className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="activity" className="flex-1 overflow-hidden px-6 pb-6 mt-4">
                    {activityLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : clientActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h4 className="font-medium mb-1">No activity recorded</h4>
                        <p className="text-sm text-muted-foreground">
                          Activity will appear here when the client visits the website
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-2">
                          {clientActivity.map((activity) => (
                            <div 
                              key={activity.id} 
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                            >
                              <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                                {getActivityIcon(activity.activity_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {getActivityLabel(activity.activity_type)}
                                  </p>
                                  {activity.utm_source && (
                                    <Badge variant="outline" className="text-xs">
                                      via {activity.utm_source}
                                    </Badge>
                                  )}
                                </div>
                                {activity.project_name && (
                                  <p className="text-sm text-primary font-medium truncate">
                                    {activity.project_name}
                                  </p>
                                )}
                                {activity.page_title && !activity.project_name && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {activity.page_title}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  {activity.city && <span>{activity.city}</span>}
                                  {activity.price && <span>• {formatPrice(activity.price)}</span>}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="flex-1 overflow-auto px-6 pb-6 mt-4">
                    <div className="space-y-6">
                      {/* Contact Info */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Contact</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedClient.email}</span>
                          </div>
                          {selectedClient.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedClient.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preferences */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Preferences</h4>
                        <div className="space-y-2">
                          {selectedClient.preferred_cities?.length ? (
                            <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {selectedClient.preferred_cities.map(city => (
                                  <Badge key={city} variant="secondary">{city}</Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {(selectedClient.price_min || selectedClient.price_max) && (
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>{formatPrice(selectedClient.price_min) || "$0"} – {formatPrice(selectedClient.price_max) || "No max"}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Engagement</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">{selectedClient.total_property_views}</p>
                            <p className="text-xs text-muted-foreground">Property Views</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">{selectedClient.total_site_visits}</p>
                            <p className="text-xs text-muted-foreground">Site Visits</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">{selectedClient.intent_score}</p>
                            <p className="text-xs text-muted-foreground">Intent Score</p>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Timeline</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Added</span>
                            <span>{format(new Date(selectedClient.created_at), "MMM d, yyyy")}</span>
                          </div>
                          {selectedClient.last_seen_at && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Last seen</span>
                              <span>{format(new Date(selectedClient.last_seen_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Actions Footer */}
                <div className="flex gap-2 p-4 border-t bg-muted/30">
                  <Button className="flex-1" onClick={() => openPropertySearch(selectedClient)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Properties
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/clients/${selectedClient.id}/searches`)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Setup Alerts
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lofty Info Modal */}
        <Dialog open={loftySearchOpen} onOpenChange={setLoftySearchOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Lofty CRM Integration
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm">
                  <strong>How it works:</strong> Leads from this site automatically sync <strong>TO</strong> Lofty via Zapier webhooks.
                </p>
                <p className="text-sm text-muted-foreground">
                  Lofty doesn't provide a public API for searching contacts. To bring contacts into this system:
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Export contacts from Lofty (Contacts → Export CSV)</li>
                  <li>Use the <strong>Import Leads</strong> button to import existing leads</li>
                  <li>Or add clients manually with the <strong>Add Client</strong> button</li>
                </ol>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open("https://app.lofty.com", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Lofty
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setLoftySearchOpen(false);
                    navigate("/admin/clients/new");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Property Search & Send Modal */}
        <Dialog open={propertySearchOpen} onOpenChange={setPropertySearchOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Send Properties to {sendToClient?.first_name || sendToClient?.email}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search Input */}
              <div className="px-6 py-4 border-b bg-muted/30">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by city, address, MLS#, or project name..."
                      value={propertySearchQuery}
                      onChange={(e) => setPropertySearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchProperties()}
                      className="pl-10 h-11"
                    />
                  </div>
                  <Button onClick={searchProperties} disabled={searching || !propertySearchQuery.trim()} className="h-11 px-6">
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>

              {/* Selected Properties Preview */}
              {selectedProperties.length > 0 && (
                <div className="px-6 py-3 border-b bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {selectedProperties.length} properties selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProperties([])}>
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperties.slice(0, 5).map((prop) => (
                      <Badge key={`${prop.type}-${prop.id}`} variant="secondary" className="gap-1.5 pr-1">
                        {prop.type === "presale" ? <Building2 className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                        <span className="truncate max-w-[120px]">{prop.name}</span>
                        <button 
                          onClick={() => togglePropertySelection(prop)} 
                          className="ml-1 p-0.5 rounded-full hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedProperties.length > 5 && (
                      <Badge variant="outline">+{selectedProperties.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Search Results Grid */}
              <ScrollArea className="flex-1 px-6 py-4">
                {searching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-1">{propertySearchQuery ? "No properties found" : "Search for properties"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {propertySearchQuery 
                        ? "Try a different search term" 
                        : "Enter a city, address, or MLS number to find properties"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.map((property) => {
                      const isSelected = isPropertySelected(property);
                      return (
                        <div
                          key={`${property.type}-${property.id}`}
                          className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                            isSelected 
                              ? "border-primary ring-2 ring-primary/20 shadow-lg" 
                              : "border-transparent bg-card hover:shadow-md"
                          }`}
                          onClick={() => togglePropertySelection(property)}
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3]">
                            {property.image ? (
                              <img
                                src={property.image}
                                alt={property.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                {property.type === "presale" ? (
                                  <Building2 className="h-10 w-10 text-muted-foreground" />
                                ) : (
                                  <Home className="h-10 w-10 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            
                            {/* Selection Checkbox */}
                            <div className={`absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? "bg-primary border-primary text-primary-foreground" 
                                : "bg-background/90 border-muted-foreground/30"
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            
                            {/* Type Badge */}
                            <Badge 
                              className={`absolute top-2 right-2 text-[10px] ${
                                property.type === "presale" 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-emerald-500 text-white"
                              }`}
                            >
                              {property.type === "presale" ? "PRESALE" : "MOVE-IN"}
                            </Badge>
                          </div>
                          
                          {/* Property Info */}
                          <div className="p-3">
                            <p className="font-semibold text-sm truncate">{property.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {property.address}, {property.city}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-primary">
                                {formatPrice(property.price)}
                              </span>
                              {(property.beds || property.baths) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  {property.beds && <span>{property.beds} bd</span>}
                                  {property.baths && <span>{property.baths} ba</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Send Button */}
              <div className="flex gap-3 p-4 border-t bg-background">
                <Button variant="outline" className="flex-1" onClick={() => setPropertySearchOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={sendPropertiesToClient}
                  disabled={sending || selectedProperties.length === 0}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {selectedProperties.length} {selectedProperties.length === 1 ? "Property" : "Properties"}
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
