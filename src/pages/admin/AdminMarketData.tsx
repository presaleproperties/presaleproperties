import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ExternalLink, TrendingUp, RefreshCw, Upload, FileText, Sparkles, FileSearch, BarChart3, Home } from "lucide-react";
import { toast } from "sonner";
import { MarketStatsUpload } from "@/components/admin/MarketStatsUpload";
import { MarketBlogGenerator } from "@/components/admin/MarketBlogGenerator";
import { ResearchImporter } from "@/components/admin/ResearchImporter";
import { SnapStatsUploader } from "@/components/admin/SnapStatsUploader";
import { CMHCRentalUploader } from "@/components/admin/CMHCRentalUploader";
import { PriceSqftCalculator } from "@/components/admin/PriceSqftCalculator";

interface MarketData {
  id: string;
  city: string;
  avg_price_sqft: number;
  rental_yield: number;
  appreciation_5yr: number;
  avg_rent_1br: number;
  avg_rent_2br: number;
  source_name: string;
  source_url: string | null;
  last_verified_date: string;
  notes: string | null;
  updated_at: string;
}

const EMPTY_FORM: Omit<MarketData, 'id' | 'updated_at'> = {
  city: "",
  avg_price_sqft: 800,
  rental_yield: 4.0,
  appreciation_5yr: 30.0,
  avg_rent_1br: 1900,
  avg_rent_2br: 2500,
  source_name: "FVREB Snap Stats",
  source_url: "https://www.fvreb.bc.ca/statistics",
  last_verified_date: new Date().toISOString().split('T')[0],
  notes: null,
};

