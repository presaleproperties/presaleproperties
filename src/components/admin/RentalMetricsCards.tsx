import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, TrendingUp, MapPin, PawPrint, Sofa, 
  DollarSign, Calendar, Building2, BedDouble
} from "lucide-react";

export function RentalMetricsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["rental-detailed-stats"],
    queryFn: async () => {
      // Get all active rentals for detailed analysis
      const { data: rentals, error } = await supabase
        .from("mls_listings")
        .select("lease_amount, pets_allowed, furnished, latitude, longitude, bedrooms_total, city, availability_date, property_type, property_sub_type")
        .eq("is_rental", true)
        .eq("mls_status", "Active");

      if (error) throw error;

      const total = rentals?.length || 0;
      const withCoords = rentals?.filter(r => r.latitude && r.longitude).length || 0;
      const petFriendly = rentals?.filter(r => r.pets_allowed && r.pets_allowed.toLowerCase() !== "no").length || 0;
      const furnished = rentals?.filter(r => r.furnished && r.furnished !== "Unfurnished").length || 0;
      
      // Separate apartments from townhomes
      const apartments = rentals?.filter(r => {
        const subType = r.property_sub_type?.toLowerCase() || '';
        return !subType.includes('townhouse') && !subType.includes('townhome');
      }) || [];
      
      const townhomes = rentals?.filter(r => {
        const subType = r.property_sub_type?.toLowerCase() || '';
        return subType.includes('townhouse') || subType.includes('townhome');
      }) || [];

      // Calculate rent statistics by type
      const oneBedRentals = apartments.filter(r => r.bedrooms_total === 1 && r.lease_amount && r.lease_amount > 0);
      const twoBedRentals = apartments.filter(r => r.bedrooms_total === 2 && r.lease_amount && r.lease_amount > 0);
      const townhomeRentals = townhomes.filter(r => r.lease_amount && r.lease_amount > 0);
      
      const avg1Bed = oneBedRentals.length > 0 
        ? Math.round(oneBedRentals.reduce((sum, r) => sum + (r.lease_amount || 0), 0) / oneBedRentals.length)
        : 0;
      const avg2Bed = twoBedRentals.length > 0 
        ? Math.round(twoBedRentals.reduce((sum, r) => sum + (r.lease_amount || 0), 0) / twoBedRentals.length)
        : 0;
      const avgTownhome = townhomeRentals.length > 0 
        ? Math.round(townhomeRentals.reduce((sum, r) => sum + (r.lease_amount || 0), 0) / townhomeRentals.length)
        : 0;

      // Overall rent stats
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

      // City count
      const uniqueCities = new Set(rentals?.map(r => r.city).filter(Boolean));

      // Immediate availability
      const immediate = rentals?.filter(r => {
        if (!r.availability_date) return true;
        return new Date(r.availability_date) <= new Date();
      }).length || 0;

      return {
        total,
        withCoords,
        petFriendly,
        furnished,
        avg1Bed,
        avg2Bed,
        avgTownhome,
        avgRent,
        minRent,
        maxRent,
        count1Bed: oneBedRentals.length,
        count2Bed: twoBedRentals.length,
        countTownhome: townhomeRentals.length,
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
      subtitle: `${stats?.cityCount || 0} cities covered`,
    },
    {
      label: "1 Bed Avg Rent",
      value: formatCurrency(stats?.avg1Bed || 0),
      icon: BedDouble,
      color: "text-emerald-600",
      subtitle: `${stats?.count1Bed || 0} listings`,
    },
    {
      label: "2 Bed Avg Rent",
      value: formatCurrency(stats?.avg2Bed || 0),
      icon: BedDouble,
      color: "text-blue-600",
      subtitle: `${stats?.count2Bed || 0} listings`,
    },
    {
      label: "Townhome Avg Rent",
      value: formatCurrency(stats?.avgTownhome || 0),
      icon: Building2,
      color: "text-amber-600",
      subtitle: `${stats?.countTownhome || 0} listings`,
    },
    {
      label: "Overall Avg Rent",
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
      label: "Immediate Avail.",
      value: stats?.immediate || 0,
      icon: Calendar,
      color: "text-primary",
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
