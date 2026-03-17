import { MapPin, Train, School, ShoppingBag, Clock, Car, Footprints, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getNeighborhoodData } from "@/components/projects/LocationDeepDive";
import { Link } from "react-router-dom";

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

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const amenityCategories = [
  { key: "schools",    label: "Schools",  icon: School,       color: "#64748B" },
  { key: "transit",    label: "Transit",  icon: Train,        color: "#64748B" },
  { key: "parks",      label: "Parks",    icon: Footprints,   color: "#64748B" },
  { key: "grocery",    label: "Shops",    icon: ShoppingBag,  color: "#64748B" },
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
  ];
  return `[out:json][timeout:10];(${queries.join("")});out center 50;`;
}

function categorizePlace(tags: Record<string, string>) {
  if (tags.amenity === "school" || tags.amenity === "kindergarten") return { category: "schools", type: tags.amenity };
  if (tags.shop === "supermarket" || tags.shop === "grocery" || tags.shop === "convenience") return { category: "grocery", type: tags.shop };
  if (tags.public_transport || tags.railway || tags.highway === "bus_stop") return { category: "transit", type: tags.railway || tags.public_transport || "bus_stop" };
  if (tags.leisure === "park" || tags.leisure === "playground" || tags.leisure === "garden") return { category: "parks", type: tags.leisure };
  return { category: "other", type: "unknown" };
}

