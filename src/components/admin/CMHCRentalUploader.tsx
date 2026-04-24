import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Home, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  ExternalLink,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface CMHCRentalData {
  id: string;
  city: string;
  zone: string | null;
  report_year: number;
  avg_rent_1br: number | null;
  avg_rent_2br: number | null;
  avg_rent_3br: number | null;
  vacancy_rate_overall: number | null;
  vacancy_rate_1br: number | null;
  vacancy_rate_2br: number | null;
  yoy_rent_change_1br: number | null;
  yoy_rent_change_2br: number | null;
  rental_universe: number | null;
  data_quality: 'verified' | 'interpolated' | 'estimated';
  source_url: string | null;
  updated_at: string;
}

interface CMHCRentalUploaderProps {
  onDataUpdated?: () => void;
}

const METRO_VANCOUVER_CITIES = [
  "Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "Langley",
  "New Westminster", "North Vancouver", "Delta", "Port Coquitlam", 
  "Port Moody", "Maple Ridge", "White Rock", "Pitt Meadows", "West Vancouver",
  "Abbotsford", "Chilliwack", "Mission"
];

type DataQuality = 'verified' | 'interpolated' | 'estimated';

const EMPTY_FORM = {
  city: "",
  zone: "Vancouver CMA",
  report_year: new Date().getFullYear(),
  avg_rent_1br: null as number | null,
  avg_rent_2br: null as number | null,
  avg_rent_3br: null as number | null,
  vacancy_rate_overall: null as number | null,
  vacancy_rate_1br: null as number | null,
  vacancy_rate_2br: null as number | null,
  yoy_rent_change_1br: null as number | null,
  yoy_rent_change_2br: null as number | null,
  rental_universe: null as number | null,
  data_quality: 'verified' as DataQuality,
};

