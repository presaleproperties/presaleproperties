import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Crown,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  User,
  Heart,
  Bell,
  ChevronDown,
  MoreHorizontal,
  Eye,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface BuyerProfile {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  full_name: string | null;
  buyer_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_cities: string[];
  timeline: string | null;
  is_vip: boolean;
  vip_joined_at: string | null;
  alerts_enabled: boolean;
  alert_frequency: string;
  drip_sequence_step: number;
  created_at: string;
}

interface BuyerStats {
  total: number;
  vip: number;
  alertsEnabled: number;
  thisWeek: number;
}

const AdminBuyers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerTypeFilter, setBuyerTypeFilter] = useState("all");
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [dripEmails, setDripEmails] = useState<any[]>([]);

  const { data: buyers, isLoading } = useQuery({
    queryKey: ["admin-buyers", searchQuery, buyerTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("buyer_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      if (buyerTypeFilter !== "all") {
        query = query.eq("buyer_type", buyerTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BuyerProfile[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-buyer-stats"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: all } = await supabase.from("buyer_profiles").select("id, is_vip, alerts_enabled, created_at");
      
      const total = all?.length || 0;
      const vip = all?.filter((b) => b.is_vip).length || 0;
      const alertsEnabled = all?.filter((b) => b.alerts_enabled).length || 0;
      const thisWeek = all?.filter((b) => new Date(b.created_at) >= oneWeekAgo).length || 0;

      return { total, vip, alertsEnabled, thisWeek } as BuyerStats;
    },
  });

  useEffect(() => {
    const fetchBuyerDetails = async () => {
      if (!selectedBuyer) return;

      // Fetch saved projects
      const { data: projects } = await supabase
        .from("saved_projects")
        .select(`
          id,
          created_at,
          project:presale_projects(name, city, slug)
        `)
        .eq("buyer_id", selectedBuyer.id);
      setSavedProjects(projects || []);

      // Fetch drip emails
      const { data: emails } = await supabase
        .from("buyer_drip_emails")
        .select("*")
        .eq("buyer_id", selectedBuyer.id)
        .order("sent_at", { ascending: false });
      setDripEmails(emails || []);
    };

    fetchBuyerDetails();
  }, [selectedBuyer]);

  const getBuyerTypeLabel = (type: string | null) => {
    switch (type) {
      case "first_time": return "First-Time Buyer";
      case "investor": return "Investor";
      case "upgrader": return "Upgrader";
      case "downsizer": return "Downsizer";
      default: return "Unknown";
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>VIP Buyers | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Crown className="w-6 h-6 text-primary" />
              VIP Buyers
            </h1>
            <p className="text-muted-foreground">
              Manage VIP members and their preferences
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Buyers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.vip || 0}</p>
                  <p className="text-xs text-muted-foreground">VIP Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.alertsEnabled || 0}</p>
                  <p className="text-xs text-muted-foreground">Alerts Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={buyerTypeFilter} onValueChange={setBuyerTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Buyer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="first_time">First-Time Buyer</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="upgrader">Upgrader</SelectItem>
              <SelectItem value="downsizer">Downsizer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Drip Step</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading buyers...
                    </TableCell>
                  </TableRow>
                ) : buyers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No buyers found
                    </TableCell>
                  </TableRow>
                ) : (
                  buyers?.map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{buyer.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{buyer.email}</p>
                          {buyer.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {buyer.phone}
                              {buyer.phone_verified && (
                                <Badge variant="outline" className="text-[10px] ml-1">
                                  Verified
                                </Badge>
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getBuyerTypeLabel(buyer.buyer_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {buyer.is_vip && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          {buyer.alerts_enabled && (
                            <Badge variant="outline" className="text-blue-600">
                              <Bell className="w-3 h-3 mr-1" />
                              Alerts
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          Step {buyer.drip_sequence_step}/4
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(buyer.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBuyer(buyer)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Buyer Detail Modal */}
      <Dialog open={!!selectedBuyer} onOpenChange={() => setSelectedBuyer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBuyer?.full_name || "Buyer Details"}
              {selectedBuyer?.is_vip && <Crown className="w-5 h-5 text-yellow-500" />}
            </DialogTitle>
          </DialogHeader>

          {selectedBuyer && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedBuyer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedBuyer.phone || "—"}
                    {selectedBuyer.phone_verified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer Type</p>
                  <p className="font-medium">{getBuyerTypeLabel(selectedBuyer.buyer_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="font-medium">{selectedBuyer.timeline || "—"} months</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Range</p>
                  <p className="font-medium">
                    {selectedBuyer.budget_min || selectedBuyer.budget_max
                      ? `$${(selectedBuyer.budget_min || 0) / 1000}K - $${(selectedBuyer.budget_max || 0) / 1000}K`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Cities</p>
                  <p className="font-medium">
                    {selectedBuyer.preferred_cities?.length > 0
                      ? selectedBuyer.preferred_cities.join(", ")
                      : "Any"}
                  </p>
                </div>
              </div>

              {/* Saved Projects */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Saved Projects ({savedProjects.length})
                </h4>
                {savedProjects.length > 0 ? (
                  <ul className="space-y-2">
                    {savedProjects.map((sp) => (
                      <li key={sp.id} className="text-sm flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{sp.project?.name} — {sp.project?.city}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(sp.created_at), "MMM d")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No saved projects</p>
                )}
              </div>

              {/* Drip Email History */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email History
                </h4>
                {dripEmails.length > 0 ? (
                  <ul className="space-y-2">
                    {dripEmails.map((email) => (
                      <li key={email.id} className="text-sm flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="capitalize">{email.email_type.replace("_", " ")}</span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>{format(new Date(email.sent_at), "MMM d, h:mm a")}</span>
                          {email.opened_at && (
                            <Badge variant="outline" className="text-[10px]">Opened</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No emails sent yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBuyers;
