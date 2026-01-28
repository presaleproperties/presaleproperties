import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseRentalRemarks } from "@/utils/rentalRemarksParser";
import { RentalListingsTable } from "@/components/admin/RentalListingsTable";
import { RentalMetricsCards } from "@/components/admin/RentalMetricsCards";
import { 
  Home, RefreshCw, Eye, EyeOff, DollarSign, 
  Settings, LayoutDashboard 
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

  // Fetch rental city counts with breakdown by type - using pagination to get all records
  const { data: cityCounts, isLoading: cityCountsLoading } = useQuery({
    queryKey: ["rental-city-counts"],
    queryFn: async () => {
      // First get total count
      const { count: totalCount } = await supabase
        .from("mls_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_rental", true)
        .eq("mls_status", "Active");

      if (!totalCount || totalCount === 0) return [];

      // Fetch in batches of 1000 to get all rentals
      const allRentals: any[] = [];
      const BATCH_SIZE = 1000;
      const batches = Math.ceil(totalCount / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const { data, error } = await supabase
          .from("mls_listings")
          .select("city, lease_amount, bedrooms_total, property_type, property_sub_type")
          .eq("is_rental", true)
          .eq("mls_status", "Active")
          .range(i * BATCH_SIZE, (i + 1) * BATCH_SIZE - 1);

        if (error) throw error;
        if (data) allRentals.push(...data);
      }

      // Count by city and calculate avg rent by type
      const cityData: Record<string, { 
        count: number; 
        totalRent: number;
        oneBed: { count: number; total: number };
        twoBed: { count: number; total: number };
        townhome: { count: number; total: number };
      }> = {};
      
      allRentals.forEach(listing => {
        const city = listing.city || "Unknown";
        if (!cityData[city]) {
          cityData[city] = { 
            count: 0, 
            totalRent: 0,
            oneBed: { count: 0, total: 0 },
            twoBed: { count: 0, total: 0 },
            townhome: { count: 0, total: 0 },
          };
        }
        const leaseAmount = listing.lease_amount || 0;
        cityData[city].count++;
        cityData[city].totalRent += leaseAmount;
        
        // Check if townhome
        const isTownhome = listing.property_sub_type?.toLowerCase().includes('townhouse') ||
          listing.property_sub_type?.toLowerCase().includes('townhome') ||
          listing.property_type?.toLowerCase().includes('townhouse');
        
        if (isTownhome && leaseAmount > 0) {
          cityData[city].townhome.count++;
          cityData[city].townhome.total += leaseAmount;
        } else if (listing.bedrooms_total === 1 && leaseAmount > 0) {
          cityData[city].oneBed.count++;
          cityData[city].oneBed.total += leaseAmount;
        } else if (listing.bedrooms_total === 2 && leaseAmount > 0) {
          cityData[city].twoBed.count++;
          cityData[city].twoBed.total += leaseAmount;
        }
      });

      return Object.entries(cityData)
        .map(([city, data]) => ({
          city,
          count: data.count,
          avgRent: data.count > 0 ? Math.round(data.totalRent / data.count) : 0,
          avg1Bed: data.oneBed.count > 0 ? Math.round(data.oneBed.total / data.oneBed.count) : null,
          avg2Bed: data.twoBed.count > 0 ? Math.round(data.twoBed.total / data.twoBed.count) : null,
          avgTownhome: data.townhome.count > 0 ? Math.round(data.townhome.total / data.townhome.count) : null,
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

  // Scan for rentals mutation - more aggressive detection
  const scanRentalsMutation = useMutation({
    mutationFn: async () => {
      // First, mark ALL zero-price listings as rentals (this is the DDF convention)
      const { data: zeroPriceListings, error: zeroError } = await supabase
        .from("mls_listings")
        .select("listing_key, public_remarks, listing_price, lease_amount")
        .eq("listing_price", 0)
        .eq("mls_status", "Active")
        .or("is_rental.eq.false,is_rental.is.null");

      if (zeroError) throw zeroError;

      // Also fetch listings with rental keywords that aren't zero-price
      const { data: keywordListings, error: keywordError } = await supabase
        .from("mls_listings")
        .select("listing_key, public_remarks, listing_price, lease_amount")
        .eq("mls_status", "Active")
        .or("is_rental.eq.false,is_rental.is.null")
        .gt("listing_price", 0)
        .or("public_remarks.ilike.%for rent%,public_remarks.ilike.%for lease%,public_remarks.ilike.%$/month%,public_remarks.ilike.%per month%,public_remarks.ilike.%tenant%,public_remarks.ilike.%landlord%,lease_amount.gt.0")
        .limit(2000);

      if (keywordError) throw keywordError;

      // Combine both sets
      const allPotentialRentals = [...(zeroPriceListings || []), ...(keywordListings || [])];

      let updated = 0;
      const batchUpdates: { 
        listing_key: string; 
        is_rental: boolean; 
        lease_amount: number | null;
        lease_frequency: string | null;
        pets_allowed: string | null;
        furnished: string | null;
        availability_date: string | null;
        utilities_included: string[] | null;
      }[] = [];

      for (const listing of allPotentialRentals) {
        const parsed = parseRentalRemarks(listing.public_remarks, listing.listing_price || 0);
        const finalLeaseAmount = listing.lease_amount || parsed.leaseAmount;
        
        // Zero-price listings are ALWAYS rentals in DDF
        // For non-zero, check if parser detected it as rental
        const isZeroPrice = listing.listing_price === 0;
        const isRental = isZeroPrice || parsed.isRental || (finalLeaseAmount && finalLeaseAmount > 400 && finalLeaseAmount < 25000);
        
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

      // Batch update in chunks of 100 for faster processing
      const chunkSize = 100;
      for (let i = 0; i < batchUpdates.length; i += chunkSize) {
        const chunk = batchUpdates.slice(i, i + chunkSize);
        // Use Promise.all for parallel updates within each chunk
        await Promise.all(chunk.map(update => 
          supabase
            .from("mls_listings")
            .update({
              is_rental: update.is_rental,
              lease_amount: update.lease_amount,
              lease_frequency: update.lease_frequency,
              pets_allowed: update.pets_allowed,
              furnished: update.furnished,
              utilities_included: update.utilities_included,
            })
            .eq("listing_key", update.listing_key)
        ));
      }

      return { updated, scanned: allPotentialRentals.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Rental scan complete",
        description: `Scanned ${data.scanned} listings, identified and updated ${data.updated} rentals`,
      });
      queryClient.invalidateQueries({ queryKey: ["rental-stats"] });
      queryClient.invalidateQueries({ queryKey: ["rental-city-counts"] });
      queryClient.invalidateQueries({ queryKey: ["rental-detailed-stats"] });
      queryClient.invalidateQueries({ queryKey: ["rental-listings"] });
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
          <h1 className="text-3xl font-bold">Rental Listings Dashboard</h1>
          <p className="text-muted-foreground">
            Manage, monitor, and analyze rental listings separately from sales
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Home className="h-4 w-4" />
              All Listings
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <RentalMetricsCards />

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Scan existing listings to identify rentals and update their metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => scanRentalsMutation.mutate()}
                  disabled={scanRentalsMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${scanRentalsMutation.isPending ? "animate-spin" : ""}`} />
                  Scan Existing Listings
                </Button>
                <Button
                  variant="default"
                  onClick={async () => {
                    toast({ title: "Syncing rentals from MLS feed..." });
                    try {
                      const { error } = await supabase.functions.invoke("sync-mls-data", {
                        body: { includeRentals: true, maxBatches: 30 }
                      });
                      if (error) throw error;
                      toast({ title: "Rental sync started", description: "This may take a few minutes." });
                      queryClient.invalidateQueries({ queryKey: ["rental-city-counts"] });
                    } catch (err: any) {
                      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
                    }
                  }}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Rentals from MLS
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Rentals by City
                </CardTitle>
                <CardDescription>
                  Overview of rental distribution and average rents by city
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cityCountsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">Rentals</TableHead>
                          <TableHead className="text-right">1 Bed Avg</TableHead>
                          <TableHead className="text-right">2 Bed Avg</TableHead>
                          <TableHead className="text-right">Townhome Avg</TableHead>
                          <TableHead className="text-right">Overall Avg</TableHead>
                          <TableHead className="text-center">Visible</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cityCounts?.slice(0, 10).map(({ city, count, avgRent, avg1Bed, avg2Bed, avgTownhome }) => (
                          <TableRow key={city}>
                            <TableCell className="font-medium">{city}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {avg1Bed ? `${formatCurrency(avg1Bed)}/mo` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {avg2Bed ? `${formatCurrency(avg2Bed)}/mo` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-secondary-foreground">
                              {avgTownhome ? `${formatCurrency(avgTownhome)}/mo` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-success">
                              {formatCurrency(avgRent)}/mo
                            </TableCell>
                            <TableCell className="text-center">
                              {enabledCities.includes(city) ? (
                                <Eye className="h-4 w-4 text-success mx-auto" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <RentalListingsTable />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
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
                                <Eye className="h-4 w-4 text-success" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{count}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {formatCurrency(avgRent)}/mo
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
