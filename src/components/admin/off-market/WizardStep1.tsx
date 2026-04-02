import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Search, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { OffMarketListingForm } from "./types";

const ProjectLocationMap = lazy(() => import("./ProjectLocationMap"));

interface Props {
  form: OffMarketListingForm;
  setForm: (f: OffMarketListingForm) => void;
  projectPreview: any;
  setProjectPreview: (p: any) => void;
  onNext: () => void;
}

function DraggableMarker({ position, onMove }: { position: [number, number]; onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return <Marker position={position} />;
}

export function WizardStep1({ form, setForm, projectPreview, setProjectPreview, onNext }: Props) {
  const [search, setSearch] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([49.2827, -123.1207]);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["presale-projects-search", search],
    queryFn: async () => {
      let q = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, developer_name, developer_id, project_type, completion_year, featured_image, map_lat, map_lng, address, deposit_structure, incentives, starting_price, price_range, highlights, amenities")
        .order("name");
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q.limit(20);
      return data || [];
    },
  });

  const selectProject = (p: any) => {
    setForm({
      ...form,
      linked_project_slug: p.slug,
      linked_project_name: p.name,
      developer_name: p.developer_name || "",
      developer_id: p.developer_id || null,
      deposit_structure: p.deposit_structure || form.deposit_structure,
      incentives: p.incentives || form.incentives,
      completion_date: p.completion_year ? `${p.completion_year}` : form.completion_date,
    });
    setProjectPreview(p);

    // Set map position
    if (p.map_lat && p.map_lng) {
      const lat = Number(p.map_lat);
      const lng = Number(p.map_lng);
      setMapCenter([lat, lng]);
      setMarkerPos([lat, lng]);
    }
  };

  const update = (key: keyof OffMarketListingForm, value: any) => setForm({ ...form, [key]: value });
  const isSelected = !!form.linked_project_name;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Search Projects on Our Website</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Type project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Project list */}
      <div className="grid gap-2 max-h-[300px] overflow-y-auto">
        {projects?.map((p: any) => (
          <Card
            key={p.id}
            className={`rounded-xl cursor-pointer transition-all border-border/50 hover:border-primary/40 ${
              form.linked_project_slug === p.slug ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => selectProject(p)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {p.featured_image ? (
                <img src={p.featured_image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.developer_name} · {p.city}</p>
              </div>
              {form.linked_project_slug === p.slug && (
                <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add new project link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Don't see the project?</p>
        <Button variant="outline" className="rounded-xl gap-2" asChild>
          <a href="/admin/projects/new" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Add New Project
          </a>
        </Button>
      </div>

      {/* Selected project preview with auto-populated details */}
      {projectPreview && (
        <>
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-3">Selected Project</h3>
              <div className="flex gap-4">
                {projectPreview.featured_image && (
                  <img src={projectPreview.featured_image} className="w-24 h-24 rounded-xl object-cover" alt="" />
                )}
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold">{projectPreview.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {projectPreview.developer_name || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {projectPreview.neighborhood ? `${projectPreview.neighborhood}, ` : ""}{projectPreview.city}
                  </p>
                  {projectPreview.completion_year && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {projectPreview.completion_year}
                    </p>
                  )}
                  {projectPreview.project_type && (
                    <Badge variant="outline" className="text-xs capitalize">{projectPreview.project_type}</Badge>
                  )}
                </div>
              </div>

              {/* Auto-populated fields */}
              {(projectPreview.deposit_structure || projectPreview.incentives || projectPreview.starting_price) && (
                <div className="mt-4 pt-4 border-t border-primary/20 grid sm:grid-cols-2 gap-3 text-sm">
                  {projectPreview.deposit_structure && (
                    <div>
                      <span className="text-muted-foreground text-xs">Deposit Structure</span>
                      <p className="font-medium">{projectPreview.deposit_structure}</p>
                    </div>
                  )}
                  {projectPreview.incentives && (
                    <div>
                      <span className="text-muted-foreground text-xs">Incentives</span>
                      <p className="font-medium">{projectPreview.incentives}</p>
                    </div>
                  )}
                  {projectPreview.starting_price && (
                    <div>
                      <span className="text-muted-foreground text-xs">Starting Price</span>
                      <p className="font-medium">${Number(projectPreview.starting_price).toLocaleString()}</p>
                    </div>
                  )}
                  {projectPreview.price_range && (
                    <div>
                      <span className="text-muted-foreground text-xs">Price Range</span>
                      <p className="font-medium">{projectPreview.price_range}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map to confirm pin */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Confirm Project Location
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Click the map to adjust the pin location if needed.</p>
              <div className="rounded-xl overflow-hidden border border-border/50 h-[250px]">
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {markerPos && (
                    <DraggableMarker
                      position={markerPos}
                      onMove={(lat, lng) => setMarkerPos([lat, lng])}
                    />
                  )}
                </MapContainer>
              </div>
              {projectPreview.address && (
                <p className="text-xs text-muted-foreground mt-2">{projectPreview.address}</p>
              )}
            </CardContent>
          </Card>

          {/* Collapsible listing details */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5">
              <button
                className="flex items-center justify-between w-full"
                onClick={() => setShowDetails(!showDetails)}
              >
                <h3 className="font-bold">Listing Details (Optional)</h3>
                {showDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {showDetails && (
                <div className="mt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Deposit Structure</Label>
                      <Input value={form.deposit_structure} onChange={(e) => update("deposit_structure", e.target.value)} placeholder="e.g., 5% on signing, 5% at 6 months" className="rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-sm">Deposit %</Label>
                      <Input type="number" value={form.deposit_percentage || ""} onChange={(e) => update("deposit_percentage", e.target.value ? Number(e.target.value) : null)} placeholder="15" className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Current Incentives</Label>
                    <Textarea value={form.incentives} onChange={(e) => update("incentives", e.target.value)} placeholder="Free AC upgrade + 1 year free strata..." className="rounded-xl" rows={2} />
                  </div>
                  <div>
                    <Label className="text-sm">VIP-Only Incentives</Label>
                    <Textarea value={form.vip_incentives} onChange={(e) => update("vip_incentives", e.target.value)} placeholder="Additional VIP incentives..." className="rounded-xl" rows={2} />
                  </div>
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
                  <div>
                    <Label className="text-sm">Additional Notes</Label>
                    <Textarea value={form.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} placeholder="Any other info..." className="rounded-xl" rows={2} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isSelected} className="rounded-xl shadow-gold font-bold px-8">
          Next: Add Units →
        </Button>
      </div>
    </div>
  );
}
