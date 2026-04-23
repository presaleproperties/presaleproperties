import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Search, Code, Eye, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface SystemTemplate {
  key: string;
  name: string;
  category: string;
  subject: string;
  description: string;
  triggers: string[];
  edgeFunction: string;
  html: string;
}

export default function AdminSystemEmails() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("preview-system-emails");
        if (error) throw error;
        setTemplates(data?.templates || []);
        if (data?.templates?.length) setActiveKey(data.templates[0].key);
      } catch (e) {
        console.error("Failed to load system emails:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.triggers.some((trg) => trg.toLowerCase().includes(q))
    );
  }, [templates, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, SystemTemplate[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const active = templates.find((t) => t.key === activeKey);

  return (
    <AdminLayout>
    <div className="container mx-auto p-6 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Email Templates</h1>
            <p className="text-sm text-muted-foreground">
              All auto-generated emails the platform sends — lead magnets, project inquiries, bookings, drips & more.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, trigger, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/email-templates">
              <Mail className="h-4 w-4 mr-2" /> Editable Templates
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/email-flows">
              <ExternalLink className="h-4 w-4 mr-2" /> Email Flows
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="col-span-8">
            <Skeleton className="h-[700px] w-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar list */}
          <div className="col-span-4 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveKey(t.key)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeKey === t.key
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm leading-tight">{t.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.triggers.slice(0, 2).map((trg, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {trg}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No templates match your search.</p>
            )}
          </div>

          {/* Preview panel */}
          <div className="col-span-8">
            {active ? (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{active.category}</Badge>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                          {active.edgeFunction}
                        </code>
                      </div>
                      <CardTitle className="text-xl">{active.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Subject:</span> {active.subject}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm">{active.description}</p>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Triggered When
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {active.triggers.map((trg, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {trg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="m-4 mb-0">
                      <TabsTrigger value="preview">
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                      </TabsTrigger>
                      <TabsTrigger value="html">
                        <Code className="h-3.5 w-3.5 mr-1.5" /> HTML
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="p-4">
                      <div className="rounded-lg border overflow-hidden bg-muted/30">
                        <iframe
                          srcDoc={active.html}
                          title={active.name}
                          className="w-full bg-white"
                          style={{ height: "750px", border: "none" }}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="html" className="p-4">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[700px] font-mono">
                        {active.html}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Select a template to preview
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
