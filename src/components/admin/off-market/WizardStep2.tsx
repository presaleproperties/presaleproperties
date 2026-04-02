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
import { Plus, Upload, Pencil, Trash2, Loader2, Sparkles, FileUp, X, Download, Building2, CheckCircle2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { OffMarketUnit } from "./types";

const UNIT_TYPES = ["Studio", "1BR", "1BR+Den", "2BR", "2BR+Den", "3BR", "3BR+Den", "Townhome", "Penthouse", "Other"];

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
  available: "bg-emerald-500/10 text-emerald-500",
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
  const [isPdf, setIsPdf] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditUnit({ ...emptyUnit }); setEditIndex(null); setUploadedImage(null); setLocalPreview(null); setIsPdf(false); setDialogOpen(true); };
  const openEdit = (i: number) => {
    const u = units[i];
    setEditUnit({ ...u });
    setEditIndex(i);
    setUploadedImage(u.floorplan_url || null);
    setLocalPreview(null);
    setIsPdf(u.floorplan_url ? u.floorplan_url.toLowerCase().includes('.pdf') : false);
    setDialogOpen(true);
  };

  const saveUnit = () => {
    if (!editUnit) return;
    if (!editUnit.sqft || !editUnit.price || !editUnit.bedrooms) {
      toast.error("Beds, sqft, and price are required"); return;
    }
    const updated = [...units];
    if (editIndex !== null) { updated[editIndex] = editUnit; } else { updated.push(editUnit); }
    setUnits(updated);
    setDialogOpen(false);
    setLocalPreview(null);
    toast.success(editIndex !== null ? "Unit updated" : "Unit added");
  };

  const deleteUnit = (i: number) => { setUnits(units.filter((_, j) => j !== i)); toast.success("Unit removed"); };

  const handleFloorPlanFile = useCallback(async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image (JPG, PNG, WebP) or PDF");
      return;
    }

    const filePdf = file.type === "application/pdf";
    setIsPdf(filePdf);

    // Show instant local preview for both images and PDFs
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    setExtracting(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `floorplans/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("off-market-floorplans").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("off-market-floorplans").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      setUploadedImage(fileUrl);

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
        toast.success("✨ AI extracted floor plan details — review below");
      } else {
        setEditUnit(prev => prev ? { ...prev, floorplan_url: fileUrl } : prev);
        toast.info("Floor plan uploaded — fill in unit details below");
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
        setLocalPreview(null);
        setIsPdf(false);
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

  // Determine what to show as floor plan preview
  const previewUrl = localPreview || uploadedImage;
  const showPdfPreview = isPdf && !!previewUrl;
  const pdfPreviewUrl = previewUrl ? `${previewUrl}#toolbar=0&navpanes=0&scrollbar=0` : "";

  return (
    <div
      className="space-y-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
    >
      {/* Hero Drop Zone */}
      <label className="block cursor-pointer group">
        <Card className={`rounded-2xl border-2 border-dashed transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/10 scale-[1.01] shadow-lg"
            : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
        }`}>
          <CardContent className="p-10 text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-200 ${
              dragOver ? "bg-primary/20 scale-110" : "bg-primary/10 group-hover:bg-primary/15"
            }`}>
              <Sparkles className={`h-10 w-10 text-primary transition-transform duration-200 ${dragOver ? "scale-110" : ""}`} />
            </div>
            <h3 className="font-bold text-xl mb-2">Drop Floor Plan Here</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Drag & drop an image or PDF — AI auto-fills unit details
            </p>
            <p className="text-xs text-muted-foreground/70">
              Supports JPG, PNG, WebP, PDF
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-xl group-hover:bg-primary/15 transition-colors">
                <ImageIcon className="h-4 w-4" /> Browse Files
              </span>
            </div>
          </CardContent>
        </Card>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (!dialogOpen) {
                setEditUnit({ ...emptyUnit });
                setEditIndex(null);
                setUploadedImage(null);
                setLocalPreview(null);
                setIsPdf(false);
                setDialogOpen(true);
              }
              setTimeout(() => handleFloorPlanFile(f), 100);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </label>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={openAdd} variant="outline" className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Add Manually
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
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{units.length} Unit{units.length !== 1 ? "s" : ""} Added</h3>
            <Badge variant="secondary" className="text-xs">{units.filter(u => u.status === "available").length} available</Badge>
          </div>
          <div className="grid gap-2">
            {units.map((u, i) => (
              <Card key={i} className="rounded-xl border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {u.floorplan_url ? (
                    <img
                      src={u.floorplan_url}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white border border-border/30"
                      alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm">{u.unit_number ? `Unit ${u.unit_number}` : u.unit_name || "Unit"}</p>
                      {u.unit_type && <Badge variant="outline" className="text-[10px] font-normal">{u.unit_type}</Badge>}
                      <Badge className={`${STATUS_COLORS[u.status]} border-0 text-[10px] rounded-md capitalize ml-auto`}>{u.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-muted-foreground">
                      <span>{u.bedrooms}bd / {u.bathrooms}ba</span>
                      <span>{u.sqft.toLocaleString()} sqft</span>
                      <span className="text-primary font-semibold">${u.price.toLocaleString()}</span>
                    </div>
                    {(u.parking_included || u.storage_included || u.has_unit_incentive) && (
                      <div className="flex gap-1.5 mt-1">
                        {u.parking_included && <Badge variant="outline" className="text-[9px] h-4 px-1.5">Parking</Badge>}
                        {u.storage_included && <Badge variant="outline" className="text-[9px] h-4 px-1.5">Storage</Badge>}
                        {u.has_unit_incentive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">{u.unit_incentive || "Incentive"}</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive" onClick={() => deleteUnit(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setLocalPreview(null); } setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editIndex !== null ? "Edit Unit" : "Add Unit"}
              {extracting && <Badge variant="secondary" className="text-xs gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> AI extracting...</Badge>}
            </DialogTitle>
          </DialogHeader>
          {editUnit && (
            <div className="space-y-5">
              {/* Floor plan preview / upload area */}
              <div
                className={`rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                  previewUrl ? "border-primary/30 bg-primary/5" : "border-border/50 hover:border-primary/30"
                }`}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFloorPlanFile(file);
                }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {extracting && !previewUrl ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">AI is reading your floor plan...</p>
                      <p className="text-xs text-muted-foreground">This takes a few seconds</p>
                    </div>
                  </div>
                ) : previewUrl && !showPdfPreview ? (
                  <div className="relative group">
                    <img src={previewUrl} className="w-full max-h-80 object-contain bg-white p-3 rounded-t-xl" alt="Floor plan" />
                    {extracting && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-t-xl">
                        <div className="flex items-center gap-2 bg-background/90 rounded-lg px-4 py-2 shadow-lg">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm font-medium">AI extracting details...</span>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => { setUploadedImage(null); setLocalPreview(null); setEditUnit({ ...editUnit!, floorplan_url: "" }); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    {!extracting && (
                      <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/60">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Floor plan uploaded
                      </div>
                    )}
                  </div>
                ) : showPdfPreview ? (
                  <div className="relative group bg-card">
                    <div className="border-b border-border/50 px-3 py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileUp className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="text-sm font-medium truncate">PDF Floor Plan Preview</p>
                      </div>
                      {!extracting && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Ready
                        </div>
                      )}
                    </div>
                    <div className="relative bg-white">
                      <iframe
                        src={pdfPreviewUrl}
                        title="Floor plan PDF preview"
                        className="w-full h-[420px]"
                      />
                      {extracting && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <div className="flex items-center gap-2 bg-background/90 rounded-lg px-4 py-2 shadow-lg">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium">AI extracting details...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => { setUploadedImage(null); setLocalPreview(null); setIsPdf(false); setEditUnit({ ...editUnit!, floorplan_url: "" }); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-6 text-center hover:bg-muted/30 transition-colors">
                    <Sparkles className="h-7 w-7 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Drop floor plan or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI auto-fills unit details • JPG, PNG, PDF</p>
                    <input
                      ref={dialogFileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFloorPlanFile(f);
                        if (dialogFileRef.current) dialogFileRef.current.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Unit fields - grouped logically */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit Number</Label>
                    <Input value={editUnit.unit_number} onChange={e => setEditUnit({ ...editUnit, unit_number: e.target.value })} className="rounded-xl mt-1" placeholder="e.g. 101" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Plan Name</Label>
                    <Input value={editUnit.unit_name} onChange={e => setEditUnit({ ...editUnit, unit_name: e.target.value })} className="rounded-xl mt-1" placeholder="e.g. Plan A" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit Type</Label>
                    <Select value={editUnit.unit_type} onValueChange={v => setEditUnit({ ...editUnit, unit_type: v })}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>{UNIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Floor</Label>
                    <Input type="number" value={editUnit.floor_level ?? ""} onChange={e => setEditUnit({ ...editUnit, floor_level: e.target.value ? Number(e.target.value) : null })} className="rounded-xl mt-1" placeholder="e.g. 12" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size & Pricing</p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Beds <span className="text-primary">*</span></Label>
                    <Input type="number" value={editUnit.bedrooms || ""} onChange={e => setEditUnit({ ...editUnit, bedrooms: Number(e.target.value) })} className="rounded-xl mt-1" placeholder="1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Baths</Label>
                    <Input type="number" step="0.5" value={editUnit.bathrooms || ""} onChange={e => setEditUnit({ ...editUnit, bathrooms: Number(e.target.value) })} className="rounded-xl mt-1" placeholder="1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SqFt <span className="text-primary">*</span></Label>
                    <Input type="number" value={editUnit.sqft || ""} onChange={e => setEditUnit({ ...editUnit, sqft: Number(e.target.value) })} className="rounded-xl mt-1" placeholder="550" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Price <span className="text-primary">*</span></Label>
                    <Input type="number" value={editUnit.price || ""} onChange={e => setEditUnit({ ...editUnit, price: Number(e.target.value) })} className="rounded-xl mt-1" placeholder="450000" />
                  </div>
                </div>
              </div>

              {/* Toggles - compact row */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inclusions</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {[
                    { key: "parking_included" as const, label: "Parking" },
                    { key: "storage_included" as const, label: "Storage" },
                    { key: "locker_included" as const, label: "Locker" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={editUnit[key]} onCheckedChange={v => setEditUnit({ ...editUnit, [key]: v })} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={editUnit.inclusions.includes("AC")}
                      onCheckedChange={v => {
                        const incl = v ? [...editUnit.inclusions, "AC"] : editUnit.inclusions.filter(i => i !== "AC");
                        setEditUnit({ ...editUnit, inclusions: incl });
                      }}
                    />
                    <span className="text-sm">AC</span>
                  </label>
                </div>
              </div>

              {/* Incentive */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={editUnit.has_unit_incentive} onCheckedChange={v => setEditUnit({ ...editUnit, has_unit_incentive: v })} />
                  <span className="text-sm font-medium">Special Offering / Incentive</span>
                </label>
                {editUnit.has_unit_incentive && (
                  <Input value={editUnit.unit_incentive} onChange={e => setEditUnit({ ...editUnit, unit_incentive: e.target.value })} placeholder="e.g., Free parking upgrade, $5K closing credit..." className="rounded-xl" />
                )}
              </div>

              {/* Custom inclusions */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Inclusions</Label>
                <div className="flex flex-wrap gap-1.5">
                  {editUnit.inclusions.filter(i => i !== "AC").map((inc, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 rounded-lg text-xs">
                      {inc}
                      <button onClick={() => setEditUnit({ ...editUnit, inclusions: editUnit.inclusions.filter(i => i !== inc) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type and press Enter to add..."
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button variant="outline" onClick={() => { setDialogOpen(false); setLocalPreview(null); }} className="rounded-xl">Cancel</Button>
                <Button onClick={saveUnit} className="rounded-xl shadow-gold font-bold px-6" disabled={extracting}>
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editIndex !== null ? "Update Unit" : "Add Unit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={onBack} className="rounded-xl">← Back</Button>
        <div className="flex items-center gap-3">
          {units.length > 0 && (
            <p className="text-sm text-muted-foreground">{units.length} unit{units.length !== 1 ? "s" : ""} ready</p>
          )}
          <Button onClick={onNext} disabled={units.length === 0} className="rounded-xl shadow-gold font-bold px-8">
            Next: Preview →
          </Button>
        </div>
      </div>
    </div>
  );
}
