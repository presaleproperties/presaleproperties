import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Upload, X, Plus, Trash2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { OffMarketListingForm } from "./types";

interface Props {
  form: OffMarketListingForm;
  setForm: (f: OffMarketListingForm) => void;
  onBack: () => void;
  onNext: () => void;
}

function FileUploadField({
  label,
  bucket,
  value,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg,.webp",
  multiple = false,
}: {
  label: string;
  bucket: string;
  value: string | string[];
  onChange: (v: any) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      if (multiple) {
        onChange([...(Array.isArray(value) ? value : []), ...urls]);
      } else {
        onChange(urls[0]);
      }
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (url: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v: string) => v !== url));
    } else {
      onChange("");
    }
  };

  const displayValues = multiple ? (Array.isArray(value) ? value : []) : value ? [value as string] : [];

  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border/60 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Drop files or click to upload"}</span>
        <input type="file" accept={accept} multiple={multiple} onChange={handleUpload} className="hidden" />
      </label>
      {displayValues.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {displayValues.map((url) => (
            <div key={url} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">{url.split("/").pop()}</span>
              <button onClick={() => removeItem(url)} className="text-muted-foreground hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WizardStep2({ form, setForm, onBack, onNext }: Props) {
  const update = (key: keyof OffMarketListingForm, value: any) => setForm({ ...form, [key]: value });

  return (
    <div className="space-y-6">
      {/* File uploads */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold">Documents</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <FileUploadField label="Pricing Sheet (PDF)" bucket="off-market-pricing" value={form.pricing_sheet_url} onChange={(v) => update("pricing_sheet_url", v)} accept=".pdf" />
            <FileUploadField label="Brochure (PDF)" bucket="off-market-pricing" value={form.brochure_url} onChange={(v) => update("brochure_url", v)} accept=".pdf" />
          </div>
          <FileUploadField label="Floor Plans" bucket="off-market-floorplans" value={form.floorplan_urls} onChange={(v) => update("floorplan_urls", v)} accept=".pdf,.png,.jpg,.jpeg,.webp" multiple />
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold">Deposit Structure</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Deposit Details</Label>
              <Input value={form.deposit_structure} onChange={(e) => update("deposit_structure", e.target.value)} placeholder="e.g., 5% on signing, 5% at 6 months..." className="rounded-xl" />
            </div>
            <div>
              <Label className="text-sm">Deposit %</Label>
              <Input type="number" value={form.deposit_percentage || ""} onChange={(e) => update("deposit_percentage", e.target.value ? Number(e.target.value) : null)} placeholder="15" className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incentives */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold">Incentives</h3>
          <div>
            <Label className="text-sm">Current Incentives</Label>
            <Textarea value={form.incentives} onChange={(e) => update("incentives", e.target.value)} placeholder="Free AC upgrade + 1 year free strata..." className="rounded-xl" rows={2} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Incentive Expiry</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left rounded-xl", !form.incentive_expiry && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.incentive_expiry ? format(new Date(form.incentive_expiry), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={form.incentive_expiry ? new Date(form.incentive_expiry) : undefined} onSelect={(d) => update("incentive_expiry", d ? d.toISOString().split("T")[0] : null)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label className="text-sm">VIP-Only Incentives</Label>
            <Textarea value={form.vip_incentives} onChange={(e) => update("vip_incentives", e.target.value)} placeholder="Additional incentives only for approved clients..." className="rounded-xl" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Parking / Storage */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold">Parking & Storage</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Parking Type</Label>
              <Select value={form.parking_type} onValueChange={(v) => update("parking_type", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Underground">Underground</SelectItem>
                  <SelectItem value="Surface">Surface</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.parking_included} onCheckedChange={(v) => update("parking_included", v)} />
              <Label className="text-sm">Included</Label>
            </div>
            {!form.parking_included && (
              <div>
                <Label className="text-sm">Cost ($)</Label>
                <Input type="number" value={form.parking_cost || ""} onChange={(e) => update("parking_cost", e.target.value ? Number(e.target.value) : null)} className="rounded-xl" />
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.storage_included} onCheckedChange={(v) => update("storage_included", v)} />
              <Label className="text-sm">Storage Included</Label>
            </div>
            {!form.storage_included && (
              <div>
                <Label className="text-sm">Storage Cost ($)</Label>
                <Input type="number" value={form.storage_cost || ""} onChange={(e) => update("storage_cost", e.target.value ? Number(e.target.value) : null)} className="rounded-xl" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={form.locker_included} onCheckedChange={(v) => update("locker_included", v)} />
              <Label className="text-sm">Locker Included</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold">Timeline & Assignment</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Completion Date</Label>
              <Input value={form.completion_date} onChange={(e) => update("completion_date", e.target.value)} placeholder="Q4 2026" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-sm">Construction Stage</Label>
              <Select value={form.construction_stage} onValueChange={(v) => update("construction_stage", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {["pre-construction", "excavation", "foundation", "framing", "finishing", "move-in-ready"].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/-/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.assignment_allowed} onCheckedChange={(v) => update("assignment_allowed", v)} />
              <Label className="text-sm">Assignment Allowed</Label>
            </div>
            {form.assignment_allowed && (
              <div>
                <Label className="text-sm">Assignment Fee</Label>
                <Input value={form.assignment_fee} onChange={(e) => update("assignment_fee", e.target.value)} placeholder="$5,000 or 1%" className="rounded-xl" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrades */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Available Upgrades</h3>
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => update("available_upgrades", [...form.available_upgrades, { name: "", price: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          {form.available_upgrades.map((u, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-sm">Upgrade Name</Label>
                <Input value={u.name} onChange={(e) => {
                  const arr = [...form.available_upgrades];
                  arr[i] = { ...arr[i], name: e.target.value };
                  update("available_upgrades", arr);
                }} placeholder="Premium appliance package" className="rounded-xl" />
              </div>
              <div className="w-32">
                <Label className="text-sm">Price</Label>
                <Input value={u.price} onChange={(e) => {
                  const arr = [...form.available_upgrades];
                  arr[i] = { ...arr[i], price: e.target.value };
                  update("available_upgrades", arr);
                }} placeholder="$5,000" className="rounded-xl" />
              </div>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-red-400" onClick={() => update("available_upgrades", form.available_upgrades.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium">Additional Notes</Label>
        <Textarea value={form.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} placeholder="Any other info..." className="rounded-xl" rows={3} />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-xl">← Back</Button>
        <Button onClick={onNext} className="rounded-xl shadow-gold font-bold px-8">Next →</Button>
      </div>
    </div>
  );
}