function DeckMap({ lat, lng, projectName, address }: { lat: number; lng: number; projectName: string; address?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["schools", "transit", "parks"]));

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
      zoomControl: false, attributionControl: false,
      scrollWheelZoom: false, dragging: true, touchZoom: true,
    });
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const projectIcon = L.divIcon({
      html: `<div class="deck-proj-pin"><div class="deck-proj-inner"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg></div></div>`,
      className: "deck-proj-icon",
      iconSize: [32, 40], iconAnchor: [16, 40],
    });
    L.marker([lat, lng], { icon: projectIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<div class="deck-popup"><div class="deck-popup-name">${projectName}</div>${address ? `<div class="deck-popup-addr">${address}</div>` : ""}</div>`, { closeButton: false, className: "deck-popup-wrap" });

    mapRef.current = map;
    fetchNearbyPlaces();

    return () => { map.remove(); mapRef.current = null; markersLayerRef.current = null; };
  }, [lat, lng, projectName, address, fetchNearbyPlaces]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    nearbyPlaces
      .filter(p => activeCategories.has(p.category))
      .forEach(place => {
        const icon = L.divIcon({
          html: `<div class="deck-amenity-dot"></div>`,
          className: "deck-amenity-icon", iconSize: [12, 12], iconAnchor: [6, 6],
        });
        const cat = amenityCategories.find(c => c.key === place.category);
        L.marker([place.lat, place.lon], { icon })
          .bindPopup(`<div class="deck-amenity-popup"><div class="deck-ap-name">${place.name}</div><div class="deck-ap-type">${cat?.label || ""}</div></div>`, { closeButton: false, className: "deck-amenity-wrap" })
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
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted">
      <style>{`
        .deck-proj-icon { background:transparent !important; border:none !important; }
        .deck-proj-pin { position:relative; width:32px; height:40px; }
        .deck-proj-inner {
          position:absolute; top:0; left:50%;
          width:28px; height:28px;
          background:hsl(var(--primary));
          border-radius:50% 50% 50% 0;
          transform:translateX(-50%) rotate(-45deg);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 8px rgba(0,0,0,0.25); border:2px solid white;
        }
        .deck-proj-inner svg { transform:rotate(45deg); color:hsl(var(--primary-foreground)); width:14px; height:14px; }
        .deck-amenity-icon { background:transparent !important; border:none !important; }
        .deck-amenity-dot { width:12px; height:12px; border-radius:50%; background:hsl(var(--foreground)); border:1.5px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
        .deck-popup-wrap .leaflet-popup-content-wrapper { border-radius:10px; padding:0; box-shadow:0 4px 12px rgba(0,0,0,0.15); }
        .deck-popup-wrap .leaflet-popup-content { margin:0; }
        .deck-popup { padding:10px 14px; }
        .deck-popup-name { font-size:13px; font-weight:600; color:#1f2937; }
        .deck-popup-addr { font-size:11px; color:#6B7280; margin-top:2px; }
        .deck-amenity-wrap .leaflet-popup-content-wrapper { border-radius:6px; padding:0; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
        .deck-amenity-wrap .leaflet-popup-content { margin:0; }
        .deck-amenity-popup { padding:6px 10px; }
        .deck-ap-name { font-size:11px; font-weight:500; color:#1f2937; }
        .deck-ap-type { font-size:9px; color:#6B7280; }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-[280px] sm:h-[320px] md:h-[380px]" />

      {/* Filter pills — icon-only circles, same as ProjectLocationMiniMap */}
      <div className="absolute bottom-2 left-2 right-2 z-[1000] flex justify-center gap-1">
        {amenityCategories.map(({ key, icon: Icon, label }) => {
          const isActive = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              title={label}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-background/80 text-muted-foreground hover:bg-background border border-border/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        {isLoading && (
          <div className="w-7 h-7 rounded-full bg-background/80 flex items-center justify-center border border-border/30">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

export function DeckLocationSection({ address, city, neighborhood, lat, lng, highlights }: DeckLocationSectionProps) {
  const centerLat = lat ?? 49.2057;
  const centerLng = lng ?? -122.9;
  const resolvedNeighborhood = neighborhood || city || "";
  const data = getNeighborhoodData(resolvedNeighborhood);
  const projectName = city || "Project";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    return "Car-Dependent";
  };

  return (
    <section id="location" className="relative py-12 sm:py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          04
        </div>

        <div className="mb-6 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Location</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Neighbourhood</h2>
          {(address || city) && (
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {[address, city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Two-column: compact info left, map right */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">

          {/* Left: compact info panel */}
          <div className="bg-muted/30 rounded-xl border border-border/40 p-4 space-y-4">

            {/* Walk & Transit Scores */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Walk</span>
                </div>
                <div>
                  <span className={`text-xl font-bold ${getScoreColor(data.walkScore)}`}>{data.walkScore}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getScoreLabel(data.walkScore)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Train className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Transit</span>
                </div>
                <div>
                  <span className={`text-xl font-bold ${getScoreColor(data.transitScore)}`}>{data.transitScore}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{data.transitScore >= 70 ? "Excellent Transit" : "Some Transit"}</p>
              </div>
            </div>

            {/* Transit */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-primary" />
                Transit & Access
              </h4>
              <ul className="space-y-1.5">
                {data.landmarks.slice(0, 4).map((l, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{l.name}</span>
                    <span className="flex items-center gap-1 font-medium text-foreground shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {l.distance}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schools */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-primary" />
                Schools
              </h4>
              <ul className="space-y-1.5">
                {data.schools.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-muted-foreground truncate">{s.name}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium shrink-0">{s.rating}/10</span>
                    </div>
                    <span className="text-muted-foreground text-[10px] shrink-0 ml-2">{s.distance}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shopping */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                Shopping & Dining
              </h4>
              <ul className="space-y-1.5">
                {data.shopping.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{s.name}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">{s.distance}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* View on Map */}
            {lat && lng && (
              <Link
                to={`/map-search?lat=${lat}&lng=${lng}&zoom=15`}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-background border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                View on Map
              </Link>
            )}
          </div>

          {/* Right: map */}
          <div className="bg-muted/30 rounded-xl border border-border/40 p-3 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">Project Location</h3>
              {lat && lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Google Maps
                </a>
              )}
            </div>
            <DeckMap lat={centerLat} lng={centerLng} projectName={projectName} address={address} />
          </div>

        </div>
      </div>
    </section>
  );
}

          {/* Walk & Transit Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Footprints className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium uppercase">Walk Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(data.walkScore)}`}>{data.walkScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(data.walkScore)}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Train className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium uppercase">Transit Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(data.transitScore)}`}>{data.transitScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.transitScore >= 70 ? "Excellent Transit" : "Some Transit"}
              </p>
            </div>
          </div>

          {/* Transit & Accessibility */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              Transit & Accessibility
            </h4>
            <ul className="space-y-2">
              {data.landmarks.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{l.name}</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.distance}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Schools */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <School className="h-4 w-4 text-primary" />
              Nearby Schools
            </h4>
            <ul className="space-y-2">
              {data.schools.map((s, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      {s.rating}/10
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{s.distance}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shopping & Dining */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Shopping & Dining
            </h4>
            <ul className="space-y-2">
              {data.shopping.map((s, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-muted-foreground text-xs">{s.distance}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* View on Map CTA */}
          {lat && lng && (
            <Link
              to={`/map-search?lat=${lat}&lng=${lng}&zoom=15`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <MapPin className="h-4 w-4 text-primary" />
              View {projectName} on Map
            </Link>
          )}
        </div>

        {/* Map — same component as ProjectLocationMiniMap */}
        <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base sm:text-lg font-bold text-foreground">Project Location</h3>
            {lat && lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Maps
              </a>
            )}
          </div>
          <DeckMap lat={centerLat} lng={centerLng} projectName={projectName} address={address} />
        </div>
      </div>
    </section>
  );
}
