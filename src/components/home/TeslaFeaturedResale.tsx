import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BedDouble, Bath } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getListingUrl } from "@/lib/propertiesUrls";

const formatPrice = (price: number) => {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price.toLocaleString()}`;
};

export function TeslaFeaturedResale() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["tesla-featured-resale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, unparsed_address, street_number, street_name, city, neighborhood, listing_price, bedrooms_total, bathrooms_total, living_area, photos, property_type, property_sub_type, mls_status, year_built")
        .eq("mls_status", "Active")
        .not("photos", "eq", "[]")
        .not("latitude", "is", null)
        .gte("listing_price", 300000)
        .gte("year_built", 2020)
        .order("list_date", { ascending: false, nullsFirst: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = listings?.length ?? 0;

  const getPhoto = (photos: unknown): string | null => {
    if (!photos || !Array.isArray(photos) || photos.length === 0) return null;
    return photos[0]?.MediaURL || photos[0]?.Uri || photos[0]?.url || null;
  };

  const getAddress = (listing: NonNullable<typeof listings>[0]) => {
    if (listing.unparsed_address) return listing.unparsed_address;
    const parts = [listing.street_number, listing.street_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    const cardWidth = el.scrollWidth / total;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setCurrent(Math.max(0, Math.min(idx, total - 1)));
  }, [total]);

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / total;
    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  };


  if (isLoading || !listings || listings.length === 0) return null;

  return (
    <section className="bg-background border-t border-border/40">
      {/* Header */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-10 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">Move-In Ready</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">New Homes Available Now</h2>
      </div>

      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 sm:gap-4 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-[15vw] sm:pr-[12vw]"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {listings.map((listing) => {
          const photo = getPhoto(listing.photos);
          const address = getAddress(listing);
          return (
            <Link
              key={listing.id}
              to={getListingUrl(listing.listing_key, address, listing.city)}
              className="relative shrink-0 overflow-hidden rounded-2xl bg-muted group"
              style={{
                width: "85vw",
                maxWidth: "900px",
                aspectRatio: "16/9",
                scrollSnapAlign: "start",
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt={address}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 bg-muted-foreground/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Top-left badge */}
              <div className="absolute top-5 left-6">
                <span className="text-xs font-bold text-white/70 tracking-wide">Move-In Ready</span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-1">
                  {address}
                </h3>
                <p className="text-sm text-white/80 underline mb-5">{listing.city}</p>
                <div className="flex items-center gap-3">
                  <div className="h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {formatPrice(listing.listing_price)}
                  </div>
                  <div className="h-11 px-5 rounded-lg bg-white/[0.12] backdrop-blur-sm border border-white/20 text-sm font-bold text-white flex items-center gap-3">
                    {listing.bedrooms_total && (
                      <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{listing.bedrooms_total} bd</span>
                    )}
                    {listing.bathrooms_total && (
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.bathrooms_total} ba</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dot indicator */}
      <div className="flex items-center justify-center gap-2 mt-5 pb-6">
        {listings.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? "28px" : "8px",
              height: "8px",
              background: i === current
                ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.3)",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
