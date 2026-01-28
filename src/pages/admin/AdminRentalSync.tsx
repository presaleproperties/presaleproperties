import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseRentalRemarks } from "@/utils/rentalRemarksParser";
import { 
  Home, RefreshCw, Eye, EyeOff, DollarSign, 
  PawPrint, Sofa, MapPin, TrendingUp 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Price range options for rental filtering
const PRICE_RANGES = [
  { value: "0", label: "No minimum", min: 0 },
  { value: "1000", label: "$1,000", min: 1000 },
  { value: "1500", label: "$1,500", min: 1500 },
  { value: "2000", label: "$2,000", min: 2000 },
  { value: "2500", label: "$2,500", min: 2500 },
  { value: "3000", label: "$3,000", min: 3000 },
];

const MAX_PRICE_RANGES = [
  { value: "99999", label: "No maximum", max: 99999 },
  { value: "2000", label: "$2,000", max: 2000 },
  { value: "2500", label: "$2,500", max: 2500 },
  { value: "3000", label: "$3,000", max: 3000 },
  { value: "4000", label: "$4,000", max: 4000 },
  { value: "5000", label: "$5,000", max: 5000 },
  { value: "10000", label: "$10,000", max: 10000 },
];

export default function AdminRentalSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabledCities, setEnabledCities] = useState<string[]>([]);
  const [minLease, setMinLease] = useState("0");
  const [maxLease, setMaxLease] = useState("99999");

  // Default Metro Vancouver cities for rentals
  const defaultEnabledCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", 
    "Coquitlam", "New Westminster", "North Vancouver"
  ];

  // Fetch rental stats
  const { data: rentalStats, isLoading: statsLoading } = useQuery({
    queryKey: ["rental-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true);

      const { count: active } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true)
        .eq("mls_status", "Active");

      const { count: withCoords } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true)
        .eq("mls_status", "Active")
        .not("latitude", "is", null);

      const { count: petFriendly } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true)
        .eq("mls_status", "Active")
        .not("pets_allowed", "is", null)
        .neq("pets_allowed", "No");

      const { count: furnished } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true)
        .eq("mls_status", "Active")
        .not("furnished", "is", null)
        .neq("furnished", "Unfurnished");

      return {
        total: total || 0,
        active: active || 0,
        withCoords: withCoords || 0,
        petFriendly: petFriendly || 0,
        furnished: furnished || 0,
      };
    },
  });

  // Fetch rental city counts
  const { data: cityCounts, isLoading: cityCountsLoading } = useQuery({
    queryKey: ["rental-city-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("city, lease_amount")
        .eq("is_rental", true)
        .eq("mls_status", "Active");

      if (error) throw error;

      // Count by city and calculate avg rent
      const cityData: Record<string, { count: number; totalRent: number }> = {};
      data?.forEach(listing => {
        const city = listing.city || "Unknown";
        if (!cityData[city]) {
          cityData[city] = { count: 0, totalRent: 0 };
        }
        cityData[city].count++;
        cityData[city].totalRent += listing.lease_amount || 0;
      });

      return Object.entries(cityData)
        .map(([city, data]) => ({
          city,
          count: data.count,
          avgRent: Math.round(data.totalRent / data.count),
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch saved settings
  const { data: savedSettings } = useQuery({
    queryKey: ["rental-settings"],
    queryFn: async () => {
      const { data: cities } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "rental_enabled_cities")
        .maybeSingle();

      const { data: minLeaseData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "rental_min_lease")
        .maybeSingle();

      const { data: maxLeaseData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "rental_max_lease")
        .maybeSingle();

      return {
        cities: cities?.value as string[] | null,
        minLease: (minLeaseData?.value as number) || 0,
        maxLease: (maxLeaseData?.value as number) || 99999,
      };
    },
  });

  // Initialize from saved settings
  useEffect(() => {
    if (savedSettings) {
      if (savedSettings.cities) {
        setEnabledCities(savedSettings.cities);
      } else if (cityCounts && enabledCities.length === 0) {
        setEnabledCities(defaultEnabledCities);
      }
      setMinLease(String(savedSettings.minLease));
      setMaxLease(String(savedSettings.maxLease));
    }
  }, [savedSettings, cityCounts]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("app_settings")
        .upsert({ key: "rental_enabled_cities", value: enabledCities }, { onConflict: "key" });

      await supabase
        .from("app_settings")
        .upsert({ key: "rental_min_lease", value: parseInt(minLease) }, { onConflict: "key" });

      await supabase
        .from("app_settings")
        .upsert({ key: "rental_max_lease", value: parseInt(maxLease) }, { onConflict: "key" });
    },
    onSuccess: () => {
      toast({ title: "Rental settings saved" });
      queryClient.invalidateQueries({ queryKey: ["rental-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scan for rentals mutation (re-classifies existing listings using the parser utility)
  const scanRentalsMutation = useMutation({
    mutationFn: async () => {
      // Find listings that might be rentals based on various indicators
      const { data: potentialRentals, error } = await supabase
        .from("mls_listings")
        .select("listing_key, public_remarks, listing_price, lease_amount")
        .or("is_rental.eq.false,is_rental.is.null")
        .or("listing_price.eq.0,public_remarks.ilike.%for rent%,public_remarks.ilike.%$/month%,public_remarks.ilike.%per month%,lease_amount.gt.0")
        .limit(2000);

      if (error) throw error;

      let updated = 0;
      let batchUpdates: { 
        listing_key: string; 
        is_rental: boolean; 
        lease_amount: number | null;
        lease_frequency: string | null;
        pets_allowed: string | null;
        furnished: string | null;
        availability_date: string | null;
        utilities_included: string[] | null;
      }[] = [];

      for (const listing of potentialRentals || []) {
        // Use the parser utility to extract rental data
        const parsed = parseRentalRemarks(listing.public_remarks, listing.listing_price || 0);
        
        // If already has lease_amount from API, use that instead
        const finalLeaseAmount = listing.lease_amount || parsed.leaseAmount;
        
        // Determine if this is a rental
        const isRental = parsed.isRental || (finalLeaseAmount && finalLeaseAmount > 400 && finalLeaseAmount < 25000);
        
        if (isRental) {
          batchUpdates.push({
            listing_key: listing.listing_key,
            is_rental: true,
            lease_amount: finalLeaseAmount,
            lease_frequency: parsed.leaseFrequency || 'Monthly',
            pets_allowed: parsed.petsAllowed,
            furnished: parsed.furnished,
            availability_date: parsed.availabilityDate,
            utilities_included: parsed.utilitiesIncluded.length > 0 ? parsed.utilitiesIncluded : null,
          });
          updated++;
        }
      }

      // Batch update in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < batchUpdates.length; i += chunkSize) {
        const chunk = batchUpdates.slice(i, i + chunkSize);
        for (const update of chunk) {
          await supabase
            .from("mls_listings")
            .update({
              is_rental: update.is_rental,
              lease_amount: update.lease_amount,
              lease_frequency: update.lease_frequency,
              pets_allowed: update.pets_allowed,
              furnished: update.furnished,
              utilities_included: update.utilities_included,
            })
            .eq("listing_key", update.listing_key);
        }
      }

      return { updated, scanned: potentialRentals?.length || 0 };
    },
    onSuccess: (data) => {
      toast({
        title: "Rental scan complete",
        description: `Scanned ${data.scanned} listings, identified and updated ${data.updated} rentals`,
      });
      queryClient.invalidateQueries({ queryKey: ["rental-stats"] });
      queryClient.invalidateQueries({ queryKey: ["rental-city-counts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCity = (city: string) => {
    setEnabledCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rental Listings</h1>
          <p className="text-muted-foreground">
            Manage rental listing visibility and sync settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-emerald-600" />
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold">{rentalStats?.total || 0}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold">{rentalStats?.active || 0}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold">{rentalStats?.withCoords || 0}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pet Friendly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-amber-600" />
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold">{rentalStats?.petFriendly || 0}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Furnished
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Sofa className="h-5 w-5 text-rose-600" />
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold">{rentalStats?.furnished || 0}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Scan existing listings to identify rentals and save your settings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => scanRentalsMutation.mutate()}
              disabled={scanRentalsMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${scanRentalsMutation.isPending ? "animate-spin" : ""}`} />
              Scan for Rentals
            </Button>
            <Button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
            >
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Price Range Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Range Filters
            </CardTitle>
            <CardDescription>
              Set minimum and maximum monthly rent to display on the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rent</label>
                <Select value={minLease} onValueChange={setMinLease}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Rent</label>
                <Select value={maxLease} onValueChange={setMaxLease}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAX_PRICE_RANGES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* City Visibility Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              City Visibility Control
            </CardTitle>
            <CardDescription>
              Enable or disable rental listings by city. Only enabled cities will appear on the website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cityCountsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Visible</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Rentals</TableHead>
                    <TableHead className="text-right">Avg. Rent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cityCounts?.map(({ city, count, avgRent }) => (
                    <TableRow key={city}>
                      <TableCell>
                        <Switch
                          checked={enabledCities.includes(city)}
                          onCheckedChange={() => toggleCity(city)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {city}
                          {enabledCities.includes(city) ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{count}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(avgRent)}/mo
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
