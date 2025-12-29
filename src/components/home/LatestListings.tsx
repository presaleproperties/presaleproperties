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
      const { data: listingsData, error } = await supabase
        .from("listings")
        .select(`
          *,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // Fetch agent profiles
      const agentIds = [...new Set(listingsData?.map(l => l.agent_id) || [])];
      
      const [profilesResult, agentProfilesResult] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", agentIds),
        supabase.from("agent_profiles").select("user_id, brokerage_name").in("user_id", agentIds)
      ]);
      
      const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const agentProfilesMap = new Map(agentProfilesResult.data?.map(a => [a.user_id, a]) || []);
      
      return listingsData?.map(listing => ({
        ...listing,
        agentProfile: profilesMap.get(listing.agent_id),
        agentInfo: agentProfilesMap.get(listing.agent_id),
      }));
    },
  });

  return (
    <section className="py-20 md:py-28 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Just Added
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Latest Assignments
            </h2>
            <p className="text-muted-foreground text-lg">
              Recently added to the marketplace
            </p>
          </div>
          <Link to="/assignments" className="hidden sm:block shrink-0">
            <Button variant="ghost" size="lg" className="flex items-center gap-2 group">
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
                photoCount={listing.listing_photos?.length || 0}
                agent={{
                  name: listing.agentProfile?.full_name || undefined,
                  avatarUrl: listing.agentProfile?.avatar_url || undefined,
                  brokerage: listing.agentInfo?.brokerage_name || undefined,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background rounded-lg border border-border">
            <p className="text-muted-foreground">
              No assignments available yet. Be the first to list!
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