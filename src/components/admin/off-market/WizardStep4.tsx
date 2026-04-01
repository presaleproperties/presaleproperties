import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Package, Shield, FileText, DollarSign, Loader2 } from "lucide-react";
import type { OffMarketListingForm, OffMarketUnit } from "./types";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500",
  reserved: "bg-yellow-500/10 text-yellow-500",
  sold: "bg-red-500/10 text-red-400",
  hold: "bg-muted text-muted-foreground",
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
}

export function WizardStep4({ form, setForm, units, saving, onBack, onSaveDraft, onPublish }: Props) {
  const update = (key: keyof OffMarketListingForm, value: any) => setForm({ ...form, [key]: value });
  const available = units.filter(u => u.status === "available").length;
  const reserved = units.filter(u => u.status === "reserved").length;
  const sold = units.filter(u => u.status === "sold").length;
  const avgPrice = units.length ? Math.round(units.reduce((s, u) => s + u.price, 0) / units.length) : 0;

  return (
    <div className="space-y-6">
      {/* Project summary */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{form.linked_project_name}</h3>
              <p className="text-sm text-muted-foreground">{form.developer_name || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold">{units.length}</p>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </div>
            <div className="text-center p-3 bg-green-500/5 rounded-xl">
              <p className="text-2xl font-bold text-green-500">{available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="text-center p-3 bg-yellow-500/5 rounded-xl">
              <p className="text-2xl font-bold text-yellow-500">{reserved}</p>
              <p className="text-xs text-muted-foreground">Reserved</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold">${avgPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Avg Price</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details preview */}
      <div className="grid sm:grid-cols-2 gap-4">
        {form.deposit_structure && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Deposit</span>
              </div>
              <p className="text-sm text-muted-foreground">{form.deposit_structure}</p>
            </CardContent>
          </Card>
        )}
        {form.incentives && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Incentives</span>
              </div>
              <p className="text-sm text-muted-foreground">{form.incentives}</p>
            </CardContent>
          </Card>
        )}
        {form.pricing_sheet_url && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Pricing Sheet</span>
                <Badge variant="outline" className="text-xs ml-auto">Attached</Badge>
              </div>
            </CardContent>
          </Card>
        )}
        {form.brochure_url && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Brochure</span>
                <Badge variant="outline" className="text-xs ml-auto">Attached</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sample unit table */}
      {units.length > 0 && (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">Unit Preview (first 5)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-muted-foreground font-medium">Unit</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Beds/Baths</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">SqFt</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Price</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {units.slice(0, 5).map((u, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 font-medium">{u.unit_number}</td>
                      <td className="py-2">{u.unit_type || "—"}</td>
                      <td className="py-2">{u.bedrooms}bd / {u.bathrooms}ba</td>
                      <td className="py-2">{u.sqft.toLocaleString()}</td>
                      <td className="py-2 text-primary font-semibold">${u.price.toLocaleString()}</td>
                      <td className="py-2">
                        <Badge className={`${STATUS_COLORS[u.status]} border-0 text-xs rounded-lg capitalize`}>{u.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {units.length > 5 && <p className="text-xs text-muted-foreground mt-2">...and {units.length - 5} more units</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access level */}
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
