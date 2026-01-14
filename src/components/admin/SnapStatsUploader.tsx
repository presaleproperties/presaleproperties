import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, Loader2, TrendingUp, Building2, Home, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CityStats {
  city: string;
  property_type: 'condo' | 'townhome';
  benchmark_price?: number | null;
  avg_price_sqft?: number | null;
  median_sale_price?: number | null;
  total_inventory?: number | null;
  total_sales?: number | null;
  sales_ratio?: number | null;
  days_on_market?: number | null;
  sale_to_list_ratio?: number | null;
  hottest_price_band?: string | null;
  hottest_price_band_ratio?: number | null;
  market_type?: 'buyers' | 'balanced' | 'sellers' | null;
  yoy_price_change?: number | null;
  mom_price_change?: number | null;
  avg_rent_1br?: number | null;
  avg_rent_2br?: number | null;
  rental_yield?: number | null;
}

interface ExtractedData {
  report_period: { month: number; year: number; edition: string; board: string };
  city_stats: CityStats[];
  market_summary: string;
  key_insights: string[];
}

interface UploadedFile {
  file: File;
  edition: 'FVR' | 'GVR' | 'MVR';
  status: 'pending' | 'processing' | 'done' | 'error';
  data?: ExtractedData;
  error?: string;
}

interface SnapStatsUploaderProps {
  onDataImported?: () => void;
}

const EDITION_LABELS: Record<string, string> = {
  'FVR': 'Fraser Valley (Surrey, Langley, Abbotsford)',
  'GVR': 'Greater Vancouver (Burnaby, Coquitlam, New West)',
  'MVR': 'Metro Vancouver (Vancouver, Richmond, N. Van)',
};

