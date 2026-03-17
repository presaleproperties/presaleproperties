import { MapPin, Train, School, ShoppingBag, Clock, Car, Footprints, TreePine, Stethoscope } from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getNeighborhoodData } from "@/components/projects/LocationDeepDive";

export interface ProximityHighlight {
  icon: string;
  label: string;
  distance: string;
}

interface DeckLocationSectionProps {
  address?: string;
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  highlights: ProximityHighlight[];
}

// ── Overpass API (same as ProjectLocationMiniMap) ──────────────────────────
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const amenityCategories = [
  { key: "schools",    label: "Schools",  icon: School,       color: "#4F46E5" },
  { key: "transit",    label: "Transit",  icon: Train,        color: "#0891B2" },
  { key: "parks",      label: "Parks",    icon: TreePine,     color: "#16A34A" },
  { key: "grocery",    label: "Shops",    icon: ShoppingBag,  color: "#D97706" },
  { key: "healthcare", label: "Health",   icon: Stethoscope,  color: "#DC2626" },
];

function buildOverpassQuery(lat: number, lon: number): string {
  const bbox = `(around:1000,${lat},${lon})`;
  const queries = [
    `node["amenity"~"school|kindergarten"]${bbox};`,
    `way["amenity"~"school|kindergarten"]${bbox};`,
    `node["shop"~"supermarket|grocery|convenience"]${bbox};`,
    `node["public_transport"="station"]${bbox};`,
    `node["railway"~"station|halt|tram_stop"]${bbox};`,
    `node["highway"="bus_stop"]${bbox};`,
    `node["leisure"~"park|playground"]${bbox};`,
    `way["leisure"~"park|playground"]${bbox};`,
    `node["amenity"~"hospital|clinic|doctors|pharmacy"]${bbox};`,
  ];
  return `[out:json][timeout:10];(${queries.join("")});out center 50;`;
}

function categorizePlace(tags: Record<string, string>) {
  if (tags.amenity === "school" || tags.amenity === "kindergarten") return { category: "schools", type: tags.amenity };
  if (tags.shop === "supermarket" || tags.shop === "grocery" || tags.shop === "convenience") return { category: "grocery", type: tags.shop };
  if (tags.public_transport || tags.railway || tags.highway === "bus_stop") return { category: "transit", type: tags.railway || tags.public_transport || "bus_stop" };
  if (tags.leisure === "park" || tags.leisure === "playground") return { category: "parks", type: tags.leisure };
  if (["hospital", "clinic", "doctors", "pharmacy"].includes(tags.amenity)) return { category: "healthcare", type: tags.amenity };
  return { category: "other", type: "unknown" };
}

