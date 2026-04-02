import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { trackOffMarketEvent, getApprovedEmail, checkAccess } from "@/lib/offMarketAnalytics";
import { UnlockModal } from "@/components/off-market/UnlockModal";
import {
  Building2, MapPin, Calendar, Download, MessageCircle, Phone, Lock, Gift,
  Car, Warehouse, ChevronDown, ChevronUp, Eye, ArrowLeft, ArrowUpDown
} from "lucide-react";

const STAGES = ["pre-construction", "excavation", "foundation", "framing", "finishing", "move-in-ready"];
const stageLabels: Record<string, string> = {
  "pre-construction": "Pre-Construction",
  excavation: "Excavation",
  foundation: "Foundation",
  framing: "Framing",
  finishing: "Finishing",
  "move-in-ready": "Move-In Ready",
};

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  reserved: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  sold: "bg-red-500/15 text-red-400 border-red-500/30",
  hold: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export default function OffMarketDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showSold, setShowSold] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("price");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  async function loadData() {
    setLoading(true);

    // Get listing
    const { data: listingData } = await supabase
      .from("off_market_listings")
      .select("*")
      .eq("linked_project_slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!listingData) {
      navigate("/off-market");
      return;
    }

    setListing(listingData);
    trackOffMarketEvent("listing_view", listingData.id);

    // Check access
    const email = getApprovedEmail();
    if (email) {
      const approved = await checkAccess(listingData.id, email);
      setHasAccess(approved);
      if (!approved) {
        setShowUnlock(true);
        setLoading(false);
        return;
      }
    } else {
      setShowUnlock(true);
      setLoading(false);
      return;
    }

    // Get project info
    const { data: proj } = await supabase
      .from("presale_projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    setProject(proj);

    // Get units
    const { data: unitData } = await supabase
      .from("off_market_units")
      .select("*")
      .eq("listing_id", listingData.id)
      .order("display_order", { ascending: true });
    setUnits(unitData || []);

    setLoading(false);
  }

  const sortedUnits = useMemo(() => {
    let filtered = showSold ? units : units.filter((u) => u.status !== "sold");
    return [...filtered].sort((a, b) => {
      const va = a[sortBy] ?? 0;
      const vb = b[sortBy] ?? 0;
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [units, showSold, sortBy, sortAsc]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const upgrades = listing?.available_upgrades as any[] | null;
  const stageIndex = listing?.construction_stage ? STAGES.indexOf(listing.construction_stage) : -1;
  const incentiveExpiry = listing?.incentive_expiry ? new Date(listing.incentive_expiry) : null;
  const daysUntilExpiry = incentiveExpiry ? Math.max(0, Math.ceil((incentiveExpiry.getTime() - Date.now()) / 86400000)) : null;

  if (loading) {
    return (
      <>
        <ConversionHeader />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <ConversionHeader />
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 text-center space-y-6">
          <Lock className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-3xl font-bold">{listing?.linked_project_name}</h1>
          <p className="text-muted-foreground text-lg">This listing requires VIP access. Fill out the form below to request access.</p>
          <Button size="lg" onClick={() => setShowUnlock(true)}>
            <Lock className="h-4 w-4 mr-2" /> Request Access
          </Button>
        </div>
        <Footer />
        {listing && (
          <UnlockModal
            open={showUnlock}
            onOpenChange={setShowUnlock}
            listingId={listing.id}
            projectName={listing.linked_project_name}
            autoApprove={listing.auto_approve_access}
            onApproved={() => { setHasAccess(true); setShowUnlock(false); loadData(); }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{listing?.linked_project_name} — Off-Market Details | Presale Properties</title>
        <meta name="description" content={`Exclusive off-market inventory for ${listing?.linked_project_name}. VIP pricing, floor plans and incentives.`} />
      </Helmet>

      <ConversionHeader />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/off-market")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Off-Market
        </Button>

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">{listing.linked_project_name}</h1>
          <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
            {listing.developer_name && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {listing.developer_name}</span>}
            {project?.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {project.neighborhood ? `${project.neighborhood}, ${project.city}` : project.city}</span>}
            {listing.completion_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {listing.completion_date}</span>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {project?.project_type && <Badge variant="outline" className="capitalize">{project.project_type}</Badge>}
            {listing.construction_stage && <Badge variant="secondary">{stageLabels[listing.construction_stage]}</Badge>}
          </div>
        </div>

        {/* Construction Progress */}
        {stageIndex >= 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Construction Progress</p>
            <div className="flex gap-1">
              {STAGES.map((s, i) => (
                <div key={s} className="flex-1 space-y-1">
                  <div className={`h-2 rounded-full ${i <= stageIndex ? "bg-primary" : "bg-[#1e1e1e]"}`} />
                  <p className={`text-[10px] text-center ${i <= stageIndex ? "text-primary" : "text-muted-foreground/50"}`}>
                    {stageLabels[s]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="grid md:grid-cols-3 gap-4">
          {listing.pricing_sheet_url && (
            <Card className="bg-[#141414] border-[#1e1e1e]">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Pricing Sheet</span>
                <Button size="sm" variant="outline" asChild onClick={() => trackOffMarketEvent("pricing_download", listing.id)}>
                  <a href={listing.pricing_sheet_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
          {listing.brochure_url && (
            <Card className="bg-[#141414] border-[#1e1e1e]">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Brochure</span>
                <Button size="sm" variant="outline" asChild>
                  <a href={listing.brochure_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
          {listing.info_sheet_url && (
            <Card className="bg-[#141414] border-[#1e1e1e]">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Info Sheet</span>
                <Button size="sm" variant="outline" asChild>
                  <a href={listing.info_sheet_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Floor Plans Gallery */}
        {listing.floorplan_urls && listing.floorplan_urls.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Floor Plans</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listing.floorplan_urls.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOffMarketEvent("floorplan_download", listing.id)}
                  className="rounded-lg border border-[#1e1e1e] overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <img src={url} alt={`Floor plan ${i + 1}`} className="w-full aspect-square object-contain bg-white p-2" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Incentives */}
          {(listing.incentives || listing.vip_incentives) && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Incentives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.incentives && <p className="text-sm">{listing.incentives}</p>}
                {listing.vip_incentives && (
                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                    <Badge className="mb-2 bg-primary text-primary-foreground text-xs">VIP ONLY</Badge>
                    <p className="text-sm">{listing.vip_incentives}</p>
                  </div>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                  <p className="text-xs text-primary font-medium">Offer expires in {daysUntilExpiry} days</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deposit & Financial */}
          <Card className="bg-[#141414] border-[#1e1e1e]">
            <CardHeader>
              <CardTitle className="text-base">Deposit & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {listing.deposit_structure && <div><span className="text-muted-foreground">Deposit:</span> {listing.deposit_structure}</div>}
              {listing.deposit_percentage && <div><span className="text-muted-foreground">Deposit %:</span> {listing.deposit_percentage}%</div>}
              <Separator className="bg-[#1e1e1e]" />
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{listing.parking_included ? "Parking Included" : listing.parking_cost ? `Parking: $${Number(listing.parking_cost).toLocaleString()}` : "No parking info"}</span>
                {listing.parking_type && <Badge variant="outline" className="text-xs">{listing.parking_type}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <span>{listing.storage_included ? "Storage Included" : listing.storage_cost ? `Storage: $${Number(listing.storage_cost).toLocaleString()}` : "No storage info"}</span>
              </div>
              {listing.assignment_allowed && (
                <div className="text-sm">Assignment: Allowed {listing.assignment_fee && `(${listing.assignment_fee})`}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Unit Inventory Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold">Unit Inventory ({units.filter(u => u.status === "available").length} available)</h2>
            <div className="flex items-center gap-2">
              <Switch id="show-sold" checked={showSold} onCheckedChange={setShowSold} />
              <Label htmlFor="show-sold" className="text-sm text-muted-foreground">Show sold units</Label>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card border-b border-border">
                  {[
                    { key: "unit_number", label: "Unit #", sticky: true },
                    { key: "unit_type", label: "Type" },
                    { key: "bedrooms", label: "Beds" },
                    { key: "bathrooms", label: "Baths" },
                    { key: "sqft", label: "SqFt" },
                    { key: "price", label: "Price" },
                    { key: "price_per_sqft", label: "$/SqFt" },
                    { key: "floor_level", label: "Floor" },
                    { key: "status", label: "Status" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sortBy === key && <ArrowUpDown className="h-3 w-3 text-primary" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedUnits.map((unit) => (
                  <>
                    <tr
                      key={unit.id}
                      className="border-b border-[#1e1e1e] hover:bg-[#141414] cursor-pointer transition-colors"
                      onClick={() => {
                        setExpandedUnit(expandedUnit === unit.id ? null : unit.id);
                        trackOffMarketEvent("unit_view", listing.id, unit.id);
                      }}
                    >
                      <td className="px-3 py-2.5 font-medium">{unit.unit_number}</td>
                      <td className="px-3 py-2.5">{unit.unit_type || "—"}</td>
                      <td className="px-3 py-2.5">{unit.bedrooms}</td>
                      <td className="px-3 py-2.5">{unit.bathrooms}</td>
                      <td className="px-3 py-2.5">{Number(unit.sqft).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-primary font-semibold">${Number(unit.price).toLocaleString()}</td>
                      <td className="px-3 py-2.5">${unit.price_per_sqft || "—"}</td>
                      <td className="px-3 py-2.5">{unit.floor_level || "—"}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className={`text-xs ${statusColors[unit.status] || ""}`}>
                          {unit.status}
                        </Badge>
                      </td>
                    </tr>
                    {expandedUnit === unit.id && (
                      <tr key={`${unit.id}-detail`} className="bg-[#141414]/50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {unit.floorplan_url && (
                              <img src={unit.floorplan_url} alt={`Floor plan ${unit.unit_number}`} className="rounded-lg bg-white p-2 max-h-64 object-contain" />
                            )}
                            <div className="space-y-2 text-sm">
                              {unit.orientation && <div><span className="text-muted-foreground">Orientation:</span> {unit.orientation}</div>}
                              {unit.view_type && <div><span className="text-muted-foreground">View:</span> {unit.view_type}</div>}
                              {unit.parking_included && <div>✓ Parking Included {unit.parking_type && `(${unit.parking_type})`}</div>}
                              {unit.storage_included && <div>✓ Storage Included</div>}
                              {unit.locker_included && <div>✓ Locker Included</div>}
                              {unit.inclusions && unit.inclusions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {unit.inclusions.map((inc: string) => <Badge key={inc} variant="secondary" className="text-xs">{inc}</Badge>)}
                                </div>
                              )}
                              {unit.has_unit_incentive && unit.unit_incentive && (
                                <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20 text-xs">
                                  <Gift className="h-3 w-3 inline mr-1 text-primary" /> {unit.unit_incentive}
                                </div>
                              )}
                              {unit.available_upgrades && (unit.available_upgrades as any[]).length > 0 && (
                                <div className="mt-2">
                                  <p className="text-muted-foreground text-xs mb-1">Available Upgrades:</p>
                                  {(unit.available_upgrades as any[]).map((u: any, i: number) => (
                                    <div key={i} className="text-xs">{u.name} — ${Number(u.price || 0).toLocaleString()}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {sortedUnits.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No units to display</div>
            )}
          </div>
        </div>

        {/* Upgrades */}
        {upgrades && upgrades.length > 0 && (
          <Card className="bg-[#141414] border-[#1e1e1e]">
            <CardHeader><CardTitle className="text-base">Available Upgrades</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upgrades.map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[#1e1e1e] last:border-0">
                  <span>{u.name}</span>
                  <span className="text-primary font-medium">${Number(u.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        {listing.additional_notes && (
          <Card className="bg-[#141414] border-[#1e1e1e]">
            <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {listing.additional_notes}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#141414] border-t border-[#1e1e1e] p-3 flex items-center gap-2 md:hidden">
        <Button size="sm" className="flex-1" asChild onClick={() => trackOffMarketEvent("whatsapp_click", listing?.id)}>
          <a href={`https://wa.me/16722581100?text=Hi! I'm interested in ${listing?.linked_project_name} off-market units`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
          </a>
        </Button>
        <Button size="sm" variant="outline" className="flex-1" asChild onClick={() => trackOffMarketEvent("call_click", listing?.id)}>
          <a href="tel:6722581100"><Phone className="h-4 w-4 mr-1" /> Call</a>
        </Button>
        {listing?.pricing_sheet_url && (
          <Button size="sm" variant="outline" asChild onClick={() => trackOffMarketEvent("pricing_download", listing?.id)}>
            <a href={listing.pricing_sheet_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
          </Button>
        )}
      </div>

      <Footer />
    </>
  );
}
