import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Search, Loader2, MapPin, Building2, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AISearchPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  project_type: string;
  starting_price: number | null;
  deposit_percent: number | null;
  completion_year: number | null;
  completion_month: number | null;
  status: string;
  featured_image: string | null;
  short_description: string | null;
  match_reasons: string[];
}

interface SearchResult {
  projects: Project[];
  explanation: string;
  filters_applied: Record<string, any>;
  clarification_needed?: string;
}

const EXAMPLE_QUERIES = [
  "1 bedroom condo in Langley under $600k",
  "Townhouse for a family in Surrey",
  "Investment condo near SkyTrain with 10% deposit",
  "2 bed in Burnaby completing in 2026",
];

export function AISearchPopup({ open, onOpenChange }: AISearchPopupProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setResult(null);
      setError(null);
    } else {
      setQuery("");
      setResult(null);
      setError(null);
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || q.length < 3) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Track AI search used
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_search_used", { query: q });
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-project-search", {
        body: { query: q },
      });

      if (fnError) {
        throw new Error(fnError.message || "Search failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as SearchResult);

      // Track results
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "ai_filters_extracted", {
          filters: JSON.stringify(data.filters_applied),
        });
        (window as any).gtag("event", data.projects?.length > 0 ? "ai_results_count" : "ai_no_results", {
          count: data.projects?.length || 0,
        });
      }
    } catch (err: any) {
      console.error("AI search error:", err);
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    // Track click
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_project_click", {
        project_id: project.id,
        project_name: project.name,
      });
    }
    onOpenChange(false);
    navigate(`/presale-projects/${project.slug}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Pricing TBD";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const formatCompletion = (year: number | null, month: number | null) => {
    if (!year) return "TBD";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month && month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return String(year);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-2xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">AI Search</h2>
            <p className="text-xs text-muted-foreground">Describe what you're looking for in plain English</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., 1 bedroom condo around $500k in Langley with 10% deposit"
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => handleSearch()}
              disabled={isLoading || query.length < 3}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Example queries */}
          {!result && !isLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {EXAMPLE_QUERIES.map((eq) => (
                <button
                  key={eq}
                  onClick={() => {
                    setQuery(eq);
                    handleSearch(eq);
                  }}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {eq}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Searching projects...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch()}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="p-4">
              {/* Explanation */}
              <div className={cn(
                "p-3 rounded-lg mb-4",
                result.projects.length > 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}>
                <p className="text-sm">{result.explanation}</p>
                {result.clarification_needed && result.projects.length === 0 && (
                  <p className="text-sm mt-2 font-medium">{result.clarification_needed}</p>
                )}
              </div>

              {/* Project Cards */}
              {result.projects.length > 0 && (
                <div className="space-y-3">
                  {result.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        {project.featured_image && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={project.featured_image}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {project.name}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {project.project_type === "townhouse" ? "Townhouse" : "Condo"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice(project.starting_price)}
                            </span>
                            {project.deposit_percent && (
                              <span>{project.deposit_percent}% deposit</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatCompletion(project.completion_year, project.completion_month)}
                            </span>
                          </div>

                          {/* Match reasons */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {project.match_reasons.slice(0, 3).map((reason, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results suggestions */}
              {result.projects.length === 0 && !result.clarification_needed && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/presale-projects");
                    }}
                  >
                    Browse All Projects
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI-powered search • Results from verified BC presale projects only
          </p>
        </div>
      </div>
    </div>
  );
}