export function SnapStatsUploader({ onDataImported }: SnapStatsUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [reportMonth, setReportMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState<string>(String(new Date().getFullYear()));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allExtracted, setAllExtracted] = useState<CityStats[]>([]);
  const [marketSummary, setMarketSummary] = useState<string>('');
  const [keyInsights, setKeyInsights] = useState<string[]>([]);

  const detectEdition = (fileName: string): 'FVR' | 'GVR' | 'MVR' => {
    const upper = fileName.toUpperCase();
    if (upper.includes('FVR') || upper.includes('FRASER')) return 'FVR';
    if (upper.includes('GVR') || upper.includes('GREATER')) return 'GVR';
    if (upper.includes('MVR') || upper.includes('METRO')) return 'MVR';
    return 'FVR';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles
      .filter(f => f.type === 'application/pdf')
      .map(f => ({
        file: f,
        edition: detectEdition(f.name),
        status: 'pending' as const,
      }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setAllExtracted([]);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfContent = decoder.decode(bytes);
    
    let text = '';
    const textMatches = pdfContent.match(/\(([^)]+)\)/g) || [];
    for (const match of textMatches) {
      const content = match.slice(1, -1);
      if (content.length > 2 && /[a-zA-Z0-9$%]/.test(content)) {
        text += content + ' ';
      }
    }

    const streamRegex = /stream\n([\s\S]*?)\nendstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(pdfContent)) !== null) {
      const streamContent = streamMatch[1];
      if (streamContent && streamContent.length < 10000) {
        const tokens = streamContent.match(/\(([^)]{2,100})\)/g) || [];
        for (const token of tokens) {
          const t = token.slice(1, -1);
          if (/[a-zA-Z0-9$%]/.test(t)) {
            text += t + ' ';
          }
        }
      }
    }

    return text.trim();
  };

  const processAllFiles = async () => {
    if (files.length === 0) {
      toast.error('Please add at least one PDF file');
      return;
    }

    const isPaymentRequired = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      return msg.includes('402') || msg.toLowerCase().includes('payment required') || msg.toLowerCase().includes('not enough credits');
    };

    setIsProcessing(true);
    const allStats: CityStats[] = [];
    const allInsights: string[] = [];
    let combinedSummary = '';

    for (let i = 0; i < files.length; i++) {
      const uploadedFile = files[i];
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'processing' } : f
      ));

      try {
        const documentText = await extractTextFromPDF(uploadedFile.file);

        if (documentText.length < 100) {
          throw new Error('Could not extract text from PDF');
        }

        const { data, error } = await supabase.functions.invoke('parse-snapstats-pdf', {
          body: {
            documentText,
            edition: uploadedFile.edition,
            reportMonth: parseInt(reportMonth),
            reportYear: parseInt(reportYear),
          },
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          const extracted = data.data as ExtractedData;
          allStats.push(...extracted.city_stats);
          allInsights.push(...(extracted.key_insights || []));
          combinedSummary += `${uploadedFile.edition}: ${extracted.market_summary} `;

          setFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'done', data: extracted } : f
          ));
        } else {
          throw new Error(data?.error || 'Failed to extract data');
        }
      } catch (err) {
        console.error(`Error processing ${uploadedFile.file.name}:`, err);

        // If the AI gateway is out of credits / billing-limited, stop immediately to avoid repeated failures.
        if (isPaymentRequired(err)) {
          const message = "AI parsing is temporarily blocked due to workspace AI credit/billing limits. Please check Workspace → Usage (AI) and try again.";
          toast.error(message);
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: message } : f
          ));
          break;
        }

        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' } : f
        ));
      }

      // Small delay between files
      if (i < files.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setAllExtracted(allStats);
    setKeyInsights([...new Set(allInsights)].slice(0, 6));
    setMarketSummary(combinedSummary.trim());
    setIsProcessing(false);

    if (allStats.length > 0) {
      toast.success(`Extracted ${allStats.length} city/property combinations`);
    }
  };

  const handleSaveToDatabase = async () => {
    if (allExtracted.length === 0) return;

    setIsSaving(true);
    try {
      const month = parseInt(reportMonth);
      const year = parseInt(reportYear);
      
      let savedCount = 0;
      
      for (const stat of allExtracted) {
        // Determine source board
        const board = stat.city.includes('Surrey') || stat.city.includes('Langley') || 
                      stat.city.includes('Abbotsford') ? 'FVREB' : 'REBGV';

        const record = {
          city: stat.city,
          report_month: month,
          report_year: year,
          property_type: stat.property_type,
          benchmark_price: stat.benchmark_price,
          avg_price_sqft: stat.avg_price_sqft,
          median_sale_price: stat.median_sale_price,
          total_inventory: stat.total_inventory,
          total_sales: stat.total_sales,
          sales_ratio: stat.sales_ratio,
          days_on_market: stat.days_on_market,
          sale_to_list_ratio: stat.sale_to_list_ratio,
          hottest_price_band: stat.hottest_price_band,
          hottest_price_band_ratio: stat.hottest_price_band_ratio,
          market_type: stat.market_type,
          yoy_price_change: stat.yoy_price_change,
          mom_price_change: stat.mom_price_change,
          avg_rent_1br: stat.avg_rent_1br,
          avg_rent_2br: stat.avg_rent_2br,
          rental_yield: stat.rental_yield,
          source_board: board,
          report_summary: marketSummary,
        };

        const { error } = await supabase
          .from('city_market_stats')
          .upsert(record, { 
            onConflict: 'city,report_month,report_year,property_type' 
          });

        if (!error) savedCount++;
      }

      // Also update the legacy market_data table for backward compatibility
      const cityPrices: Record<string, number> = {};
      for (const stat of allExtracted) {
        if (stat.property_type === 'condo' && stat.avg_price_sqft) {
          cityPrices[stat.city] = stat.avg_price_sqft;
        }
      }

      for (const [city, pricePerSqft] of Object.entries(cityPrices)) {
        const stat = allExtracted.find(s => s.city === city && s.property_type === 'condo');
        if (stat) {
          await supabase
            .from('market_data')
            .upsert({
              city,
              avg_price_sqft: pricePerSqft,
              rental_yield: stat.rental_yield || 4.0,
              appreciation_5yr: Math.abs((stat.yoy_price_change || 5) * 4.5),
              avg_rent_1br: stat.avg_rent_1br || 1900,
              avg_rent_2br: stat.avg_rent_2br || 2500,
              source_name: 'Snap Stats',
              last_verified_date: new Date().toISOString().split('T')[0],
            }, { onConflict: 'city' });
        }
      }

      toast.success(`Saved ${savedCount} market stats to database`);
      setFiles([]);
      setAllExtracted([]);
      onDataImported?.();
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const condoStats = allExtracted.filter(s => s.property_type === 'condo');
  const townhomeStats = allExtracted.filter(s => s.property_type === 'townhome');

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Monthly Snap Stats Upload
        </CardTitle>
        <CardDescription>
          Upload all 3 Snap Stats PDFs (Fraser Valley, Greater Vancouver, Metro Vancouver) to update market data across the entire site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Period */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Report Month</Label>
            <Select value={reportMonth} onValueChange={setReportMonth}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Label>Year</Label>
            <Select value={reportYear} onValueChange={setReportYear}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Upload Area */}
        <div>
          <Label>Upload PDFs</Label>
          <label className="mt-1.5 flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Drop Snap Stats PDFs here or click to upload
            </span>
            <span className="text-xs text-muted-foreground">
              Supports FVR, GVR, MVR editions
            </span>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Files ({files.length})</Label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">{EDITION_LABELS[f.edition]}</p>
                </div>
                <Select 
                  value={f.edition} 
                  onValueChange={(val) => setFiles(prev => 
                    prev.map((file, idx) => idx === i ? { ...file, edition: val as 'FVR' | 'GVR' | 'MVR' } : file)
                  )}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FVR">FVR</SelectItem>
                    <SelectItem value="GVR">GVR</SelectItem>
                    <SelectItem value="MVR">MVR</SelectItem>
                  </SelectContent>
                </Select>
                {f.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {f.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFile(i)}
                  disabled={isProcessing}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Process Button */}
        {files.length > 0 && allExtracted.length === 0 && (
          <Button 
            onClick={processAllFiles} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing PDFs with AI...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Extract All Market Data
              </>
            )}
          </Button>
        )}

        {/* Extracted Data Preview */}
        {allExtracted.length > 0 && (
          <div className="space-y-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Extracted Data Preview
              </h3>
              <div className="flex gap-2">
                <Badge variant="secondary">{condoStats.length} Condo Markets</Badge>
                <Badge variant="outline">{townhomeStats.length} Townhome Markets</Badge>
              </div>
            </div>

            {/* Market Summary */}
            {marketSummary && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Regional Market Summary</p>
                <p className="text-sm text-muted-foreground">{marketSummary}</p>
                {keyInsights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keyInsights.map((insight, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Condo Stats Grid */}
            {condoStats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Condo Markets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {condoStats.map((stat, i) => (
                    <div key={i} className="bg-background border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{stat.city}</span>
                        <Badge 
                          variant={stat.market_type === 'sellers' ? 'default' : stat.market_type === 'balanced' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {stat.market_type || 'N/A'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-foreground font-medium">
                            {formatPrice(stat.benchmark_price || stat.median_sale_price)}
                          </span>
                          <span className="text-muted-foreground">Benchmark</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">
                            ${stat.avg_price_sqft || '—'}/sqft
                          </span>
                          <span className="text-muted-foreground">Avg $/sqft</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">
                            {stat.sales_ratio ? `${stat.sales_ratio}%` : '—'}
                          </span>
                          <span className="text-muted-foreground">Sales Ratio</span>
                        </div>
                        <div>
                          <span className={`block font-medium ${(stat.yoy_price_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.yoy_price_change ? `${stat.yoy_price_change > 0 ? '+' : ''}${stat.yoy_price_change}%` : '—'}
                          </span>
                          <span className="text-muted-foreground">YoY Change</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Townhome Stats Grid */}
            {townhomeStats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Townhome Markets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {townhomeStats.map((stat, i) => (
                    <div key={i} className="bg-background border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{stat.city}</span>
                        <Badge 
                          variant={stat.market_type === 'sellers' ? 'default' : stat.market_type === 'balanced' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {stat.market_type || 'N/A'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-foreground font-medium">
                            {formatPrice(stat.benchmark_price || stat.median_sale_price)}
                          </span>
                          <span className="text-muted-foreground">Benchmark</span>
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">
                            {stat.sales_ratio ? `${stat.sales_ratio}%` : '—'}
                          </span>
                          <span className="text-muted-foreground">Sales Ratio</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => { setFiles([]); setAllExtracted([]); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save to Database
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
