import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { VipHeader } from "@/components/vip/VipHeader";
import { VipProjectCard } from "@/components/vip/VipProjectCard";
import { useVipAuth } from "@/hooks/useVipAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, Search, Flame, Shield, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function VipDashboard() {
  const navigate = useNavigate();
  const { vipUser, isVipLoggedIn, loading: authLoading } = useVipAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [projectMap, setProjectMap] = useState<Record<string, any>>({});
  const [minPriceMap, setMinPriceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isVipLoggedIn) {
      navigate("/vip-login");
    }
  }, [authLoading, isVipLoggedIn, navigate]);

  useEffect(() => {
    if (isVipLoggedIn) loadData();
  }, [isVipLoggedIn]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("off_market_listings")
      .select("id, linked_project_name, linked_project_slug, developer_name, available_units, total_units, construction_stage, access_level, auto_approve_access, incentives, status")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    const items = data || [];
    setListings(items);

    const slugs = items.map((l: any) => l.linked_project_slug);
    if (slugs.length > 0) {
      const { data: projects } = await supabase
        .from("presale_projects")
        .select("slug, city, neighborhood, project_type, featured_image, completion_year")
        .in("slug", slugs);

      const pMap: Record<string, any> = {};
      (projects || []).forEach((p: any) => { pMap[p.slug] = p; });
      setProjectMap(pMap);
    }

    const listingIds = items.map((l: any) => l.id);
    if (listingIds.length > 0) {
      const { data: units } = await supabase
        .from("off_market_units")
        .select("listing_id, price")
        .in("listing_id", listingIds)
        .eq("status", "available")
        .order("price", { ascending: true });

      const priceMap: Record<string, number> = {};
      (units || []).forEach((u: any) => {
        if (!priceMap[u.listing_id]) priceMap[u.listing_id] = u.price;
      });
      setMinPriceMap(priceMap);
    }

    setLoading(false);
  }

  const cities = useMemo(() => {
    const set = new Set<string>();
    Object.values(projectMap).forEach((p: any) => { if (p.city) set.add(p.city); });
    return Array.from(set).sort();
  }, [projectMap]);

  const filtered = useMemo(() => {
    return listings.filter((l: any) => {
      const proj = projectMap[l.linked_project_slug];
      if (search && !l.linked_project_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && proj?.city !== cityFilter) return false;
      if (typeFilter !== "all" && proj?.project_type !== typeFilter) return false;
      return true;
    });
  }, [listings, search, cityFilter, typeFilter, projectMap]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCityFilter("all");
    setTypeFilter("all");
  }, []);

  const hasFilters = search || cityFilter !== "all" || typeFilter !== "all";
  const totalUnits = listings.reduce((s: number, l: any) => s + (l.available_units || 0), 0);

  const meta = vipUser?.user_metadata || {};
  const firstName = meta.first_name || "there";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>VIP Portal | Off-Market Inventory</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <VipHeader />

      {/* Welcome + Stats */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-sm text-primary font-semibold flex items-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5" /> VIP ACCESS
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse exclusive off-market inventory below.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{listings.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Projects</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{totalUnits}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Units</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9 text-sm bg-card"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-36 h-9 text-sm bg-card"><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-sm bg-card"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhome">Townhome</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-sm bg-card"
              />
            </div>
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 px-3 shrink-0">
                  <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="space-y-4 py-4">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-full h-11"><SelectValue placeholder="City" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full h-11"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhome">Townhome</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-3">
                    {hasFilters && (
                      <Button variant="outline" className="flex-1 h-11" onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}>
                        Clear All
                      </Button>
                    )}
                    <Button className="flex-1 h-11" onClick={() => setMobileFiltersOpen(false)}>
                      Show {filtered.length} Results
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "project" : "projects"} available
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing: any) => (
              <VipProjectCard
                key={listing.id}
                listing={listing}
                project={projectMap[listing.linked_project_slug]}
                minPrice={minPriceMap[listing.id]}
                onClick={() => navigate(`/off-market/${listing.linked_project_slug}`)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
