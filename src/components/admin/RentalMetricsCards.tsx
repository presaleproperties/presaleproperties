import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, TrendingUp, MapPin, PawPrint, Sofa, 
  DollarSign, Calendar, Building2
} from "lucide-react";

export function RentalMetricsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["rental-detailed-stats"],
    queryFn: async () => {
      // Get all active rentals for detailed analysis
      const { data: rentals, error } = await supabase
        .from("mls_listings")
        .select("lease_amount, pets_allowed, furnished, latitude, longitude, bedrooms_total, city, availability_date")
        .eq("is_rental", true)
        .eq("mls_status", "Active");

      if (error) throw error;

      const total = rentals?.length || 0;
      const withCoords = rentals?.filter(r => r.latitude && r.longitude).length || 0;
      const petFriendly = rentals?.filter(r => r.pets_allowed && r.pets_allowed.toLowerCase() !== "no").length || 0;
      const furnished = rentals?.filter(r => r.furnished && r.furnished !== "Unfurnished").length || 0;
      
      // Calculate rent statistics
      const rentsWithValue = rentals?.filter(r => r.lease_amount && r.lease_amount > 0) || [];
      const avgRent = rentsWithValue.length > 0 
        ? Math.round(rentsWithValue.reduce((sum, r) => sum + (r.lease_amount || 0), 0) / rentsWithValue.length)
        : 0;
      const minRent = rentsWithValue.length > 0 
        ? Math.min(...rentsWithValue.map(r => r.lease_amount || 0))
        : 0;
      const maxRent = rentsWithValue.length > 0 
        ? Math.max(...rentsWithValue.map(r => r.lease_amount || 0))
        : 0;

      // Bedroom breakdown
      const studios = rentals?.filter(r => r.bedrooms_total === 0).length || 0;
      const oneBed = rentals?.filter(r => r.bedrooms_total === 1).length || 0;
      const twoBed = rentals?.filter(r => r.bedrooms_total === 2).length || 0;
      const threePlus = rentals?.filter(r => (r.bedrooms_total || 0) >= 3).length || 0;

      // City count
      const uniqueCities = new Set(rentals?.map(r => r.city).filter(Boolean));

      // Immediate availability
      const immediate = rentals?.filter(r => {
        if (!r.availability_date) return true; // Assume immediate if not specified
        return new Date(r.availability_date) <= new Date();
      }).length || 0;

      return {
        total,
        withCoords,
        petFriendly,
        furnished,
        avgRent,
        minRent,
        maxRent,
        studios,
        oneBed,
        twoBed,
        threePlus,
        cityCount: uniqueCities.size,
        immediate,
      };
    },
  });

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Rentals",
      value: stats?.total || 0,
      icon: Home,
      color: "text-primary",
    },
    {
      label: "Average Rent",
      value: formatCurrency(stats?.avgRent || 0),
      icon: DollarSign,
      color: "text-success",
      subtitle: `${formatCurrency(stats?.minRent || 0)} - ${formatCurrency(stats?.maxRent || 0)}`,
    },
    {
      label: "Mapped",
      value: stats?.withCoords || 0,
      icon: MapPin,
      color: "text-primary",
      subtitle: `${stats?.total ? Math.round((stats.withCoords / stats.total) * 100) : 0}% geocoded`,
    },
    {
      label: "Pet Friendly",
      value: stats?.petFriendly || 0,
      icon: PawPrint,
      color: "text-primary",
      subtitle: `${stats?.total ? Math.round((stats.petFriendly / stats.total) * 100) : 0}%`,
    },
    {
      label: "Furnished",
      value: stats?.furnished || 0,
      icon: Sofa,
      color: "text-primary",
      subtitle: `${stats?.total ? Math.round((stats.furnished / stats.total) * 100) : 0}%`,
    },
    {
      label: "Immediate Avail.",
      value: stats?.immediate || 0,
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Cities Covered",
      value: stats?.cityCount || 0,
      icon: Building2,
      color: "text-primary",
    },
    {
      label: "1 Bedroom",
      value: stats?.oneBed || 0,
      icon: TrendingUp,
      color: "text-primary",
      subtitle: `Studios: ${stats?.studios || 0} | 2BR: ${stats?.twoBed || 0} | 3+: ${stats?.threePlus || 0}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
              <span className="text-2xl font-bold">{metric.value}</span>
            </div>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
