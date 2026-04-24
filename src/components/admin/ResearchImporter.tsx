import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Link, 
  FileSearch, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen,
  Building2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ExtractedData {
  source: string;
  sourceUrl: string;
  title: string;
  publishDate: string;
  summary: string;
  keyInsights: string[];
  marketData: {
    city?: string;
    avgPriceSqft?: number;
    benchmarkCondo?: number;
    benchmarkTownhome?: number;
    yoyChange?: number;
    salesVolume?: number;
    daysOnMarket?: number;
  }[];
}

interface ResearchImporterProps {
  onImportComplete?: () => void;
}

export function ResearchImporter({ onImportComplete }: ResearchImporterProps) {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [generateBlog, setGenerateBlog] = useState(true);
  const [updateMarketData, setUpdateMarketData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [blogProgress, setBlogProgress] = useState<string | null>(null);

  const detectSource = (inputUrl: string): string => {
    if (inputUrl.includes("mlacanada") || inputUrl.includes("mla-canada") || inputUrl.includes("presalepulse")) {
      return "MLA Canada / Presale Pulse";
    }
    if (inputUrl.includes("rennie")) {
      return "Rennie Intelligence";
    }
    return "Research Report";
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsProcessing(true);
    setExtractedData(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-research-report", {
        body: { url, source: "auto" },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setExtractedData(data.data);
        toast.success(`Extracted data from ${data.data.source}`);
      } else {
        toast.error(data?.error || "Failed to extract data from URL");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("Failed to scrape URL. Please check the link and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveData = async () => {
    if (!extractedData) return;

    setIsSaving(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Update market data if enabled
      if (updateMarketData && extractedData.marketData?.length > 0) {
        setBlogProgress("Updating market data...");
        
        for (const cityData of extractedData.marketData) {
          if (!cityData.city) continue;

          const { error } = await supabase.from("market_data").upsert({
            city: cityData.city,
            source_name: extractedData.source,
            source_url: extractedData.sourceUrl,
            last_verified_date: today,
            notes: `From ${extractedData.source}: ${extractedData.title}. ${extractedData.summary}`,
            avg_price_sqft: cityData.avgPriceSqft || 0,
            appreciation_5yr: cityData.yoyChange ? Math.round(cityData.yoyChange * 4.5) : 0,
          }, { onConflict: "city" });
          
          if (error) {
            console.error(`Failed to update ${cityData.city}:`, error);
          }
        }

        toast.success(`Updated market data for ${extractedData.marketData.length} cities`);
      }

      // Generate blog post if enabled
      if (generateBlog) {
        setBlogProgress("Generating blog post...");

        const { data: blogData, error: blogError } = await supabase.functions.invoke("generate-market-blog", {
          body: {
            customData: {
              source: extractedData.source,
              sourceUrl: extractedData.sourceUrl,
              title: extractedData.title,
              summary: extractedData.summary,
              keyInsights: extractedData.keyInsights,
              marketData: extractedData.marketData,
            },
          },
        });

        if (blogError) {
          console.error("Blog generation error:", blogError);
          toast.error("Failed to generate blog post");
        } else if (blogData?.success && blogData?.data) {
          // Add source citation to content
          const citedContent = `${blogData.data.content}
<div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-left: 4px solid #f5c542; border-radius: 4px;">
  <p style="margin: 0; font-size: 14px;">
    <strong>Source:</strong> This analysis is based on research from 
    <a href="${extractedData.sourceUrl}" target="_blank" rel="noopener noreferrer">${extractedData.source}</a> - 
    "${extractedData.title}" (${extractedData.publishDate}).
  </p>
</div>`;

          // Save blog draft
          const slug = `${extractedData.source.toLowerCase().replace(/\s+/g, "-")}-${extractedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40)}-${Date.now()}`;

          const { error: saveError } = await supabase.from("blog_posts").insert({
            title: blogData.data.title,
            slug,
            excerpt: blogData.data.excerpt,
            content: citedContent,
            seo_title: blogData.data.seo_title,
            seo_description: blogData.data.seo_description,
            tags: blogData.data.tags,
            category: "Market Updates",
            is_published: false,
            is_featured: false,
          });

          if (saveError) {
            console.error("Save error:", saveError);
            toast.error("Failed to save blog draft");
          } else {
            toast.success("Blog draft created successfully");
          }
        }
      }

      // Send notification
      await supabase.functions.invoke("send-blog-draft-notification", {
        body: {
          drafts: [{
            city: extractedData.marketData?.[0]?.city || "BC Market",
            title: `${extractedData.source}: ${extractedData.title}`,
            slug: "",
          }],
          reportMonth: new Date().getMonth() + 1,
          reportYear: new Date().getFullYear(),
          board: extractedData.source,
        },
      });

      setExtractedData(null);
      setUrl("");
      onImportComplete?.();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
      setBlogProgress(null);
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          Import Research Report
        </CardTitle>
        <CardDescription>
          Paste a link from MLA Canada, Presale Pulse, or Rennie Intelligence to extract market data and generate SEO blog posts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="research-url">Research Report URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="research-url"
                type="url"
                placeholder="https://mlacanada.com/... or https://rennie.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleScrape} disabled={isProcessing || !url.trim()}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Extract Data"
              )}
            </Button>
          </div>
          {url && (
            <Badge variant="outline" className="text-xs">
              Detected: {detectSource(url)}
            </Badge>
          )}
        </div>

        {/* Supported Sources */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            MLA Canada
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Presale Pulse
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-info" />
            Rennie Intelligence
          </Badge>
        </div>

        {/* Extracted Data Preview */}
        {extractedData && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Extracted Data
              </h3>
              <Badge variant="outline">
                {extractedData.source}
              </Badge>
            </div>

            {/* Report Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{extractedData.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Summary</p>
                <p className="text-sm">{extractedData.summary}</p>
              </div>
              {extractedData.keyInsights?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Key Insights</p>
                  <ul className="space-y-1">
                    {extractedData.keyInsights.map((insight, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <TrendingUp className="h-3 w-3 mt-1 text-primary shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href={extractedData.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View Original Report <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Market Data Grid */}
            {extractedData.marketData?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Market Data ({extractedData.marketData.length} cities)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {extractedData.marketData.map((city, i) => (
                    <div key={i} className="bg-background border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{city.city || "Unknown"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block text-foreground font-medium">
                            ${city.avgPriceSqft || "—"}/sqft
                          </span>
                          Avg $/sqft
                        </div>
                        <div>
                          <span className="block text-foreground font-medium">
                            {formatPrice(city.benchmarkCondo)}
                          </span>
                          Condo Benchmark
                        </div>
                        {city.yoyChange !== undefined && (
                          <div>
                            <span className={`block font-medium ${city.yoyChange >= 0 ? "text-success" : "text-danger"}`}>
                              {city.yoyChange > 0 ? "+" : ""}{city.yoyChange?.toFixed(1)}%
                            </span>
                            YoY Change
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Update market data</p>
                    <p className="text-xs text-muted-foreground">Save city stats to database</p>
                  </div>
                </div>
                <Switch checked={updateMarketData} onCheckedChange={setUpdateMarketData} disabled={isSaving} />
              </div>

              <div className="flex items-center justify-between p-3 bg-info/5 rounded-lg border border-info/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-info" />
                  <div>
                    <p className="text-sm font-medium">Generate blog post</p>
                    <p className="text-xs text-muted-foreground">Create SEO article citing source</p>
                  </div>
                </div>
                <Switch checked={generateBlog} onCheckedChange={setGenerateBlog} disabled={isSaving} />
              </div>
            </div>

            {/* Progress */}
            {blogProgress && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{blogProgress}</span>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setExtractedData(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveData} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Data & Create Blog
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
