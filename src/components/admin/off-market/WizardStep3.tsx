import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Plus, Upload, Download, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { OffMarketUnit } from "./types";

const UNIT_TYPES = ["Studio", "1BR", "1BR+Den", "2BR", "2BR+Den", "3BR", "3BR+Den", "Townhome", "Penthouse", "Other"];
const ORIENTATIONS = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];
const INCLUSION_OPTIONS = ["AC", "Appliance Package", "Flooring Upgrade", "Window Coverings", "Smart Home", "EV Charger"];
const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500",
  reserved: "bg-yellow-500/10 text-yellow-500",
  sold: "bg-red-500/10 text-red-400",
  hold: "bg-muted text-muted-foreground",
};

const emptyUnit: OffMarketUnit = {
  unit_number: "", unit_name: "", unit_type: "", floor_level: null,
  bedrooms: 0, bathrooms: 0, sqft: 0, price: 0,
  parking_included: false, parking_type: "", storage_included: false,
  locker_included: false, orientation: "", view_type: "", floorplan_url: "",
  has_unit_incentive: false, unit_incentive: "", status: "available",
  inclusions: [], display_order: 0,
};

interface Props {
  units: OffMarketUnit[];
  setUnits: (u: OffMarketUnit[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function WizardStep3({ units, setUnits, onBack, onNext }: Props) {
  const [editUnit, setEditUnit] = useState<OffMarketUnit | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const csvRef = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditUnit({ ...emptyUnit }); setEditIndex(null); setDialogOpen(true); };
  const openEdit = (i: number) => { setEditUnit({ ...units[i] }); setEditIndex(i); setDialogOpen(true); };

  const saveUnit = () => {
    if (!editUnit) return;
    if (!editUnit.unit_number || !editUnit.sqft || !editUnit.price || !editUnit.bedrooms) {
      toast.error("Unit #, beds, sqft, and price are required"); return;
    }
    const updated = [...units];
    if (editIndex !== null) { updated[editIndex] = editUnit; } else { updated.push(editUnit); }
    setUnits(updated);
    setDialogOpen(false);
    toast.success(editIndex !== null ? "Unit updated" : "Unit added");
  };

  const deleteUnit = (i: number) => { setUnits(units.filter((_, j) => j !== i)); toast.success("Unit removed"); };

  const bulkAction = (status: string) => {
    const updated = units.map((u, i) => selectedRows.has(i) ? { ...u, status } : u);
    setUnits(updated);
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} units updated`);
  };

  const bulkDelete = () => {
    setUnits(units.filter((_, i) => !selectedRows.has(i)));
    setSelectedRows(new Set());
    toast.success("Units deleted");
  };

  const downloadTemplate = () => {
    const headers = "unit_number,unit_type,floor_level,bedrooms,bathrooms,sqft,price,parking_included,storage_included,locker_included,orientation,view_type,status,inclusions\n";
    const sample = '101,1BR,1,1,1,550,450000,false,false,false,SE,City View,available,"AC,Smart Home"\n';
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
          floor_level: get("floor_level") ? parseInt(get("floor_level")) : null,
          bedrooms: parseInt(get("bedrooms")) || 0,
          bathrooms: parseFloat(get("bathrooms")) || 0,
          sqft: parseFloat(get("sqft")) || 0,
          price: parseFloat(get("price")) || 0,
          parking_included: get("parking_included") === "true",
          storage_included: get("storage_included") === "true",
          locker_included: get("locker_included") === "true",
          orientation: get("orientation"),
          view_type: get("view_type"),
          status: get("status") || "available",
          inclusions: get("inclusions") ? get("inclusions").split(",").map(s => s.trim()) : [],
          display_order: i - 1,
        });
      }
      setUnits([...units, ...parsed]);
      toast.success(`${parsed.length} units imported`);
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = "";
  };

  const toggleRow = (i: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={openAdd} className="rounded-xl gap-1.5 shadow-gold font-bold">
          <Plus className="h-4 w-4" /> Add Unit
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

      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => bulkAction("sold")}>Mark Sold</Button>
          <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => bulkAction("reserved")}>Mark Reserved</Button>
          <Button size="sm" variant="outline" className="rounded-lg text-xs text-red-400" onClick={bulkDelete}>Delete</Button>
        </div>
      )}

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Unit #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Beds</TableHead>
              <TableHead>Baths</TableHead>
              <TableHead>SqFt</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>$/SqFt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!units.length ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No units added yet. Click "Add Unit" or upload a CSV.
                </TableCell>
              </TableRow>
            ) : (
              units.map((u, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Checkbox checked={selectedRows.has(i)} onCheckedChange={() => toggleRow(i)} />
                  </TableCell>
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell>{u.unit_type || "—"}</TableCell>
                  <TableCell>{u.bedrooms}</TableCell>
                  <TableCell>{u.bathrooms}</TableCell>
                  <TableCell>{u.sqft.toLocaleString()}</TableCell>
                  <TableCell className="text-primary font-semibold">${u.price.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">${u.sqft > 0 ? Math.round(u.price / u.sqft).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[u.status]} border-0 text-xs rounded-lg capitalize`}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={() => deleteUnit(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Unit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Unit" : "Add Unit"}</DialogTitle>
          </DialogHeader>
          {editUnit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Unit Number *</Label>
                  <Input value={editUnit.unit_number} onChange={e => setEditUnit({ ...editUnit, unit_number: e.target.value })} className="rounded-xl" placeholder="101" />
                </div>
                <div>
                  <Label className="text-sm">Unit Type</Label>
                  <Select value={editUnit.unit_type} onValueChange={v => setEditUnit({ ...editUnit, unit_type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{UNIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Floor</Label>
                  <Input type="number" value={editUnit.floor_level ?? ""} onChange={e => setEditUnit({ ...editUnit, floor_level: e.target.value ? Number(e.target.value) : null })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">Beds *</Label>
                  <Input type="number" value={editUnit.bedrooms} onChange={e => setEditUnit({ ...editUnit, bedrooms: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">Baths *</Label>
                  <Input type="number" step="0.5" value={editUnit.bathrooms} onChange={e => setEditUnit({ ...editUnit, bathrooms: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">SqFt *</Label>
                  <Input type="number" value={editUnit.sqft} onChange={e => setEditUnit({ ...editUnit, sqft: Number(e.target.value) })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Price ($) *</Label>
                  <Input type="number" value={editUnit.price} onChange={e => setEditUnit({ ...editUnit, price: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm">$/SqFt (auto)</Label>
                  <Input value={editUnit.sqft > 0 ? `$${Math.round(editUnit.price / editUnit.sqft).toLocaleString()}` : "—"} disabled className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Orientation</Label>
                  <Select value={editUnit.orientation} onValueChange={v => setEditUnit({ ...editUnit, orientation: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{ORIENTATIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">View Type</Label>
                  <Input value={editUnit.view_type} onChange={e => setEditUnit({ ...editUnit, view_type: e.target.value })} className="rounded-xl" placeholder="Mountain View" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Switch checked={editUnit.parking_included} onCheckedChange={v => setEditUnit({ ...editUnit, parking_included: v })} /><Label className="text-sm">Parking</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editUnit.storage_included} onCheckedChange={v => setEditUnit({ ...editUnit, storage_included: v })} /><Label className="text-sm">Storage</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editUnit.locker_included} onCheckedChange={v => setEditUnit({ ...editUnit, locker_included: v })} /><Label className="text-sm">Locker</Label></div>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={editUnit.status} onValueChange={v => setEditUnit({ ...editUnit, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Inclusions</Label>
                <div className="flex flex-wrap gap-2">
                  {INCLUSION_OPTIONS.map(opt => (
                    <Badge
                      key={opt}
                      variant={editUnit.inclusions.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer rounded-lg"
                      onClick={() => {
                        const has = editUnit.inclusions.includes(opt);
                        setEditUnit({
                          ...editUnit,
                          inclusions: has ? editUnit.inclusions.filter(i => i !== opt) : [...editUnit.inclusions, opt],
                        });
                      }}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editUnit.has_unit_incentive} onCheckedChange={v => setEditUnit({ ...editUnit, has_unit_incentive: v })} />
                <Label className="text-sm">Unit-Specific Incentive</Label>
              </div>
              {editUnit.has_unit_incentive && (
                <Input value={editUnit.unit_incentive} onChange={e => setEditUnit({ ...editUnit, unit_incentive: e.target.value })} placeholder="Special incentive for this unit..." className="rounded-xl" />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={saveUnit} className="rounded-xl shadow-gold font-bold">Save Unit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-xl">← Back</Button>
        <Button onClick={onNext} className="rounded-xl shadow-gold font-bold px-8">Next →</Button>
      </div>
    </div>
  );
}