export function CMHCRentalUploader({ onDataUpdated }: CMHCRentalUploaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<CMHCRentalData | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: rentalData, isLoading } = useQuery({
    queryKey: ['cmhc-rental-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cmhc_rental_data')
        .select('*')
        .order('report_year', { ascending: false })
        .order('city');
      
      if (error) throw error;
      return data as CMHCRentalData[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const record = {
        ...data,
        source_url: 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
      };

      if (editingData) {
        const { error } = await supabase
          .from('cmhc_rental_data')
          .update(record)
          .eq('id', editingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cmhc_rental_data')
          .upsert(record, { onConflict: 'city,report_year' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmhc-rental-data'] });
      toast.success(editingData ? "Rental data updated" : "Rental data added");
      handleCloseDialog();
      onDataUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cmhc_rental_data')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmhc-rental-data'] });
      toast.success("Entry deleted");
      onDataUpdated?.();
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

  const handleEdit = (data: CMHCRentalData) => {
    setEditingData(data);
    setFormData({
      city: data.city,
      zone: data.zone || "Vancouver CMA",
      report_year: data.report_year,
      avg_rent_1br: data.avg_rent_1br,
      avg_rent_2br: data.avg_rent_2br,
      avg_rent_3br: data.avg_rent_3br,
      vacancy_rate_overall: data.vacancy_rate_overall,
      vacancy_rate_1br: data.vacancy_rate_1br,
      vacancy_rate_2br: data.vacancy_rate_2br,
      yoy_rent_change_1br: data.yoy_rent_change_1br,
      yoy_rent_change_2br: data.yoy_rent_change_2br,
      rental_universe: data.rental_universe,
      data_quality: data.data_quality,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number | null, showSign = false) => {
    if (value === null) return '—';
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  // Group data by year
  const dataByYear = rentalData?.reduce((acc, item) => {
    const year = item.report_year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<number, CMHCRentalData[]>) || {};

  const years = Object.keys(dataByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-info-soft to-info-soft dark:from-info-strong/30 dark:to-info-strong/30 border-info/30 dark:border-info">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-soft dark:bg-info-strong rounded-lg">
                <Building2 className="h-5 w-5 text-info dark:text-info" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  CMHC Rental Market Data
                  <Badge variant="outline" className="bg-success-soft text-success-strong border-success/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified Source
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Official rental statistics from Canada Mortgage and Housing Corporation
                </CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingData(null); setFormData(EMPTY_FORM); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingData ? "Edit CMHC Data" : "Add CMHC Rental Data"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(v) => setFormData({ ...formData, city: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {METRO_VANCOUVER_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="report_year">Report Year *</Label>
                      <Select
                        value={formData.report_year.toString()}
                        onValueChange={(v) => setFormData({ ...formData, report_year: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2023, 2022, 2021, 2020].map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Average Monthly Rents
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="avg_rent_1br">1 BR ($)</Label>
                        <Input
                          id="avg_rent_1br"
                          type="number"
                          value={formData.avg_rent_1br || ""}
                          onChange={(e) => setFormData({ ...formData, avg_rent_1br: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="2100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="avg_rent_2br">2 BR ($)</Label>
                        <Input
                          id="avg_rent_2br"
                          type="number"
                          value={formData.avg_rent_2br || ""}
                          onChange={(e) => setFormData({ ...formData, avg_rent_2br: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="2800"
                        />
                      </div>
                      <div>
                        <Label htmlFor="avg_rent_3br">3 BR ($)</Label>
                        <Input
                          id="avg_rent_3br"
                          type="number"
                          value={formData.avg_rent_3br || ""}
                          onChange={(e) => setFormData({ ...formData, avg_rent_3br: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="3500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Vacancy Rates (%)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="vacancy_rate_overall">Overall</Label>
                        <Input
                          id="vacancy_rate_overall"
                          type="number"
                          step="0.1"
                          value={formData.vacancy_rate_overall || ""}
                          onChange={(e) => setFormData({ ...formData, vacancy_rate_overall: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="1.2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vacancy_rate_1br">1 BR</Label>
                        <Input
                          id="vacancy_rate_1br"
                          type="number"
                          step="0.1"
                          value={formData.vacancy_rate_1br || ""}
                          onChange={(e) => setFormData({ ...formData, vacancy_rate_1br: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vacancy_rate_2br">2 BR</Label>
                        <Input
                          id="vacancy_rate_2br"
                          type="number"
                          step="0.1"
                          value={formData.vacancy_rate_2br || ""}
                          onChange={(e) => setFormData({ ...formData, vacancy_rate_2br: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="1.1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Year-over-Year Rent Change (%)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="yoy_rent_change_1br">1 BR YoY</Label>
                        <Input
                          id="yoy_rent_change_1br"
                          type="number"
                          step="0.1"
                          value={formData.yoy_rent_change_1br || ""}
                          onChange={(e) => setFormData({ ...formData, yoy_rent_change_1br: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="5.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yoy_rent_change_2br">2 BR YoY</Label>
                        <Input
                          id="yoy_rent_change_2br"
                          type="number"
                          step="0.1"
                          value={formData.yoy_rent_change_2br || ""}
                          onChange={(e) => setFormData({ ...formData, yoy_rent_change_2br: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="5.0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label>Data Quality</Label>
                    <Select
                      value={formData.data_quality}
                      onValueChange={(v) => setFormData({ ...formData, data_quality: v as DataQuality })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">Verified (from CMHC report)</SelectItem>
                        <SelectItem value="interpolated">Interpolated (calculated)</SelectItem>
                        <SelectItem value="estimated">Estimated (best guess)</SelectItem>
                      </SelectContent>
                    </Select>
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
        </CardHeader>
        <CardContent>
          <a 
            href="https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-info hover:underline"
          >
            View CMHC Rental Market Reports
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      {/* Data Tables by Year */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
      ) : years.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No CMHC rental data yet. Click "Add Data" to get started.
        </Card>
      ) : (
        years.map(year => (
          <Card key={year}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {year} CMHC Rental Data
                <Badge variant="secondary">{dataByYear[year].length} cities</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">1 BR</TableHead>
                      <TableHead className="text-right">2 BR</TableHead>
                      <TableHead className="text-right">3 BR</TableHead>
                      <TableHead className="text-right">Vacancy</TableHead>
                      <TableHead className="text-right">YoY 1BR</TableHead>
                      <TableHead className="text-right">YoY 2BR</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataByYear[year].map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.city}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.avg_rent_1br)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.avg_rent_2br)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.avg_rent_3br)}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.vacancy_rate_overall)}</TableCell>
                        <TableCell className="text-right">
                          {row.yoy_rent_change_1br !== null && (
                            <span className={`flex items-center justify-end gap-1 ${row.yoy_rent_change_1br >= 0 ? 'text-danger' : 'text-success'}`}>
                              {row.yoy_rent_change_1br >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {formatPercent(row.yoy_rent_change_1br, true)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.yoy_rent_change_2br !== null && (
                            <span className={`flex items-center justify-end gap-1 ${row.yoy_rent_change_2br >= 0 ? 'text-danger' : 'text-success'}`}>
                              {row.yoy_rent_change_2br >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {formatPercent(row.yoy_rent_change_2br, true)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              row.data_quality === 'verified' 
                                ? 'bg-success-soft text-success-strong border-success/30' 
                                : row.data_quality === 'interpolated'
                                ? 'bg-warning-soft text-warning-strong border-warning/30'
                                : 'bg-muted text-foreground border-border'
                            }
                          >
                            {row.data_quality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}