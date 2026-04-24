import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  category: string;
}

interface MarketBlogGeneratorProps {
  cities: string[];
}

export function MarketBlogGenerator({ cities }: MarketBlogGeneratorProps) {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [reportMonth, setReportMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState<string>(String(new Date().getFullYear()));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!selectedCity) {
      toast.error('Please select a city');
      return;
    }

    setIsGenerating(true);
    setGeneratedBlog(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-market-blog', {
        body: {
          city: selectedCity,
          reportMonth: parseInt(reportMonth),
          reportYear: parseInt(reportYear),
        },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setGeneratedBlog(data.data);
        toast.success('Blog post generated successfully');
      } else {
        toast.error(data?.error || 'Failed to generate blog post');
      }
    } catch (error: any) {
      console.error('Error generating blog:', error);
      toast.error(error.message || 'Failed to generate blog post');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedBlog) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: generatedBlog.title,
          slug: generatedBlog.slug,
          excerpt: generatedBlog.excerpt,
          content: generatedBlog.content,
          seo_title: generatedBlog.seo_title,
          seo_description: generatedBlog.seo_description,
          tags: generatedBlog.tags,
          category: generatedBlog.category,
          is_published: false,
          is_featured: false,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Blog post saved as draft');
      navigate(`/admin/blogs/${data.id}`);
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast.error(error.message || 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Market Report
        </CardTitle>
        <CardDescription>
          Auto-generate monthly market update blog posts using your uploaded stats data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city..." />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={reportMonth} onValueChange={setReportMonth}>
              <SelectTrigger>
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

          <div>
            <Select value={reportYear} onValueChange={setReportYear}>
              <SelectTrigger>
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

        <Button 
          onClick={handleGenerate} 
          disabled={!selectedCity || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Blog Post...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Market Report Blog
            </>
          )}
        </Button>

        {/* Generated Blog Preview */}
        {generatedBlog && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Generated Blog Post
              </h3>
              <Badge variant="secondary">Draft</Badge>
            </div>

            {/* Title & Meta */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Title</p>
                <p className="font-semibold">{generatedBlog.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Excerpt</p>
                <p className="text-sm text-muted-foreground">{generatedBlog.excerpt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">URL Slug</p>
                <code className="text-xs bg-background px-2 py-1 rounded">/blog/{generatedBlog.slug}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedBlog.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="bg-background border rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Content Preview</p>
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {generatedBlog.content.slice(0, 1000)}
                  {generatedBlog.content.length > 1000 && '...'}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setGeneratedBlog(null)}
                className="flex-1"
              >
                Discard
              </Button>
              <Button
                onClick={handleSaveDraft}
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
                    <FileText className="h-4 w-4 mr-2" />
                    Save as Draft & Edit
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
