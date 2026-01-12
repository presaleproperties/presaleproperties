import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Play,
  Settings2,
  MapPin,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  listings_fetched: number | null;
  listings_created: number | null;
  listings_updated: number | null;
  listings_deleted: number | null;
  error_message: string | null;
}

export default function AdminMLSSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedUrl, setFeedUrl] = useState("");
  const [enabledCities, setEnabledCities] = useState<string[]>([]);
  const [syncPropertyTypes, setSyncPropertyTypes] = useState<string[]>([
    "Apartment/Condo",
    "Townhouse",
    "Row/Townhouse",
    "Duplex"
  ]);

  // Available property types from DDF (for attached/multi-family properties)
  const availablePropertyTypes = [
    { value: "Apartment/Condo", label: "Condos/Apartments", description: "High-rise & low-rise condos" },
    { value: "Townhouse", label: "Townhouses", description: "Attached townhomes" },
    { value: "Row/Townhouse", label: "Row Houses", description: "Row-style townhouses" },
    { value: "Duplex", label: "Duplexes", description: "Side-by-side or up/down" },
    { value: "Single Family", label: "Single Family", description: "Detached homes" },
    { value: "Multi-family", label: "Multi-family", description: "Multi-unit buildings" },
  ];

  // Default Metro Vancouver & Fraser Valley cities
  const defaultEnabledCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", 
    "Coquitlam", "Delta", "Abbotsford", "New Westminster", 
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission"
  ];

  // Fetch city counts from MLS listings
  const { data: cityCounts, isLoading: cityCountsLoading } = useQuery({
    queryKey: ["mls-city-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("city")
        .eq("standard_status", "Active");
      
      if (error) throw error;
      
      // Count by city
      const counts: Record<string, number> = {};
      data?.forEach(listing => {
        const city = listing.city || "Unknown";
        counts[city] = (counts[city] || 0) + 1;
      });
      
      // Sort by count descending
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([city, count]) => ({ city, count }));
    },
  });

  // Fetch enabled cities from app_settings
  const { data: savedEnabledCities } = useQuery({
    queryKey: ["mls-enabled-cities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "mls_enabled_cities")
        .maybeSingle();
      
      return data?.value as string[] | null;
    },
  });

  // Initialize enabled cities from saved settings or defaults
  useEffect(() => {
    if (savedEnabledCities) {
      setEnabledCities(savedEnabledCities);
    } else if (cityCounts && enabledCities.length === 0) {
      // Use defaults if nothing is saved
      setEnabledCities(defaultEnabledCities);
    }
  }, [savedEnabledCities, cityCounts]);

  // Fetch sync logs
  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["mls-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Fetch MLS listing count
  const { data: listingStats } = useQuery({
    queryKey: ["mls-listing-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true });
      
      const { count: active } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("standard_status", "Active");

      const { data: lastSync } = await supabase
        .from("mls_listings")
        .select("last_synced_at")
        .order("last_synced_at", { ascending: false })
        .limit(1)
        .single();

      return {
        total: total || 0,
        active: active || 0,
        lastSyncedAt: lastSync?.last_synced_at,
      };
    },
  });

  // Fetch saved feed URL from app_settings
  const { data: savedFeedUrl } = useQuery({
    queryKey: ["ddf-feed-url"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ddf_feed_url")
        .maybeSingle();
      
      return data?.value as string | null;
    },
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async (options?: { feedUrl?: string; propertyTypes?: string[] }) => {
      const { data, error } = await supabase.functions.invoke("sync-mls-data", {
        body: { 
          feedUrl: options?.feedUrl,
          propertyTypes: options?.propertyTypes || syncPropertyTypes,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sync completed",
        description: `Fetched ${data.fetched} listings. Created: ${data.created}, Updated: ${data.updated}`,
      });
      queryClient.invalidateQueries({ queryKey: ["mls-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mls-listing-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["mls-sync-logs"] });
    },
  });

  // Save feed URL mutation
  const saveFeedUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "ddf_feed_url", value: url }, { onConflict: "key" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Feed URL saved" });
      queryClient.invalidateQueries({ queryKey: ["ddf-feed-url"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save enabled cities mutation
  const saveEnabledCitiesMutation = useMutation({
    mutationFn: async (cities: string[]) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "mls_enabled_cities", value: cities }, { onConflict: "key" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "City visibility settings saved" });
      queryClient.invalidateQueries({ queryKey: ["mls-enabled-cities"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCity = (city: string) => {
    setEnabledCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const enableAllCities = () => {
    if (cityCounts) {
      setEnabledCities(cityCounts.map(c => c.city));
    }
  };

  const disableAllCities = () => {
    setEnabledCities([]);
  };

  const enableMetroVancouver = () => {
    setEnabledCities(defaultEnabledCities);
  };

  const visibleListingsCount = cityCounts
    ?.filter(c => enabledCities.includes(c.city))
    .reduce((sum, c) => sum + c.count, 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "completed_with_errors":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />With Errors</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MLS Data Sync</h1>
          <p className="text-muted-foreground">
            Manage CREA Realtor Link DDF feed integration
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listingStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {listingStats?.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listingStats?.lastSyncedAt 
                  ? format(new Date(listingStats.lastSyncedAt), "MMM d")
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">
                {listingStats?.lastSyncedAt 
                  ? format(new Date(listingStats.lastSyncedAt), "h:mm a")
                  : "No data synced yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feed Status</CardTitle>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {savedFeedUrl ? "Configured" : "Not Set"}
              </div>
              <p className="text-xs text-muted-foreground">
                DDF Feed URL
              </p>
            </CardContent>
          </Card>
        </div>

        {/* City Visibility Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  City Visibility Control
                </CardTitle>
                <CardDescription>
                  Control which cities' listings appear on the website. Currently showing {visibleListingsCount.toLocaleString()} of {listingStats?.active?.toLocaleString() || 0} active listings.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {enabledCities.length} cities enabled
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              <Button variant="outline" size="sm" onClick={enableMetroVancouver}>
                Metro Vancouver Only
              </Button>
              <Button variant="outline" size="sm" onClick={enableAllCities}>
                <Eye className="h-4 w-4 mr-1" />
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={disableAllCities}>
                <EyeOff className="h-4 w-4 mr-1" />
                Disable All
              </Button>
              <Button 
                onClick={() => saveEnabledCitiesMutation.mutate(enabledCities)}
                disabled={saveEnabledCitiesMutation.isPending}
                size="sm"
              >
                {saveEnabledCitiesMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>

            {/* City Grid */}
            {cityCountsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                {cityCounts?.map(({ city, count }) => {
                  const isEnabled = enabledCities.includes(city);
                  return (
                    <div
                      key={city}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isEnabled 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-muted/30 border-muted"
                      }`}
                      onClick={() => toggleCity(city)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleCity(city)}
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isEnabled ? "" : "text-muted-foreground"}`}>
                            {city}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {count.toLocaleString()} listings
                          </p>
                        </div>
                      </div>
                      {isEnabled ? (
                        <Eye className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Type Filter for Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Property Type Filter
            </CardTitle>
            <CardDescription>
              Select which property types to sync from the MLS feed. For a condo/townhome site, exclude Single Family homes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                The DDF feed contains mostly Single Family homes (~22k). For condos and townhomes, 
                you need to filter by property type when syncing. Current DB has only {" "}
                <strong>5 condo/townhouse listings</strong> out of ~28k total.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availablePropertyTypes.map((type) => {
                const isSelected = syncPropertyTypes.includes(type.value);
                return (
                  <div
                    key={type.value}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-muted/30 border-muted"
                    }`}
                    onClick={() => {
                      setSyncPropertyTypes(prev => 
                        prev.includes(type.value) 
                          ? prev.filter(t => t !== type.value)
                          : [...prev, type.value]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => {
                          setSyncPropertyTypes(prev => 
                            prev.includes(type.value) 
                              ? prev.filter(t => t !== type.value)
                              : [...prev, type.value]
                          );
                        }}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? "" : "text-muted-foreground"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSyncPropertyTypes(["Apartment/Condo", "Townhouse", "Row/Townhouse", "Duplex"])}
              >
                Condos & Townhomes Only
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSyncPropertyTypes(availablePropertyTypes.map(t => t.value))}
              >
                All Types
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Configuration</CardTitle>
            <CardDescription>
              Configure your CREA Realtor Link DDF feed URL. You'll need to get this from your real estate board.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                To sync MLS data, you need:
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>DDF_USERNAME and DDF_PASSWORD secrets (already configured ✓)</li>
                  <li>Your board-specific DDF feed URL from CREA Realtor Link</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="feedUrl">DDF Feed URL</Label>
              <div className="flex gap-2">
                <Input
                  id="feedUrl"
                  placeholder="https://data.crea.ca/Feed/Property?$filter=..."
                  value={feedUrl || savedFeedUrl || ""}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  onClick={() => saveFeedUrlMutation.mutate(feedUrl || savedFeedUrl || "")}
                  disabled={saveFeedUrlMutation.isPending}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: https://data.crea.ca/Feed/Property?$filter=contains(City,'Vancouver')
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => syncMutation.mutate({ 
                  feedUrl: feedUrl || savedFeedUrl || undefined,
                  propertyTypes: syncPropertyTypes 
                })}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Sync Now
              </Button>

              <Button variant="outline" asChild>
                <a 
                  href="https://www.crea.ca/data-solutions/ddf/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  CREA DDF Docs
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>
              Recent MLS data synchronization logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : syncLogs && syncLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fetched</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.started_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">{log.listings_fetched ?? "-"}</TableCell>
                      <TableCell className="text-right">{log.listings_created ?? "-"}</TableCell>
                      <TableCell className="text-right">{log.listings_updated ?? "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sync history yet</p>
                <p className="text-sm">Run your first sync to populate MLS data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
