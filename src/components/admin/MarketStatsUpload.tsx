import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, Loader2, TrendingUp, Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ExtractedCity {
  city: string;
  avg_price_sqft?: number | null;
  benchmark_condo?: number | null;
  benchmark_townhome?: number | null;
  avg_rent_1br?: number | null;
  avg_rent_2br?: number | null;
  rental_yield?: number | null;
  yoy_price_change?: number | null;
}

interface ExtractedData {
  report_period: { month: number; year: number; board: string };
  cities: ExtractedCity[];
  market_summary: string;
  key_trends: string[];
}

interface MarketStatsUploadProps {
  onDataImported?: () => void;
}

export function MarketStatsUpload({ onDataImported }: MarketStatsUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [board, setBoard] = useState<string>("FVREB");
  const [reportMonth, setReportMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState<string>(String(new Date().getFullYear()));
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoGenerateBlogs, setAutoGenerateBlogs] = useState(true);
  const [blogProgress, setBlogProgress] = useState<{ current: number; total: number; city: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
      setExtractedData(null);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For PDF text extraction, we'll use a simpler approach
    // The AI is good at understanding even messy text
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Extract text content from PDF (simplified approach)
    let text = '';
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfContent = decoder.decode(bytes);
    
    // Extract readable strings from PDF content
    const textMatches = pdfContent.match(/\(([^)]+)\)/g) || [];
    for (const match of textMatches) {
      const content = match.slice(1, -1);
      // Filter out binary/encoded content
      if (content.length > 2 && /[a-zA-Z0-9]/.test(content)) {
        text += content + ' ';
      }
    }

    // Also try to get text from stream objects
    const streamRegex = /stream\n([\s\S]*?)\nendstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(pdfContent)) !== null) {
      const streamContent = streamMatch[1];
      if (streamContent && streamContent.length < 10000) {
        // Extract text tokens
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

  const handleProcessPDF = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    try {
      const documentText = await extractTextFromPDF(file);
      
      if (documentText.length < 100) {
        toast.error('Could not extract enough text from PDF. Try a different file or copy-paste the data.');
        setIsProcessing(false);
        return;
      }

      console.log('Extracted text length:', documentText.length);

      const { data, error } = await supabase.functions.invoke('parse-market-stats', {
        body: {
          documentText,
          board,
          reportMonth: parseInt(reportMonth),
          reportYear: parseInt(reportYear),
        },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setExtractedData(data.data);
        toast.success(`Extracted data for ${data.data.cities.length} cities`);
      } else {
        toast.error(data?.error || 'Failed to extract data');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!extractedData) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sourceUrl = board === 'FVREB' 
        ? 'https://www.fvreb.bc.ca/statistics'
        : 'https://www.rebgv.org/market-watch';

      // Calculate 5-year appreciation estimate from YoY change
      const getAppreciation5yr = (yoyChange: number | null | undefined) => {
        if (!yoyChange) return 30; // Default
        // Compound the YoY change over 5 years with some dampening
        return Math.round(yoyChange * 4.5);
      };

      const updates = extractedData.cities.map(city => ({
        city: city.city,
        avg_price_sqft: city.avg_price_sqft || Math.round((city.benchmark_condo || 500000) / 750),
        rental_yield: city.rental_yield || 4.0,
        appreciation_5yr: getAppreciation5yr(city.yoy_price_change),
        avg_rent_1br: city.avg_rent_1br || 1900,
        avg_rent_2br: city.avg_rent_2br || 2500,
        source_name: `${board} Snap Stats`,
        source_url: sourceUrl,
        last_verified_date: today,
        notes: `Imported from ${reportMonth}/${reportYear} report. Summary: ${extractedData.market_summary}`,
      }));

      // Upsert each city
      for (const update of updates) {
        const { error } = await supabase
          .from('market_data')
          .upsert(update, { onConflict: 'city' });
        
        if (error) {
          console.error(`Error upserting ${update.city}:`, error);
        }
      }

      toast.success(`Updated market data for ${updates.length} cities`);

      // Auto-generate blog posts if enabled
      if (autoGenerateBlogs && extractedData.cities.length > 0) {
        const cities = extractedData.cities.map(c => c.city);
        let successCount = 0;

        for (let i = 0; i < cities.length; i++) {
          const city = cities[i];
          setBlogProgress({ current: i + 1, total: cities.length, city });

          try {
            // Generate blog
            const { data: blogData, error: genError } = await supabase.functions.invoke('generate-market-blog', {
              body: {
                city,
                reportMonth: parseInt(reportMonth),
                reportYear: parseInt(reportYear),
              },
            });

            if (genError) {
              console.error(`Error generating blog for ${city}:`, genError);
              continue;
            }

            if (blogData?.success && blogData?.data) {
              // Save as draft
              const { error: saveError } = await supabase
                .from('blog_posts')
                .insert({
                  title: blogData.data.title,
                  slug: blogData.data.slug,
                  excerpt: blogData.data.excerpt,
                  content: blogData.data.content,
                  seo_title: blogData.data.seo_title,
                  seo_description: blogData.data.seo_description,
                  tags: blogData.data.tags,
                  category: 'Market Updates',
                  is_published: false,
                  is_featured: false,
                });

              if (!saveError) {
                successCount++;
              }
            }
          } catch (e) {
            console.error(`Error with blog for ${city}:`, e);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setBlogProgress(null);
        if (successCount > 0) {
          toast.success(`Generated ${successCount} blog post drafts`);
        }
      }

      setExtractedData(null);
      setFile(null);
      onDataImported?.();
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
      setBlogProgress(null);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Monthly Stats
        </CardTitle>
        <CardDescription>
          Upload Snap Stats or monthly report PDFs from FVREB or REBGV. AI will extract all market data automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="pdf-upload">PDF Report</Label>
            <div className="mt-1.5">
              <label 
                htmlFor="pdf-upload"
                className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {file ? (
                  <>
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Drop PDF or click to upload</span>
                  </>
                )}
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="board">Real Estate Board</Label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger id="board" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FVREB">Fraser Valley (FVREB)</SelectItem>
                <SelectItem value="REBGV">Greater Vancouver (REBGV)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger id="month" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i).toLocaleString('en', { month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={reportYear} onValueChange={setReportYear}>
                <SelectTrigger id="year" className="mt-1.5">
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
        </div>

        <Button 
          onClick={handleProcessPDF} 
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing PDF with AI...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Extract Market Data
            </>
          )}
        </Button>

        {/* Extracted Data Preview */}
        {extractedData && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Extracted Data Preview
              </h3>
              <Badge variant="secondary">
                {extractedData.cities.length} cities found
              </Badge>
            </div>

            {/* Market Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Market Summary</p>
              <p className="text-sm">{extractedData.market_summary}</p>
              
              {extractedData.key_trends?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {extractedData.key_trends.map((trend, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {extractedData.cities.map((city, i) => (
                <div key={i} className="bg-background border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{city.city}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block text-foreground font-medium">
                        ${city.avg_price_sqft || '—'}/sqft
                      </span>
                      Avg $/sqft
                    </div>
                    <div>
                      <span className="block text-foreground font-medium">
                        {formatPrice(city.benchmark_condo)}
                      </span>
                      Condo Benchmark
                    </div>
                    <div>
                      <span className="block text-foreground font-medium">
                        {city.rental_yield ? `${city.rental_yield.toFixed(1)}%` : '—'}
                      </span>
                      Rental Yield
                    </div>
                    <div>
                      <span className={`block font-medium ${(city.yoy_price_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {city.yoy_price_change ? `${city.yoy_price_change > 0 ? '+' : ''}${city.yoy_price_change.toFixed(1)}%` : '—'}
                      </span>
                      YoY Change
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Generate Toggle */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Auto-generate blog posts</p>
                  <p className="text-xs text-muted-foreground">Create market update drafts for each city</p>
                </div>
              </div>
              <Switch 
                checked={autoGenerateBlogs} 
                onCheckedChange={setAutoGenerateBlogs}
                disabled={isSaving}
              />
            </div>

            {/* Blog Generation Progress */}
            {blogProgress && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating blog for <strong>{blogProgress.city}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    {blogProgress.current} / {blogProgress.total}
                  </span>
                </div>
                <Progress value={(blogProgress.current / blogProgress.total) * 100} className="h-2" />
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setExtractedData(null)}
                className="flex-1"
                disabled={isSaving}
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
                    {blogProgress ? 'Generating Blogs...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save{autoGenerateBlogs ? ' & Generate Blogs' : ''} ({extractedData.cities.length} cities)
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