// ── Inline map (same logic as ProjectLocationMiniMap) ─────────────────────
function DeckMap({ lat, lng, projectName, address }: { lat: number; lng: number; projectName: string; address?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["schools", "transit", "parks", "grocery", "healthcare"]));

  const fetchNearbyPlaces = useCallback(async () => {
    if (placesLoaded) return;
    setIsLoading(true);
    try {
      const query = buildOverpassQuery(lat, lng);
      const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      if (!res.ok) throw new Error("overpass failed");
      const data = await res.json();
      const places = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const { category, type } = categorizePlace(el.tags || {});
          return { id: el.id, name: el.tags.name, lat: el.lat || el.center?.lat, lon: el.lon || el.center?.lon, type, category };
        })
        .filter((p: any) => p.lat && p.lon && p.category !== "other");
      setNearbyPlaces(places);
      setPlacesLoaded(true);
    } catch (e) {
      console.error("overpass error", e);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng, placesLoaded]);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng], zoom: 15,
      zoomControl: true, attributionControl: false,
      scrollWheelZoom: false, dragging: true, touchZoom: true,
    });
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Project pin
    const projectIcon = L.divIcon({
      html: `<div class="deckmap-pin"><div class="deckmap-pin-inner"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg></div></div>`,
      className: "deckmap-pin-icon",
      iconSize: [32, 40], iconAnchor: [16, 40],
    });
    L.marker([lat, lng], { icon: projectIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<div class="deckmap-popup"><div class="deckmap-popup-name">${projectName}</div>${address ? `<div class="deckmap-popup-address">${address}</div>` : ""}</div>`, { closeButton: false, className: "deckmap-popup-container" });

    mapRef.current = map;
    fetchNearbyPlaces();

    return () => { map.remove(); mapRef.current = null; markersLayerRef.current = null; };
  }, [lat, lng, projectName, address, fetchNearbyPlaces]);

  // Render amenity markers when data or filters change
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    nearbyPlaces
      .filter(p => activeCategories.has(p.category))
      .forEach(place => {
        const cat = amenityCategories.find(c => c.key === place.category);
        if (!cat) return;
        const icon = L.divIcon({
          html: `<div class="amenity-dot" style="background:${cat.color}"><span class="amenity-dot-inner"></span></div>`,
          className: "amenity-dot-icon", iconSize: [12, 12], iconAnchor: [6, 6],
        });
        L.marker([place.lat, place.lon], { icon })
          .bindPopup(`<div class="amenity-popup-inner"><div class="amenity-popup-name">${place.name}</div><div class="amenity-popup-type">${cat.label}</div></div>`, { closeButton: false, className: "deckmap-amenity-container" })
          .addTo(layer);
      });
  }, [nearbyPlaces, activeCategories]);

  useEffect(() => { const cleanup = initializeMap(); return cleanup; }, [initializeMap]);

  const toggle = (key: string) => setActiveCategories(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-lg bg-muted">
      <style>{`
        .deckmap-pin-icon { background:transparent !important; border:none !important; }
        .deckmap-pin { position:relative; width:32px; height:40px; }
        .deckmap-pin-inner {
          position:absolute; top:0; left:50%;
          width:28px; height:28px;
          background:hsl(var(--primary));
          border-radius:50% 50% 50% 0;
          transform:translateX(-50%) rotate(-45deg);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 8px rgba(0,0,0,0.25); border:2px solid white;
        }
        .deckmap-pin-inner svg { transform:rotate(45deg); color:hsl(var(--primary-foreground)); }
        .amenity-dot-icon { background:transparent !important; border:none !important; }
        .amenity-dot { width:12px; height:12px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.2); border:1.5px solid white; }
        .amenity-dot-inner { width:4px; height:4px; background:white; border-radius:50%; }
        .deckmap-popup-container .leaflet-popup-content-wrapper { border-radius:10px; padding:0; box-shadow:0 4px 12px rgba(0,0,0,0.15); }
        .deckmap-popup-container .leaflet-popup-content { margin:0; }
        .deckmap-popup { padding:10px 14px; }
        .deckmap-popup-name { font-size:13px; font-weight:600; color:#1f2937; }
        .deckmap-popup-address { font-size:11px; color:#6B7280; margin-top:2px; }
        .deckmap-amenity-container .leaflet-popup-content-wrapper { border-radius:6px; padding:0; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
        .deckmap-amenity-container .leaflet-popup-content { margin:0; }
        .amenity-popup-inner { padding:6px 10px; }
        .amenity-popup-name { font-size:11px; font-weight:500; color:#1f2937; }
        .amenity-popup-type { font-size:9px; color:#6B7280; }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-[400px] lg:h-[500px]" />

      {/* Category filter pills */}
      <div className="absolute bottom-3 left-0 right-0 z-[1000] flex justify-center gap-1.5 px-3">
        {amenityCategories.map(({ key, icon: Icon, label, color }) => {
          const isActive = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
                isActive
                  ? "text-background shadow-md"
                  : "bg-background/90 text-muted-foreground hover:bg-background border border-border/30"
              }`}
              style={isActive ? { background: color } : {}}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 text-xs text-muted-foreground shadow-sm border border-border/30">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
export function DeckLocationSection({ address, city, neighborhood, lat, lng, highlights }: DeckLocationSectionProps) {
  const centerLat = lat ?? 49.2057;
  const centerLng = lng ?? -122.9;
  const resolvedNeighborhood = neighborhood || city || "";
  const data = getNeighborhoodData(resolvedNeighborhood);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    return "Car-Dependent";
  };

  return (
    <section id="location" className="relative py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          04
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Location</p>
          <h2 className="text-4xl font-bold text-foreground">Neighbourhood</h2>
          {(address || city) && (
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {[address, city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Map — 3/5 */}
          <div className="lg:col-span-3">
            <DeckMap lat={centerLat} lng={centerLng} projectName={city || "Project"} address={address} />
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <span>📍</span>
              <span>Interactive map — click category pills to show/hide amenities</span>
            </p>
          </div>

          {/* Sidebar — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address card */}
            {(address || city) && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Address</p>
                  <p className="font-semibold text-sm text-foreground">{address}</p>
                  {city && <p className="text-xs text-muted-foreground mt-0.5">{city}, BC</p>}
                </div>
              </div>
            )}

            {/* Walk & Transit scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Walk</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${getScoreColor(data.walkScore)}`}>{data.walkScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getScoreLabel(data.walkScore)}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <Train className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Transit</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${getScoreColor(data.transitScore)}`}>{data.transitScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {data.transitScore >= 70 ? "Excellent Transit" : "Some Transit"}
                </p>
              </div>
            </div>

            {/* Transit & Accessibility */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Car className="h-3 w-3" /> Transit & Access
              </p>
              {data.landmarks.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/25 transition-colors">
                  <span className="text-sm text-foreground">{l.name}</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/15 flex items-center gap-1 shrink-0 ml-2">
                    <Clock className="h-2.5 w-2.5" />{l.distance}
                  </span>
                </div>
              ))}
            </div>

            {/* Schools */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                <School className="h-3 w-3" /> Nearby Schools
              </p>
              {data.schools.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/25 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-foreground truncate">{s.name}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold shrink-0">{s.rating}/10</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{s.distance}</span>
                </div>
              ))}
            </div>

            {/* Shopping */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                <ShoppingBag className="h-3 w-3" /> Shopping & Dining
              </p>
              {data.shopping.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/25 transition-colors">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{s.distance}</span>
                </div>
              ))}
            </div>

            {/* Extra highlights from deck data */}
            {highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">What's Nearby</p>
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/25 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{h.icon}</span>
                      <span className="text-sm font-medium text-foreground">{h.label}</span>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/15 shrink-0 ml-2">{h.distance}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
