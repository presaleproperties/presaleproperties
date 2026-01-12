import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Settings2
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
        .single();
      
      return data?.value as string | null;
    },
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async (customFeedUrl?: string) => {
      const { data, error } = await supabase.functions.invoke("sync-mls-data", {
        body: customFeedUrl ? { feedUrl: customFeedUrl } : {},
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
                onClick={() => syncMutation.mutate(feedUrl || savedFeedUrl || undefined)}
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
