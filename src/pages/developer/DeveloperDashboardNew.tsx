import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Loader2, Building2, Plus, Eye, TrendingUp, Clock, AlertCircle,
  CheckCircle, Package, Sparkles, Lock, Users, Send
} from "lucide-react";

interface DeveloperProfile {
  id: string;
  company_name: string;
  contact_name: string;
  verification_status: string;
  created_at: string;
}

interface OffMarketListing {
  id: string;
  linked_project_name: string;
  status: string;
  available_units: number;
  total_units: number;
  view_count: number;
  unlock_request_count: number;
  updated_at: string;
}

interface AccessRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  budget_range: string | null;
  status: string;
  created_at: string;
  listing_id: string;
  project_name?: string;
}

interface Stats {
  activeListings: number;
  availableUnits: number;
  totalInquiries: number;
  totalViews: number;
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  draft: { className: "bg-muted text-muted-foreground", label: "Draft" },
  pending_review: { className: "bg-orange-500/10 text-orange-500", label: "Pending Review" },
  published: { className: "bg-green-500/10 text-green-500", label: "Published" },
  archived: { className: "bg-muted text-muted-foreground", label: "Archived" },
};

export default function DeveloperDashboardNew() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [listings, setListings] = useState<OffMarketListing[]>([]);
  const [inquiries, setInquiries] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ activeListings: 0, availableUnits: 0, totalInquiries: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/developer/login");
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!dev) { navigate("/developer/login"); return; }
    setProfile(dev);

    if (dev.verification_status === "approved") {
      // Get developer's off-market listings (match by company name or developer_id)
      const { data: devRow } = await supabase
        .from("developers")
        .select("id")
        .ilike("name", `%${dev.company_name}%`)
        .maybeSingle();

      let listingsQuery = supabase
        .from("off_market_listings")
        .select("*")
        .order("updated_at", { ascending: false });

      if (devRow) {
        listingsQuery = listingsQuery.eq("developer_id", devRow.id);
      } else {
        listingsQuery = listingsQuery.ilike("developer_name", `%${dev.company_name}%`);
      }

      const { data: listingData } = await listingsQuery;
      const myListings = listingData || [];
      setListings(myListings);

      const activeListings = myListings.filter(l => l.status === "published").length;
      const availableUnits = myListings.filter(l => l.status === "published").reduce((s, l) => s + (l.available_units || 0), 0);
      const totalViews = myListings.reduce((s, l) => s + (l.view_count || 0), 0);

      // Get inquiries for their listings
      const listingIds = myListings.map(l => l.id);
      if (listingIds.length > 0) {
        const { data: accessData } = await supabase
          .from("off_market_access")
          .select("*")
          .in("listing_id", listingIds)
          .order("created_at", { ascending: false })
          .limit(10);

        const enriched = (accessData || []).map(a => {
          const listing = myListings.find(l => l.id === a.listing_id);
          return { ...a, project_name: listing?.linked_project_name || "Unknown" };
        });
        setInquiries(enriched);

        const { count } = await supabase
          .from("off_market_access")
          .select("*", { count: "exact", head: true })
          .in("listing_id", listingIds);

        setStats({ activeListings, availableUnits, totalInquiries: count || 0, totalViews });
      } else {
        setStats({ activeListings, availableUnits, totalInquiries: 0, totalViews });
      }
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  // Pending
  if (profile.verification_status === "pending") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Under Review</h1>
          <p className="text-muted-foreground mb-2">
            We're verifying your developer account. This usually takes 1–2 business days.
          </p>
          <p className="text-sm text-muted-foreground">
            Company: <span className="font-semibold text-foreground">{profile.company_name}</span> ·{" "}
            Submitted: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </DeveloperPortalLayout>
    );
  }

  // Rejected
  if (profile.verification_status === "rejected") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Not Approved</h1>
          <p className="text-muted-foreground">
            Contact us at{" "}
            <a href="mailto:info@presaleproperties.com" className="text-primary underline">
              info@presaleproperties.com
            </a>{" "}
            for more information.
          </p>
        </div>
      </DeveloperPortalLayout>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">

        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile.contact_name}</h1>
            <p className="text-muted-foreground text-sm">{profile.company_name}</p>
          </div>
          <Link to="/developer/off-market/new">
            <Button className="shadow-gold hover:shadow-gold-glow font-bold rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Add Off-Market Inventory
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listings", value: stats.activeListings, icon: Building2 },
            { label: "Available Units", value: stats.availableUnits, icon: Package },
            { label: "Total Inquiries", value: stats.totalInquiries, icon: Users },
            { label: "Total Views", value: stats.totalViews, icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl shadow-card hover:shadow-card-hover transition-shadow border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Listings */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">My Off-Market Listings</h2>
          {listings.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/60">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold mb-2">No off-market listings yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Upload your exclusive inventory to reach VIP buyers
                </p>
                <Link to="/developer/off-market/new">
                  <Button className="shadow-gold font-bold rounded-xl gap-2">
                    <Sparkles className="h-4 w-4" />
                    Add Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inquiries</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((l) => {
                      const badge = STATUS_BADGE[l.status] || STATUS_BADGE.draft;
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.linked_project_name}</TableCell>
                          <TableCell>
                            <span className="text-primary font-semibold">{l.available_units || 0}</span>
                            <span className="text-muted-foreground">/{l.total_units || 0}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                          </TableCell>
                          <TableCell>{l.unlock_request_count || 0}</TableCell>
                          <TableCell>{l.view_count || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(l.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.status === "draft" && (
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/developer/off-market/edit/${l.id}`}>
                                  <Button size="sm" variant="outline" className="text-xs rounded-lg">Edit</Button>
                                </Link>
                              </div>
                            )}
                            {l.status === "pending_review" && (
                              <Badge variant="outline" className="text-xs rounded-lg">Under Review</Badge>
                            )}
                            {l.status === "published" && (
                              <Link to={`/off-market/${l.linked_project_name?.toLowerCase().replace(/\s+/g, '-')}`}>
                                <Button size="sm" variant="ghost" className="text-xs rounded-lg gap-1">
                                  <Eye className="h-3 w-3" /> View Live
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Inquiries */}
        {inquiries.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Recent Inquiries</h2>
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {inq.status === "approved" ? (
                            <div>
                              <p className="font-medium">{inq.first_name} {inq.last_name}</p>
                              <p className="text-xs text-muted-foreground">{inq.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Pending approval</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{inq.project_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inq.budget_range || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${
                            inq.status === "approved" ? "bg-green-500/10 text-green-500"
                            : inq.status === "denied" ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {inq.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DeveloperPortalLayout>
  );
}
