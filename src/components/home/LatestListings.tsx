import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export function LatestListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["latest-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Latest Assignments
            </h2>
            <p className="mt-2 text-muted-foreground">
              Recently added to the marketplace
            </p>
          </div>
          <Link to="/assignments">
            <Button variant="ghost" className="hidden sm:flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                projectName={listing.project_name}
                address={listing.address || undefined}
                city={listing.city}
                neighborhood={listing.neighborhood || undefined}
                propertyType={listing.property_type}
                unitType={listing.unit_type}
                beds={listing.beds}
                baths={listing.baths}
                interiorSqft={listing.interior_sqft || undefined}
                assignmentPrice={Number(listing.assignment_price)}
                completionYear={listing.completion_year || undefined}
                completionMonth={listing.completion_month || undefined}
                isFeatured={listing.is_featured || false}
                imageUrl={listing.listing_photos?.[0]?.url}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background rounded-lg border border-border">
            <p className="text-muted-foreground">
              No listings available yet. Be the first to list!
            </p>
            <Link to="/register" className="mt-4 inline-block">
              <Button>Become an Agent</Button>
            </Link>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/assignments">
            <Button variant="outline" className="w-full">
              View All Assignments
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}