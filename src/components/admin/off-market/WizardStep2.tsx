import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload, Pencil, Trash2, Loader2, Sparkles, ImageIcon, FileUp, X, Download, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { OffMarketUnit } from "./types";

const UNIT_TYPES = ["Studio", "1BR", "1BR+Den", "2BR", "2BR+Den", "3BR", "3BR+Den", "Townhome", "Penthouse", "Other"];

// Map AI-extracted unit types to our standard values
const normalizeUnitType = (raw: string): string => {
  if (!raw) return "";
  const lower = raw.toLowerCase().replace(/\s+/g, "");
  if (/studio/i.test(raw)) return "Studio";
  if (/penthouse/i.test(raw)) return "Penthouse";
  if (/townhome|townhouse/i.test(raw)) return "Townhome";
  if (/3.*bed.*den|3br.*den|3bd.*den/i.test(raw) || lower.includes("3bedroom+den")) return "3BR+Den";
  if (/3.*bed|3br|3bd/i.test(raw) || lower.includes("3bedroom")) return "3BR";
  if (/2.*bed.*den|2br.*den|2bd.*den/i.test(raw) || lower.includes("2bedroom+den")) return "2BR+Den";
  if (/2.*bed|2br|2bd/i.test(raw) || lower.includes("2bedroom")) return "2BR";
  if (/1.*bed.*den|1br.*den|1bd.*den/i.test(raw) || lower.includes("1bedroom+den")) return "1BR+Den";
  if (/1.*bed|1br|1bd/i.test(raw) || lower.includes("1bedroom")) return "1BR";
  return "Other";
};

const emptyUnit: OffMarketUnit = {
  unit_number: "", unit_name: "", unit_type: "", floor_level: null,
  bedrooms: 0, bathrooms: 0, sqft: 0, price: 0,
  parking_included: false, parking_type: "", storage_included: false,
  locker_included: false, orientation: "", view_type: "", floorplan_url: "",
  has_unit_incentive: false, unit_incentive: "", status: "available",
  inclusions: [], display_order: 0,
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500",
  reserved: "bg-yellow-500/10 text-yellow-500",
  sold: "bg-red-500/10 text-red-400",
  hold: "bg-muted text-muted-foreground",
};

