import { useEffect, useRef } from "react";
import { MapPin, Train, ShoppingBag, Trees, GraduationCap, Coffee } from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface ProximityHighlight {
  icon: string;
  label: string;
  distance: string;
}

interface DeckLocationSectionProps {
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  highlights: ProximityHighlight[];
}

// Map emoji to lucide icon for nicer rendering
function getIconComponent(emoji: string) {
  if (emoji.includes("🚂") || emoji.includes("🚇") || emoji.includes("🚊") || emoji.includes("🚉")) return Train;
  if (emoji.includes("🛍") || emoji.includes("🏬") || emoji.includes("🛒")) return ShoppingBag;
  if (emoji.includes("🌳") || emoji.includes("🌿") || emoji.includes("🏞")) return Trees;
  if (emoji.includes("🎓") || emoji.includes("🏫")) return GraduationCap;
  if (emoji.includes("☕") || emoji.includes("🍵")) return Coffee;
  return MapPin;
}

export function DeckLocationSection({
  address,
  city,
  lat,
  lng,
  highlights,
}: DeckLocationSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (typeof window === "undefined") return;

    const centerLat = lat ?? 49.2057;
    const centerLng = lng ?? -122.9000;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      const map = L.default.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom gold pin icon
      const icon = L.default.divIcon({
        html: `
          <div style="position:relative;width:32px;height:42px;">
            <div style="
              width:32px;height:32px;
              background:hsl(var(--primary));
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              border:3px solid white;
              box-shadow:0 4px 16px rgba(0,0,0,0.5);
            "></div>
            <div style="
              position:absolute;
              top:7px;left:7px;
              width:14px;height:14px;
              background:white;
              border-radius:50%;
            "></div>
          </div>
        `,
        className: "",
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      L.default.marker([centerLat, centerLng], { icon })
        .addTo(map)
        .bindPopup(address || city || "Project Location", { offset: [0, -40] });

      // Add attribution back in a nicer spot
      L.default.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng]);

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
          {/* Map — takes up 3/5 */}
          <div className="lg:col-span-3">
            <div
              ref={mapRef}
              className="w-full h-[360px] lg:h-[480px] rounded-2xl overflow-hidden border border-border/40 shadow-lg"
            />
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <span>📍</span>
              <span>Interactive map — drag and zoom to explore the area</span>
            </p>
          </div>

          {/* Highlights — right 2/5 */}
          <div className="lg:col-span-2 space-y-3">
            {/* Address card */}
            {(address || city) && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Address</p>
                  <p className="font-semibold text-sm text-foreground">{address}</p>
                  {city && <p className="text-xs text-muted-foreground mt-0.5">{city}, BC</p>}
                </div>
              </div>
            )}

            {/* Proximity highlights */}
            {highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
                  What's Nearby
                </p>
                {highlights.map((h, i) => {
                  const IconComp = getIconComponent(h.icon);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/25 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-base group-hover:border-primary/20 transition-colors">
                          {h.icon}
                        </div>
                        <span className="text-sm font-medium text-foreground">{h.label}</span>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/15 shrink-0 ml-2">
                        {h.distance}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No highlights fallback */}
            {highlights.length === 0 && !address && !city && (
              <div className="py-8 text-center text-muted-foreground/50 text-sm">
                Location details coming soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
