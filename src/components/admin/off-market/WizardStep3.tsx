import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, Calendar, Gift, Car, Warehouse, Download,
  Lock, Shield, ArrowUpDown, Loader2, Eye, MessageCircle, Phone,
} from "lucide-react";
import type { OffMarketListingForm, OffMarketUnit } from "./types";

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

const ACCESS_DESCRIPTIONS: Record<string, string> = {
  public: "Anyone can see full details — no gating",
  teaser: "Public sees project card, must fill form to unlock details",
  approved_only: "Teaser visible, admin manually approves each request",
  vip_only: "Not visible publicly, only shared via direct link",
};

interface Props {
  form: OffMarketListingForm;
  setForm: (f: OffMarketListingForm) => void;
  units: OffMarketUnit[];
  saving: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  projectPreview?: any;
  showAccessSettings?: boolean;
}

export function WizardStep3({ form, setForm, units, saving, onBack, onSaveDraft, onPublish, projectPreview, showAccessSettings = true }: Props) {
  const update = (key: keyof OffMarketListingForm, value: any) => setForm({ ...form, [key]: value });
  const [previewMode, setPreviewMode] = useState(true);
  const [showSold, setShowSold] = useState(false);
  const [sortBy, setSortBy] = useState("price");
  const [sortAsc, setSortAsc] = useState(true);

  const stageIndex = form.construction_stage ? STAGES.indexOf(form.construction_stage) : -1;
  const incentiveExpiry = form.incentive_expiry ? new Date(form.incentive_expiry) : null;
  const daysUntilExpiry = incentiveExpiry ? Math.max(0, Math.ceil((incentiveExpiry.getTime() - Date.now()) / 86400000)) : null;

  const sortedUnits = useMemo(() => {
    let filtered = showSold ? units : units.filter(u => u.status !== "sold");
    return [...filtered].sort((a, b) => {
      const va = (a as any)[sortBy] ?? 0;
      const vb = (b as any)[sortBy] ?? 0;
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [units, showSold, sortBy, sortAsc]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  return (
    <div className="space-y-6">
      {/* Toggle between preview and settings */}
      <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-2">
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="sm"
          className="rounded-lg gap-1.5"
          onClick={() => setPreviewMode(true)}
        >
          <Eye className="h-4 w-4" /> Page Preview
        </Button>
        {showAccessSettings && (
          <Button
            variant={!previewMode ? "default" : "ghost"}
            size="sm"
            className="rounded-lg gap-1.5"
            onClick={() => setPreviewMode(false)}
          >
            <Shield className="h-4 w-4" /> Access Settings
          </Button>
        )}
      </div>

      {previewMode ? (
        /* ─── FULL PAGE PREVIEW ─── */
        <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
          {/* Preview banner */}
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
            <p className="text-xs font-medium text-primary">📱 Page Preview — This is how buyers will see your listing</p>
          </div>

          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">{form.linked_project_name}</h1>
              <div className="flex items-center gap-3 flex-wrap text-muted-foreground text-sm">
                {form.developer_name && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {form.developer_name}</span>}
                {projectPreview?.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {projectPreview.neighborhood ? `${projectPreview.neighborhood}, ${projectPreview.city}` : projectPreview.city}</span>}
                {form.completion_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {form.completion_date}</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {projectPreview?.project_type && <Badge variant="outline" className="capitalize">{projectPreview.project_type}</Badge>}
                {form.construction_stage && <Badge variant="secondary" className="capitalize">{stageLabels[form.construction_stage] || form.construction_stage}</Badge>}
              </div>
            </div>

            {/* Construction Progress */}
            {stageIndex >= 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Construction Progress</p>
                <div className="flex gap-1">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex-1 space-y-1">
                      <div className={`h-2 rounded-full ${i <= stageIndex ? "bg-primary" : "bg-muted"}`} />
                      <p className={`text-[10px] text-center ${i <= stageIndex ? "text-primary" : "text-muted-foreground/50"}`}>
                        {stageLabels[s]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="grid md:grid-cols-3 gap-3">
              {form.pricing_sheet_url && (
                <Card className="bg-card border-border/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Pricing Sheet</span>
                    <Button size="sm" variant="outline" disabled><Download className="h-4 w-4 mr-1" /> Download</Button>
                  </CardContent>
                </Card>
              )}
              {form.brochure_url && (
                <Card className="bg-card border-border/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Brochure</span>
                    <Button size="sm" variant="outline" disabled><Download className="h-4 w-4 mr-1" /> Download</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Incentives & Deposit */}
            <div className="grid md:grid-cols-2 gap-4">
              {(form.incentives || form.vip_incentives) && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base"><Gift className="h-5 w-5 text-primary" /> Incentives</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {form.incentives && <p className="text-sm">{form.incentives}</p>}
                    {form.vip_incentives && (
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-2">
                        <Badge className="mb-1 bg-primary text-primary-foreground text-xs">VIP ONLY</Badge>
                        <p className="text-sm">{form.vip_incentives}</p>
                      </div>
                    )}
                    {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                      <p className="text-xs text-primary font-medium">Offer expires in {daysUntilExpiry} days</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deposit & Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {form.deposit_structure && <div><span className="text-muted-foreground">Deposit:</span> {form.deposit_structure}</div>}
                  {form.deposit_percentage && <div><span className="text-muted-foreground">Deposit %:</span> {form.deposit_percentage}%</div>}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{form.parking_included ? "Parking Included" : form.parking_cost ? `Parking: $${form.parking_cost.toLocaleString()}` : "No parking info"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <span>{form.storage_included ? "Storage Included" : form.storage_cost ? `Storage: $${form.storage_cost.toLocaleString()}` : "No storage info"}</span>
                  </div>
                  {form.assignment_allowed && (
                    <div>Assignment: Allowed {form.assignment_fee && `(${form.assignment_fee})`}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Unit Inventory Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold">Unit Inventory ({units.filter(u => u.status === "available").length} available)</h2>
                <div className="flex items-center gap-2">
                  <Switch id="preview-sold" checked={showSold} onCheckedChange={setShowSold} />
                  <Label htmlFor="preview-sold" className="text-sm text-muted-foreground">Show sold</Label>
                </div>
              </div>
              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-card border-b border-border">
                      {[
                        { key: "unit_number", label: "Unit #" },
                        { key: "unit_name", label: "Plan" },
                        { key: "unit_type", label: "Type" },
                        { key: "bedrooms", label: "Beds" },
                        { key: "bathrooms", label: "Baths" },
                        { key: "sqft", label: "SqFt" },
                        { key: "price", label: "Price" },
                        { key: "incentive", label: "Incentive" },
                        { key: "status", label: "Status" },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
                          onClick={() => key !== "incentive" && handleSort(key)}
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
                    {sortedUnits.map((u, i) => (
                      <tr key={i} className="border-b border-border hover:bg-card">
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            {u.floorplan_url && (
                              <img src={u.floorplan_url} className="w-8 h-8 rounded object-cover bg-white flex-shrink-0" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                            {u.unit_number || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{u.unit_name || "—"}</td>
                        <td className="px-3 py-2">{u.unit_type || "—"}</td>
                        <td className="px-3 py-2">{u.bedrooms}</td>
                        <td className="px-3 py-2">{u.bathrooms}</td>
                        <td className="px-3 py-2">{u.sqft.toLocaleString()}</td>
                        <td className="px-3 py-2 text-primary font-semibold">${u.price.toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {u.has_unit_incentive && u.unit_incentive ? (
                            <span className="text-primary text-xs font-medium">{u.unit_incentive}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-xs ${statusColors[u.status] || ""}`}>{u.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile CTA Preview */}
            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" disabled className="gap-1"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
              <Button size="sm" variant="outline" disabled className="gap-1"><Phone className="h-4 w-4" /> Call</Button>
              <Button size="sm" variant="outline" disabled className="gap-1"><Download className="h-4 w-4" /> Download</Button>
              <span className="text-xs text-muted-foreground">(Mobile sticky bar)</span>
            </div>
          </div>
        </div>
      ) : (
        /* ─── ACCESS SETTINGS ─── */
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Access Settings</h3>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Access Level</Label>
              <Select value={form.access_level} onValueChange={(v) => update("access_level", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="teaser">Teaser</SelectItem>
                  <SelectItem value="approved_only">Approved Only</SelectItem>
                  <SelectItem value="vip_only">VIP Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">{ACCESS_DESCRIPTIONS[form.access_level]}</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.auto_approve_access} onCheckedChange={(v) => update("auto_approve_access", v)} />
              <div>
                <Label className="text-sm font-medium">Auto-Approve Access</Label>
                <p className="text-xs text-muted-foreground">When ON, form submissions get instant access</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={onBack} className="rounded-xl" disabled={saving}>← Back</Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSaveDraft} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save as Draft
          </Button>
          <Button onClick={onPublish} disabled={saving} className="rounded-xl shadow-gold hover:shadow-gold-glow font-bold px-8">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publish Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