interface Props {
  units: OffMarketUnit[];
  setUnits: (u: OffMarketUnit[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function WizardStep2({ units, setUnits, onBack, onNext }: Props) {
  const [editUnit, setEditUnit] = useState<OffMarketUnit | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditUnit({ ...emptyUnit }); setEditIndex(null); setUploadedImage(null); setDialogOpen(true); };
  const openEdit = (i: number) => { setEditUnit({ ...units[i] }); setEditIndex(i); setUploadedImage(units[i].floorplan_url || null); setDialogOpen(true); };

  const saveUnit = () => {
    if (!editUnit) return;
    if (!editUnit.sqft || !editUnit.price || !editUnit.bedrooms) {
      toast.error("Beds, sqft, and price are required"); return;
    }
    const updated = [...units];
    if (editIndex !== null) { updated[editIndex] = editUnit; } else { updated.push(editUnit); }
    setUnits(updated);
    setDialogOpen(false);
    toast.success(editIndex !== null ? "Unit updated" : "Unit added");
  };

  const deleteUnit = (i: number) => { setUnits(units.filter((_, j) => j !== i)); toast.success("Unit removed"); };

  // AI Floor Plan Extraction
  const handleFloorPlanFile = useCallback(async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image (JPG, PNG, WebP) or PDF");
      return;
    }

    setExtracting(true);
    try {
      // Upload to storage first
      const ext = file.name.split(".").pop();
      const path = `floorplans/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("off-market-floorplans").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("off-market-floorplans").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      setUploadedImage(fileUrl);

      // Call AI extraction
      const { data, error } = await supabase.functions.invoke("extract-floor-plan", {
        body: { fileUrl, fileName: file.name },
      });

      if (error) throw error;
      if (data?.data) {
        const extracted = data.data;
        setEditUnit(prev => prev ? {
          ...prev,
          unit_number: extracted.unit_number || prev.unit_number,
          unit_type: normalizeUnitType(extracted.unit_type) || prev.unit_type,
          bedrooms: extracted.beds || prev.bedrooms,
          bathrooms: extracted.baths || prev.bathrooms,
          sqft: extracted.interior_sqft || prev.sqft,
          floor_level: extracted.floor_level || prev.floor_level,
          orientation: extracted.exposure || prev.orientation,
          unit_name: extracted.floor_plan_name || prev.unit_name,
          floorplan_url: fileUrl,
        } : prev);
        toast.success("Floor plan details extracted! Review and edit below.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract floor plan details");
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!dialogOpen) {
        setEditUnit({ ...emptyUnit });
        setEditIndex(null);
        setUploadedImage(null);
        setDialogOpen(true);
      }
      setTimeout(() => handleFloorPlanFile(file), 100);
    }
  }, [dialogOpen, handleFloorPlanFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const downloadTemplate = () => {
    const headers = "unit_number,unit_type,bedrooms,bathrooms,sqft,price,parking_included,storage_included,locker_included,status\n";
    const sample = '101,1BR,1,1,550,450000,false,false,false,available\n';
    const blob = new Blob([headers + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "off-market-units-template.csv"; a.click();
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV is empty"); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const parsed: OffMarketUnit[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const get = (key: string) => vals[headers.indexOf(key)] || "";
        parsed.push({
          ...emptyUnit,
          unit_number: get("unit_number"),
          unit_type: get("unit_type"),
          bedrooms: parseInt(get("bedrooms")) || 0,
          bathrooms: parseFloat(get("bathrooms")) || 0,
          sqft: parseFloat(get("sqft")) || 0,
          price: parseFloat(get("price")) || 0,
          parking_included: get("parking_included") === "true",
          storage_included: get("storage_included") === "true",
          locker_included: get("locker_included") === "true",
          status: get("status") || "available",
          display_order: units.length + i - 1,
        });
      }
      setUnits([...units, ...parsed]);
      toast.success(`${parsed.length} units imported`);
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = "";
  };

  return (
    <div
      className="space-y-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
    >
      {/* AI Drop Zone */}
      <Card className={`rounded-2xl border-2 border-dashed transition-all ${dragOver ? "border-primary bg-primary/10" : "border-border/50"}`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Drop Floor Plan Here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drop a screenshot or PDF of a floor plan and our AI will extract unit details automatically.
            <br />You can review and edit the extracted details before saving.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => {
                openAdd();
                setTimeout(() => fileInputRef.current?.click(), 200);
              }}
            >
              <ImageIcon className="h-4 w-4" /> Upload Image
            </Button>
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => {
                openAdd();
                setTimeout(() => fileInputRef.current?.click(), 200);
              }}
            >
              <FileUp className="h-4 w-4" /> Upload PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={openAdd} className="rounded-xl gap-1.5 shadow-gold font-bold">
          <Plus className="h-4 w-4" /> Add Unit Manually
        </Button>
        <Button variant="outline" className="rounded-xl gap-1.5" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> CSV Template
        </Button>
        <label>
          <Button variant="outline" className="rounded-xl gap-1.5" asChild>
            <span><Upload className="h-4 w-4" /> Upload CSV</span>
          </Button>
          <input ref={csvRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
        </label>
      </div>

      {/* Units list */}
      {units.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">{units.length} Unit{units.length !== 1 ? "s" : ""} Added</h3>
          <div className="grid gap-3">
            {units.map((u, i) => (
              <Card key={i} className="rounded-xl border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  {u.floorplan_url && u.floorplan_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                    <img src={u.floorplan_url} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white" alt="" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">Unit {u.unit_number}</p>
                      {u.unit_name && <span className="text-xs text-muted-foreground">({u.unit_name})</span>}
                      <Badge className={`${STATUS_COLORS[u.status]} border-0 text-xs rounded-lg capitalize ml-auto`}>{u.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{u.unit_type || "—"}</span>
                      <span>{u.bedrooms}bd / {u.bathrooms}ba</span>
                      <span>{u.sqft.toLocaleString()} sqft</span>
                      <span className="text-primary font-semibold">${u.price.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {u.parking_included && <Badge variant="outline" className="text-[10px]">Parking</Badge>}
                      {u.storage_included && <Badge variant="outline" className="text-[10px]">Storage</Badge>}
                      {u.locker_included && <Badge variant="outline" className="text-[10px]">Locker</Badge>}
                      {u.inclusions?.includes("AC") && <Badge variant="outline" className="text-[10px]">AC</Badge>}
                      {u.has_unit_incentive && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Incentive</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={() => deleteUnit(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Unit" : "Add Unit"}</DialogTitle>
          </DialogHeader>
          {editUnit && (
            <div className="space-y-4">
              {/* AI Upload area inside dialog */}
              <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center">
                {extracting ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is extracting floor plan details...</span>
                  </div>
                ) : uploadedImage ? (
                  <div className="relative">
                    <img src={uploadedImage} className="max-h-48 mx-auto rounded-lg object-contain bg-white p-2" alt="Floor plan" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => { setUploadedImage(null); setEditUnit({ ...editUnit, floorplan_url: "" }); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="py-4">
                      <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Drop floor plan image/PDF here</p>
                      <p className="text-xs text-muted-foreground">AI will auto-fill unit details</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFloorPlanFile(f);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Unit fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Unit Number *</Label>
                  <Input value={editUnit.unit_number} onChange={e => setEditUnit({ ...editUnit, unit_number: e.target.value })} className="rounded-xl" placeholder="101" />
                </div>
                <div>
                  <Label className="text-sm">Floor Plan Name</Label>
                  <Input value={editUnit.unit_name} onChange={e => setEditUnit({ ...editUnit, unit_name: e.target.value })} className="rounded-xl" placeholder="Plan A" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Unit Type</Label>
                  <Select value={editUnit.unit_type} onValueChange={v => setEditUnit({ ...editUnit, unit_type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{UNIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Asking Price ($) *</Label>
                  <Input type="number" value={editUnit.price || ""} onChange={e => setEditUnit({ ...editUnit, price: Number(e.target.value) })} className="rounded-xl" placeholder="450000" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Beds *</Label>
                  <Input type="number" value={editUnit.bedrooms || ""} onChange={e => setEditUnit({ ...editUnit, bedrooms: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">Baths</Label>
                  <Input type="number" step="0.5" value={editUnit.bathrooms || ""} onChange={e => setEditUnit({ ...editUnit, bathrooms: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">SqFt *</Label>
                  <Input type="number" value={editUnit.sqft || ""} onChange={e => setEditUnit({ ...editUnit, sqft: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">Floor</Label>
                  <Input type="number" value={editUnit.floor_level ?? ""} onChange={e => setEditUnit({ ...editUnit, floor_level: e.target.value ? Number(e.target.value) : null })} className="rounded-xl" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold block">Included with Unit</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={editUnit.parking_included} onCheckedChange={v => setEditUnit({ ...editUnit, parking_included: v })} />
                    <Label className="text-sm">Parking</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editUnit.storage_included} onCheckedChange={v => setEditUnit({ ...editUnit, storage_included: v })} />
                    <Label className="text-sm">Storage</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editUnit.locker_included} onCheckedChange={v => setEditUnit({ ...editUnit, locker_included: v })} />
                    <Label className="text-sm">Locker</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editUnit.inclusions.includes("AC")}
                      onCheckedChange={v => {
                        const incl = v
                          ? [...editUnit.inclusions, "AC"]
                          : editUnit.inclusions.filter(i => i !== "AC");
                        setEditUnit({ ...editUnit, inclusions: incl });
                      }}
                    />
                    <Label className="text-sm">AC</Label>
                  </div>
                </div>
              </div>

              {/* Special offerings / incentives */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={editUnit.has_unit_incentive} onCheckedChange={v => setEditUnit({ ...editUnit, has_unit_incentive: v })} />
                  <Label className="text-sm font-semibold">Special Offering / Incentive</Label>
                </div>
                {editUnit.has_unit_incentive && (
                  <Input value={editUnit.unit_incentive} onChange={e => setEditUnit({ ...editUnit, unit_incentive: e.target.value })} placeholder="e.g., Free parking upgrade, $5K closing credit..." className="rounded-xl" />
                )}
              </div>

              {/* Custom inclusions */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Additional Inclusions</Label>
                <div className="flex flex-wrap gap-2">
                  {editUnit.inclusions.filter(i => i !== "AC").map((inc, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 rounded-lg">
                      {inc}
                      <button onClick={() => setEditUnit({ ...editUnit, inclusions: editUnit.inclusions.filter(i => i !== inc) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom inclusion..."
                    className="rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!editUnit.inclusions.includes(val)) {
                          setEditUnit({ ...editUnit, inclusions: [...editUnit.inclusions, val] });
                        }
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={saveUnit} className="rounded-xl shadow-gold font-bold">
                  {editIndex !== null ? "Update Unit" : "Add Unit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-xl">← Back</Button>
        <Button onClick={onNext} disabled={units.length === 0} className="rounded-xl shadow-gold font-bold px-8">
          Next: Preview →
        </Button>
      </div>
    </div>
  );
}
