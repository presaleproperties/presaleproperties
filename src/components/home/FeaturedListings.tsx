import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export function FeaturedListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async () => {
      const { data: listingsData, error } = await supabase
        .from("listings")
        .select(`
          *,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
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
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Featured Assignments
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hand-picked opportunities from verified agents
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
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No featured listings available yet.
            </p>
            <Link to="/assignments" className="mt-4 inline-block">
              <Button variant="outline">Browse All Assignments</Button>
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