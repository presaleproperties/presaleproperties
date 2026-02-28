import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  EyeOff,
  Trash2,
  Users,
  Calendar
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface GeocodingLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  listings_processed: number | null;
  listings_updated: number | null;
  listings_errors: number | null;
  remaining_count: number | null;
  api_calls_made: number | null;
  batch_size: number | null;
  city_filter: string | null;
  error_message: string | null;
  trigger_source: string | null;
}

// Year options for the filter
const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function AdminMLSSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabledCities, setEnabledCities] = useState<string[]>([]);
  const [minYearBuilt, setMinYearBuilt] = useState<number>(2024);

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

  // Fetch min year built setting
  const { data: savedMinYearBuilt } = useQuery({
    queryKey: ["resale-min-year-built"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "resale_min_year_built")
        .maybeSingle();
      
      return data?.value as number | null;
    },
  });

  // Initialize min year built from saved setting
  useEffect(() => {
    if (savedMinYearBuilt !== undefined && savedMinYearBuilt !== null) {
      setMinYearBuilt(savedMinYearBuilt);
    }
  }, [savedMinYearBuilt]);

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

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async (options?: { metroVancouverResidential?: boolean; offset?: number }) => {
      const { data, error } = await supabase.functions.invoke("sync-mls-data", {
        body: { 
          metroVancouverResidential: options?.metroVancouverResidential || false,
          offset: options?.offset || 0,
          maxBatches: 30,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const message = data.isComplete 
        ? `Sync complete! Fetched ${data.totalFetched} listings.`
        : `Batch complete: ${data.totalFetched} of ${data.totalCount}. Run again to continue.`;
      
      toast({
        title: data.isComplete ? "Sync completed" : "Batch synced",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ["mls-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mls-listing-stats"] });
      queryClient.invalidateQueries({ queryKey: ["mls-city-counts"] });
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

  // Save min year built mutation
  const saveMinYearBuiltMutation = useMutation({
    mutationFn: async (year: number) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "resale_min_year_built", value: year }, { onConflict: "key" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Year built filter saved", description: `Showing homes built ${minYearBuilt} and newer` });
      queryClient.invalidateQueries({ queryKey: ["resale-min-year-built"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear all listings mutation
  const clearListingsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("mls_listings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: "All listings cleared", 
        description: "The MLS listings database has been reset.",
      });
      queryClient.invalidateQueries({ queryKey: ["mls-listing-stats"] });
      queryClient.invalidateQueries({ queryKey: ["mls-city-counts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear listings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Agent sync mutation
  const agentSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-mls-agents", {
        body: {},
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Agent sync completed",
        description: `Synced ${data.agentsProcessed || 0} agents and ${data.officesProcessed || 0} offices`,
      });
      queryClient.invalidateQueries({ queryKey: ["mls-agent-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Agent sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Geocode missing listings mutation
  const geocodeMutation = useMutation({
    mutationFn: async (options?: { city?: string; batchSize?: number }) => {
      const { data, error } = await supabase.functions.invoke("geocode-listings", {
        body: { 
          city: options?.city,
          batchSize: options?.batchSize || 50,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Geocoding batch completed",
        description: `Updated ${data.updated || 0} listings, ${data.remaining || 0} remaining`,
      });
      queryClient.invalidateQueries({ queryKey: ["geocoding-stats"] });
      queryClient.invalidateQueries({ queryKey: ["geocoding-api-stats"] });
      queryClient.invalidateQueries({ queryKey: ["geocoding-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Geocoding failed",
        description: error.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["geocoding-logs"] });
    },
  });

  // Geocoding stats query
  const { data: geocodeStats } = useQuery({
    queryKey: ["geocoding-stats"],
    queryFn: async () => {
      const { count: missingCoords } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .or("latitude.is.null,longitude.is.null");

      const { count: withCoords } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      return {
        missingCoords: missingCoords || 0,
        withCoords: withCoords || 0,
      };
    },
  });

  // Geocoding API usage stats
  const { data: geocodingApiStats } = useQuery({
    queryKey: ["geocoding-api-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: todayLogs } = await supabase
        .from("geocoding_logs")
        .select("api_calls_made, listings_updated")
        .gte("started_at", today);

      const { data: allLogs } = await supabase
        .from("geocoding_logs")
        .select("api_calls_made, listings_updated");

      const todayApiCalls = todayLogs?.reduce((sum, log) => sum + (log.api_calls_made || 0), 0) || 0;
      const totalApiCalls = allLogs?.reduce((sum, log) => sum + (log.api_calls_made || 0), 0) || 0;
      const totalUpdated = allLogs?.reduce((sum, log) => sum + (log.listings_updated || 0), 0) || 0;

      return {
        todayApiCalls,
        totalApiCalls,
        totalUpdated,
      };
    },
  });

  // Geocoding logs
  const { data: geocodingLogs } = useQuery({
    queryKey: ["geocoding-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geocoding_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as GeocodingLog[];
    },
  });

  // Agent stats
  const { data: agentStats } = useQuery({
    queryKey: ["mls-agent-stats"],
    queryFn: async () => {
      const { count: agents } = await supabase
        .from("mls_agents")
        .select("*", { count: "exact", head: true });

      const { count: offices } = await supabase
        .from("mls_offices")
        .select("*", { count: "exact", head: true });

      const { count: listingsWithAgent } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .not("list_agent_name", "is", null);

      const { count: listingsWithOffice } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("mls_status", "Active")
        .not("list_office_name", "is", null);

      // Get unique agent/office keys in listings vs cached
      const { data: uniqueAgentKeys } = await supabase
        .from("mls_listings")
        .select("list_agent_key")
        .eq("mls_status", "Active")
        .not("list_agent_key", "is", null);
      
      const { data: uniqueOfficeKeys } = await supabase
        .from("mls_listings")
        .select("list_office_key")
        .eq("mls_status", "Active")
        .not("list_office_key", "is", null);

      const uniqueAgents = new Set((uniqueAgentKeys || []).map(l => l.list_agent_key)).size;
      const uniqueOffices = new Set((uniqueOfficeKeys || []).map(l => l.list_office_key)).size;

      return {
        agents: agents || 0,
        offices: offices || 0,
        listingsWithAgent: listingsWithAgent || 0,
        listingsWithOffice: listingsWithOffice || 0,
        uniqueAgentsNeeded: uniqueAgents,
        uniqueOfficesNeeded: uniqueOffices,
      };
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
              <CardTitle className="text-sm font-medium">Last Synced</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listingStats?.lastSyncedAt 
                  ? format(new Date(listingStats.lastSyncedAt), "h:mm a")
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">
                {listingStats?.lastSyncedAt 
                  ? format(new Date(listingStats.lastSyncedAt), "MMM d, yyyy")
                  : "Run sync to populate"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible on Site</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleListingsCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {enabledCities.length} cities enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Year Built Filter - NEW SECTION */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Year Built Filter
                </CardTitle>
                <CardDescription>
                  Control which years of homes appear on the resale/move-in ready section. Set to 2024+ for new construction only, or allow older homes.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                Showing {minYearBuilt}+ builds
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {YEAR_OPTIONS.map((year) => (
                <Button
                  key={year}
                  variant={minYearBuilt === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinYearBuilt(year)}
                  className={minYearBuilt === year ? "" : ""}
                >
                  {year}+
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                onClick={() => saveMinYearBuiltMutation.mutate(minYearBuilt)}
                disabled={saveMinYearBuiltMutation.isPending || minYearBuilt === savedMinYearBuilt}
              >
                {saveMinYearBuiltMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Save Year Filter
              </Button>
              <p className="text-sm text-muted-foreground">
                Currently showing homes built <strong>{savedMinYearBuilt || 2024}</strong> and newer on the site.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impact</AlertTitle>
              <AlertDescription>
                This setting affects all resale pages, map search, carousels, and property alerts. 
                Lower years will show more properties but may include older homes that aren't "new construction."
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

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

        {/* Sync Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Mode
            </CardTitle>
            <CardDescription>
              Choose what type of listings to sync from the DDF feed. The API uses CommonInterest = 'Condo/Strata' for condos and strata townhomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => syncMutation.mutate({ metroVancouverResidential: false })}
                disabled={syncMutation.isPending}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-semibold">
                    {syncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Strata Only (Default)
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Condos & strata townhomes - CommonInterest = 'Condo/Strata'
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => syncMutation.mutate({ metroVancouverResidential: true })}
                disabled={syncMutation.isPending}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-semibold">
                    {syncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Settings2 className="h-4 w-4" />
                    )}
                    All Residential
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Houses, condos, townhomes - All PropertyType = 'Residential'
                  </p>
                </div>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The sync runs in batches of 3,000 listings per request. For large syncs, you may need to run multiple times to import all data.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={clearListingsMutation.isPending || (listingStats?.total || 0) === 0}
                >
                  {clearListingsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear All Listings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All MLS Listings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all <strong>{listingStats?.total?.toLocaleString() || 0}</strong> MLS listings from the database. 
                    This action cannot be undone. You will need to run a new sync to repopulate the data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearListingsMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear All Listings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Geocoding Monitoring Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geocoding Monitoring Dashboard
            </CardTitle>
            <CardDescription>
              Track geocoding progress and Google Maps API usage. Nightly cron jobs geocode ~300 listings automatically at 5:00, 5:30, and 6:00 AM PST.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                <p className="text-2xl font-bold text-orange-600">{geocodeStats?.missingCoords || 0}</p>
                <p className="text-xs text-muted-foreground">Missing Coords</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-2xl font-bold text-green-600">{geocodeStats?.withCoords || 0}</p>
                <p className="text-xs text-muted-foreground">Geocoded</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <p className="text-2xl font-bold text-blue-600">{geocodingApiStats?.todayApiCalls || 0}</p>
                <p className="text-xs text-muted-foreground">API Calls Today</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <p className="text-2xl font-bold text-purple-600">{geocodingApiStats?.totalApiCalls || 0}</p>
                <p className="text-xs text-muted-foreground">Total API Calls</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{geocodingApiStats?.totalUpdated || 0}</p>
                <p className="text-xs text-muted-foreground">Total Updated</p>
              </div>
            </div>

            {/* Progress Bar */}
            {geocodeStats && (geocodeStats.missingCoords + geocodeStats.withCoords) > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Geocoding Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round((geocodeStats.withCoords / (geocodeStats.missingCoords + geocodeStats.withCoords)) * 100)}% complete
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all" 
                    style={{ 
                      width: `${(geocodeStats.withCoords / (geocodeStats.missingCoords + geocodeStats.withCoords)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {geocodeStats.withCoords.toLocaleString()} of {(geocodeStats.missingCoords + geocodeStats.withCoords).toLocaleString()} active listings geocoded
                </p>
              </div>
            )}

            {/* Manual Geocode Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => geocodeMutation.mutate({ batchSize: 50 })}
                disabled={geocodeMutation.isPending}
              >
                {geocodeMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Geocode 50 Listings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => geocodeMutation.mutate({ batchSize: 100 })}
                disabled={geocodeMutation.isPending}
              >
                Geocode 100 Listings
              </Button>
            </div>

            {/* Recent Geocoding Logs */}
            {geocodingLogs && geocodingLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Geocoding Activity</h4>
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Processed</TableHead>
                        <TableHead className="text-right">Updated</TableHead>
                        <TableHead className="text-right">API Calls</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geocodingLogs.slice(0, 5).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {format(new Date(log.started_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-right">{log.listings_processed ?? "-"}</TableCell>
                          <TableCell className="text-right">{log.listings_updated ?? "-"}</TableCell>
                          <TableCell className="text-right">{log.api_calls_made ?? "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.trigger_source || "manual"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Automated Geocoding Schedule</AlertTitle>
              <AlertDescription className="text-blue-700">
                <ul className="list-disc ml-4 mt-1 space-y-1 text-sm">
                  <li><strong>5:00 AM PST</strong> - Batch 1: 100 listings</li>
                  <li><strong>5:30 AM PST</strong> - Batch 2: 100 listings</li>
                  <li><strong>6:00 AM PST</strong> - Batch 3: 100 listings</li>
                </ul>
                <p className="mt-2 text-xs">~300 listings geocoded nightly after the MLS sync completes.</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Agent & Office Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent & Brokerage Sync
            </CardTitle>
            <CardDescription>
              Fetch agent and office details from the DDF API. Syncs 50 agents + 50 offices per run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {agentStats?.agents || 0} / {agentStats?.uniqueAgentsNeeded || 0}
                </p>
                <p className="text-xs text-muted-foreground">Agents Cached</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {agentStats?.offices || 0} / {agentStats?.uniqueOfficesNeeded || 0}
                </p>
                <p className="text-xs text-muted-foreground">Offices Cached</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-2xl font-bold text-green-600">{agentStats?.listingsWithAgent || 0}</p>
                <p className="text-xs text-muted-foreground">With Agent Name</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                <p className="text-2xl font-bold text-orange-600">{agentStats?.listingsWithOffice || 0}</p>
                <p className="text-xs text-muted-foreground">With Office Name</p>
              </div>
            </div>

            {/* Progress Bars */}
            {agentStats && agentStats.uniqueAgentsNeeded > 0 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Agent Cache Progress</span>
                    <span className="text-muted-foreground">
                      {Math.round((agentStats.agents / agentStats.uniqueAgentsNeeded) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${Math.min(100, (agentStats.agents / agentStats.uniqueAgentsNeeded) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Office Cache Progress</span>
                    <span className="text-muted-foreground">
                      {Math.round((agentStats.offices / agentStats.uniqueOfficesNeeded) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${Math.min(100, (agentStats.offices / agentStats.uniqueOfficesNeeded) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2 border-t">
              <Button
                onClick={() => agentSyncMutation.mutate()}
                disabled={agentSyncMutation.isPending}
              >
                {agentSyncMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Sync Agents & Offices
              </Button>
              <div className="text-xs text-muted-foreground">
                <p>Fetches up to 50 agents + 50 offices per run from DDF API.</p>
                <p className="text-muted-foreground/70">
                  Remaining: ~{Math.max(0, (agentStats?.uniqueAgentsNeeded || 0) - (agentStats?.agents || 0))} agents, 
                  ~{Math.max(0, (agentStats?.uniqueOfficesNeeded || 0) - (agentStats?.offices || 0))} offices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Configuration</CardTitle>
            <CardDescription>
              Your CREA DDF credentials are configured. The sync uses the standard DDF API endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">DDF Configured</AlertTitle>
              <AlertDescription className="text-blue-700">
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>DDF_USERNAME and DDF_PASSWORD secrets configured ✓</li>
                  <li>API Endpoint: ddfapi.realtor.ca/odata/v1/Property</li>
                  <li>OAuth via identity.crea.ca ✓</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button variant="outline" asChild>
              <a 
                href="https://ddfapi-docs.realtor.ca/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                CREA DDF API Docs
              </a>
            </Button>
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
