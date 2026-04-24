/**
 * TemplatePicker
 * ─────────────────────────────────────────────────────────────────────────
 * Smarter template selector for the compose dialog.
 *  • Search across name + project
 *  • Category chips derived from project_name
 *  • "All / Favorites / Recent" quick filters
 *  • Inline mini-preview thumbnails (iframe of saved HTML, scaled down)
 *  • Click → loads template into composer
 */
import { useMemo, useState } from "react";
import { Search, Star, Clock, FileText, X, Eye, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getSavedHtml, type SavedAsset } from "@/lib/emailTemplateHelpers";

export interface PickerTemplate {
  id: string;
  name: string;
  project_name: string | null;
  form_data: any;
  thumbnail_url?: string | null;
  is_favorited?: boolean | null;
  last_sent_at?: string | null;
  updated_at: string;
}

interface Props {
  templates: PickerTemplate[];
  selectedId?: string;
  onSelect: (tpl: PickerTemplate) => void;
}

type Filter = "all" | "favorites" | "recent";

export function TemplatePicker({ templates, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string>("__all__");
  const [previewing, setPreviewing] = useState<PickerTemplate | null>(null);
  const previewHtml = useMemo(
    () => (previewing ? getSavedHtml(previewing as unknown as SavedAsset) : ""),
    [previewing],
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of templates) {
      const c = (t.project_name || "Uncategorized").trim() || "Uncategorized";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (filter === "favorites" && !t.is_favorited) return false;
      if (filter === "recent" && !t.last_sent_at) return false;
      if (category !== "__all__") {
        const c = (t.project_name || "Uncategorized").trim() || "Uncategorized";
        if (c !== category) return false;
      }
      if (!q) return true;
      const hay = `${t.name} ${t.project_name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query, filter, category]);

  const sorted = useMemo(() => {
    if (filter === "recent") {
      return [...filtered].sort(
        (a, b) => new Date(b.last_sent_at || 0).getTime() - new Date(a.last_sent_at || 0).getTime(),
      );
    }
    return [...filtered].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [filtered, filter]);

  return (
    <div className="space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates by name or project…"
          className="h-9 pl-8 pr-8 text-xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { v: "all", label: "All", icon: FileText },
            { v: "favorites", label: "Favorites", icon: Star },
            { v: "recent", label: "Recently sent", icon: Clock },
          ] as const
        ).map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
              filter === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("__all__")}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
              category === "__all__"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All projects
          </button>
          {categories.map(([c, count]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
                category === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              title={`${count} template${count === 1 ? "" : "s"}`}
            >
              <span className="max-w-[120px] truncate">{c}</span>
              <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      <p className="text-[10px] text-muted-foreground">
        {sorted.length} {sorted.length === 1 ? "template" : "templates"}
      </p>

      {/* Grid */}
      <ScrollArea className="max-h-[360px]">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center text-xs text-muted-foreground">
            <FileText className="h-6 w-6 opacity-40" />
            No templates match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pr-2">
            {sorted.map((t) => {
              const isSelected = selectedId === t.id;
              const html = t.thumbnail_url ? null : getSavedHtml(t as unknown as SavedAsset);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:shadow-sm",
                  )}
                  onClick={() => onSelect(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(t);
                    }
                  }}
                >
                  {/* Thumbnail / mini-preview */}
                  <div className="relative h-[120px] overflow-hidden bg-muted/30">
                    {t.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.thumbnail_url}
                        alt={t.name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : html ? (
                      <div className="pointer-events-none absolute inset-0">
                        <iframe
                          srcDoc={html}
                          title={t.name}
                          sandbox=""
                          loading="lazy"
                          className="origin-top-left"
                          style={{
                            width: "600px",
                            height: "600px",
                            transform: "scale(0.32)",
                            border: 0,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        No preview
                      </div>
                    )}
                    {t.is_favorited && (
                      <Star className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-warning text-warning drop-shadow" />
                    )}
                    {/* Hover preview overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/0 opacity-0 transition-all group-hover:bg-neutral-900/40 group-hover:opacity-100 group-focus-within:bg-neutral-900/40 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewing(t);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-[10px] font-medium text-foreground shadow-md hover:bg-background"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-1 border-t border-border bg-card px-2 py-1.5">
                    <div className="line-clamp-2 text-[11px] font-medium leading-tight">
                      {t.name}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      {t.project_name ? (
                        <Badge variant="outline" className="h-4 max-w-[120px] truncate px-1 text-[9px]">
                          {t.project_name}
                        </Badge>
                      ) : (
                        <span />
                      )}
                      {t.last_sent_at && (
                        <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Full-size preview modal */}
      <Dialog open={!!previewing} onOpenChange={(v) => !v && setPreviewing(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="border-b border-border bg-muted/20 px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base">
                  {previewing?.name || "Template preview"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                  {previewing?.project_name && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">
                      {previewing.project_name}
                    </Badge>
                  )}
                  {previewing?.is_favorited && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-warning">
                      <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                      Favorited
                    </span>
                  )}
                  {previewing?.last_sent_at && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      Last sent {new Date(previewing.last_sent_at).toLocaleDateString()}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-muted/30 p-3">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="Template preview"
                sandbox=""
                className="h-[65vh] w-full rounded-md border border-border bg-card"
              />
            ) : (
              <div className="flex h-[40vh] items-center justify-center text-xs text-muted-foreground">
                No preview available for this template.
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setPreviewing(null)}>
              Close
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (previewing) {
                  onSelect(previewing);
                  setPreviewing(null);
                }
              }}
              disabled={!previewing}
            >
              <Check className="h-3.5 w-3.5" />
              Use this template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