export default function AdminMarketData() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<MarketData | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['admin-market-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .order('city');
      
      if (error) throw error;
      return data as MarketData[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingData) {
        const { error } = await supabase
          .from('market_data')
          .update(data)
          .eq('id', editingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('market_data')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-data'] });
      toast.success(editingData ? "Market data updated" : "City added");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('market_data')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-data'] });
      toast.success("City removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingData(null);
    setFormData(EMPTY_FORM);
  };

  const handleEdit = (data: MarketData) => {
    setEditingData(data);
    setFormData({
      city: data.city,
      avg_price_sqft: data.avg_price_sqft,
      rental_yield: data.rental_yield,
      appreciation_5yr: data.appreciation_5yr,
      avg_rent_1br: data.avg_rent_1br,
      avg_rent_2br: data.avg_rent_2br,
      source_name: data.source_name,
      source_url: data.source_url,
      last_verified_date: data.last_verified_date,
      notes: data.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Market Data
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload Snap Stats PDFs or manually manage investment metrics for project analysis.
          </p>
        </div>

        <Tabs defaultValue="snapstats" className="w-full">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="snapstats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Snap Stats
            </TabsTrigger>
            <TabsTrigger value="cmhc" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              CMHC Rentals
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Legacy
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Blog Gen
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Data
            </TabsTrigger>
          </TabsList>

          {/* Snap Stats Upload Tab (NEW PRIMARY) */}
          <TabsContent value="snapstats" className="mt-6 space-y-6">
            {/* Calculate Price/Sqft from MLS Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  New Construction Price/Sqft Calculator
                </CardTitle>
                <CardDescription>
                  Auto-calculate verified price per sqft from MLS listings (properties under 1 year old). 
                  This runs automatically after MLS sync but can be triggered manually.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceSqftCalculator onCalculated={() => queryClient.invalidateQueries({ queryKey: ['admin-market-data'] })} />
              </CardContent>
            </Card>
            
            <SnapStatsUploader onDataImported={() => queryClient.invalidateQueries({ queryKey: ['admin-market-data'] })} />
          </TabsContent>
          <TabsContent value="cmhc" className="mt-6 space-y-6">
            <CMHCRentalUploader onDataUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin-market-data'] })} />
          </TabsContent>

          {/* Research Import Tab */}
          <TabsContent value="research" className="mt-6 space-y-6">
            <ResearchImporter onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['admin-market-data'] })} />
            
            {/* Research Sources Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Research Sources</CardTitle>
                <CardDescription>Paste links from these presale intelligence providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://mlacanada.com/research" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    MLA Canada Research
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a 
                    href="https://www.rennie.com/intelligence" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    Rennie Intelligence
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a 
                    href="https://presalepulse.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    Presale Pulse
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-6 space-y-6">
            <MarketStatsUpload onDataImported={() => queryClient.invalidateQueries({ queryKey: ['admin-market-data'] })} />
            
            {/* Data Sources Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Official Data Sources</CardTitle>
                <CardDescription>Download Snap Stats or monthly reports from these boards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://www.fvreb.bc.ca/statistics" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    FVREB Statistics (Fraser Valley)
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a 
                    href="https://www.rebgv.org/market-watch" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    REBGV Market Watch (Metro Van)
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a 
                    href="https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    CMHC Rental Reports
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Generator Tab */}
          <TabsContent value="blog" className="mt-6 space-y-6">
            <MarketBlogGenerator cities={marketData?.map(d => d.city) || []} />
          </TabsContent>

          {/* Manual Edit Tab */}
          <TabsContent value="manual" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingData(null); setFormData(EMPTY_FORM); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add City
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingData ? "Edit Market Data" : "Add City"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Vancouver"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="avg_price_sqft">Avg Price/Sqft ($)</Label>
                        <Input
                          id="avg_price_sqft"
                          type="number"
                          value={formData.avg_price_sqft}
                          onChange={(e) => setFormData({ ...formData, avg_price_sqft: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rental_yield">Rental Yield (%)</Label>
                        <Input
                          id="rental_yield"
                          type="number"
                          step="0.1"
                          value={formData.rental_yield}
                          onChange={(e) => setFormData({ ...formData, rental_yield: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appreciation_5yr">5-Year Appreciation (%)</Label>
                        <Input
                          id="appreciation_5yr"
                          type="number"
                          step="0.1"
                          value={formData.appreciation_5yr}
                          onChange={(e) => setFormData({ ...formData, appreciation_5yr: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="avg_rent_1br">Avg Rent 1BR ($)</Label>
                        <Input
                          id="avg_rent_1br"
                          type="number"
                          value={formData.avg_rent_1br}
                          onChange={(e) => setFormData({ ...formData, avg_rent_1br: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="avg_rent_2br">Avg Rent 2BR ($)</Label>
                      <Input
                        id="avg_rent_2br"
                        type="number"
                        value={formData.avg_rent_2br}
                        onChange={(e) => setFormData({ ...formData, avg_rent_2br: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Data Source</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="source_name">Source Name *</Label>
                          <Input
                            id="source_name"
                            value={formData.source_name}
                            onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                            placeholder="e.g. FVREB Snap Stats"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="source_url">Source URL</Label>
                          <Input
                            id="source_url"
                            type="url"
                            value={formData.source_url || ""}
                            onChange={(e) => setFormData({ ...formData, source_url: e.target.value || null })}
                            placeholder="https://www.fvreb.bc.ca/statistics"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_verified_date">Last Verified Date *</Label>
                          <Input
                            id="last_verified_date"
                            type="date"
                            value={formData.last_verified_date}
                            onChange={(e) => setFormData({ ...formData, last_verified_date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                        placeholder="Internal notes about this market data..."
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                        {saveMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Data Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">$/Sqft</TableHead>
                          <TableHead className="text-right">Yield</TableHead>
                          <TableHead className="text-right">5yr Growth</TableHead>
                          <TableHead className="text-right">1BR Rent</TableHead>
                          <TableHead className="text-right">2BR Rent</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketData?.map((data) => (
                          <TableRow key={data.id}>
                            <TableCell className="font-medium">{data.city}</TableCell>
                            <TableCell className="text-right">${data.avg_price_sqft}</TableCell>
                            <TableCell className="text-right">{data.rental_yield}%</TableCell>
                            <TableCell className="text-right text-green-600">+{data.appreciation_5yr}%</TableCell>
                            <TableCell className="text-right">${data.avg_rent_1br}</TableCell>
                            <TableCell className="text-right">${data.avg_rent_2br}</TableCell>
                            <TableCell>
                              {data.source_url ? (
                                <a 
                                  href={data.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  {data.source_name}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">{data.source_name}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(data.last_verified_date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(data)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Delete ${data.city}?`)) {
                                      deleteMutation.mutate(data.id);
                                    }
                                  }}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {marketData?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              No market data yet. Upload Snap Stats or add cities manually.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
