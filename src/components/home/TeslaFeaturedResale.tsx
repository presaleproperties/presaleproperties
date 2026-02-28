import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, BedDouble, Bath } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (price: number) => {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price.toLocaleString()}`;
};

export function TeslaFeaturedResale() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["tesla-featured-resale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, unparsed_address, city, listing_price, bedrooms_total, bathrooms_total, photos, property_type, mls_status")
        .eq("mls_status", "Active")
        .not("photos", "is", null)
        .order("listing_price", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !listings || listings.length === 0) return null;

  const getPhoto = (photos: unknown): string | null => {
    if (!photos) return null;
    const arr = photos as Array<{ Uri?: string; url?: string }>;
    return arr[0]?.Uri || arr[0]?.url || null;
  };

  const [big, ...small] = listings;

  return (
    <section className="bg-muted/30 border-t border-border/40">
      <div className="container px-4 sm:px-6 pt-16 pb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">Move-In Ready</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">New Homes Available Now</h2>
        </div>
        <Link
          to="/properties"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tesla-style: 1 big left + 4 stacked right */}
      <div className="flex gap-0.5 mx-0.5">
        {/* Big left card */}
        {big && (
          <Link
            to={`/properties/${big.listing_key}`}
            className="group relative overflow-hidden bg-muted flex-1"
            style={{ aspectRatio: "4/3" }}
          >
            {getPhoto(big.photos) ? (
              <img
                src={getPhoto(big.photos)!}
                alt={big.unparsed_address ?? ""}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-muted-foreground/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-1">
                {big.unparsed_address}
              </h3>
              <p className="text-sm text-white/60 flex items-center gap-1 mb-3">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />{big.city}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-lg font-extrabold text-primary">{formatPrice(big.listing_price)}</span>
                {big.bedrooms_total && (
                  <span className="flex items-center gap-1 text-xs text-white/60">
                    <BedDouble className="h-3.5 w-3.5" />{big.bedrooms_total} bd
                  </span>
                )}
                {big.bathrooms_total && (
                  <span className="flex items-center gap-1 text-xs text-white/60">
                    <Bath className="h-3.5 w-3.5" />{big.bathrooms_total} ba
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Right — 4 small stacked */}
        <div className="flex flex-col gap-0.5 w-[38%] sm:w-[42%]">
          {small.map((listing) => (
            <Link
              key={listing.id}
              to={`/properties/${listing.listing_key}`}
              className="group relative overflow-hidden bg-muted flex-1"
            >
              {getPhoto(listing.photos) ? (
                <img
                  src={getPhoto(listing.photos)!}
                  alt={listing.unparsed_address ?? ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-muted-foreground/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate">{listing.unparsed_address}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-primary">{formatPrice(listing.listing_price)}</span>
                  <span className="text-[10px] text-white/50">{listing.city}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="container px-4 pt-5 pb-2 sm:hidden">
        <Link
          to="/properties"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          View All Listings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
