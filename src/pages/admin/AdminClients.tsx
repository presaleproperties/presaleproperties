import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  MoreHorizontal, 
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
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

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
  created_at: string;
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
    thisMonth: 0
  });
  const [importing, setImporting] = useState(false);

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
      
      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStats({
        total: data?.length || 0,
        active: data?.filter(c => c.status === "active").length || 0,
        withAlerts: data?.filter(c => c.alerts_enabled).length || 0,
        thisMonth: data?.filter(c => new Date(c.created_at) >= monthStart).length || 0
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
      case "property_view": return <Home className="h-4 w-4" />;
      case "page_view": return <Eye className="h-4 w-4" />;
      case "search": return <Search className="h-4 w-4" />;
      case "favorite": return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Client Management
            </h1>
            <p className="text-muted-foreground">
              Track clients, set up alerts, and view activity
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={importLeadsAsClients} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : "Import Leads"}
            </Button>
            <Button variant="outline" onClick={fetchClients}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate("/admin/clients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Alerts</p>
                  <p className="text-2xl font-bold">{stats.withAlerts}</p>
                </div>
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      Loading clients...
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewClient(client)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {client.first_name} {client.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          {client.phone && (
                            <p className="text-xs text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.preferred_cities?.length ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {client.preferred_cities.slice(0, 2).join(", ")}
                              {client.preferred_cities.length > 2 && ` +${client.preferred_cities.length - 2}`}
                            </div>
                          ) : null}
                          {(client.price_min || client.price_max) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice(client.price_min) || "$0"} - {formatPrice(client.price_max) || "No max"}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{client.total_property_views} views</p>
                          <p className="text-muted-foreground">{client.total_site_visits} visits</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.intent_score > 20 ? "default" : client.intent_score > 10 ? "secondary" : "outline"}
                          className={client.intent_score > 20 ? "bg-green-500" : ""}
                        >
                          {client.intent_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.last_seen_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(client.last_seen_at), { addSuffix: true })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={client.status === "active" ? "default" : "secondary"}>
                            {client.status}
                          </Badge>
                          {client.alerts_enabled && (
                            <Badge variant="outline" className="gap-1">
                              <Bell className="h-3 w-3" />
                              Alerts
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClient(client)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/searches`)}>
                              <Bell className="h-4 w-4 mr-2" />
                              Manage Alerts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/edit`)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Client Detail Modal */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedClient?.first_name} {selectedClient?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedClient && (
              <div className="space-y-6">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact</h4>
                    <p className="text-sm">{selectedClient.email}</p>
                    {selectedClient.phone && <p className="text-sm">{selectedClient.phone}</p>}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Preferences</h4>
                    {selectedClient.preferred_cities?.length ? (
                      <p className="text-sm">Cities: {selectedClient.preferred_cities.join(", ")}</p>
                    ) : null}
                    {(selectedClient.price_min || selectedClient.price_max) && (
                      <p className="text-sm">
                        Budget: {formatPrice(selectedClient.price_min)} - {formatPrice(selectedClient.price_max)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/admin/clients/${selectedClient.id}/searches`)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Set Up Alerts
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>

                {/* Activity Feed */}
                <div>
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  {activityLoading ? (
                    <p className="text-sm text-muted-foreground">Loading activity...</p>
                  ) : clientActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {clientActivity.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize">
                              {activity.activity_type.replace("_", " ")}
                            </p>
                            {activity.project_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {activity.project_name}
                              </p>
                            )}
                            {activity.city && (
                              <p className="text-xs text-muted-foreground">
                                {activity.city} {activity.price && `• ${formatPrice(activity.price)}`}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
