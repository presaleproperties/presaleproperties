import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

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
      });

      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom gold marker
      const icon = L.default.divIcon({
        html: `<div style="width:18px;height:18px;background:hsl(var(--primary));border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.default.marker([centerLat, centerLng], { icon }).addTo(map);
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
    <section id="location" className="relative py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          04
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest">04 — Location</p>
          <h2 className="text-4xl font-bold text-foreground">Neighbourhood</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map — left 2/3 */}
          <div className="lg:col-span-2">
            <div
              ref={mapRef}
              className="w-full h-80 lg:h-[420px] rounded-xl overflow-hidden border border-border/50"
            />
          </div>

          {/* Highlights — right 1/3 */}
          <div className="space-y-4">
            {/* Address card */}
            {address && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border/50">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Address</p>
                  <p className="font-medium text-sm text-foreground">{address}</p>
                  {city && <p className="text-sm text-muted-foreground">{city}</p>}
                </div>
              </div>
            )}

            {/* Proximity highlights */}
            {highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Nearby</p>
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-background border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{h.icon}</span>
                      <span className="text-sm font-medium text-foreground">{h.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {h.distance}
                    </span>
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
