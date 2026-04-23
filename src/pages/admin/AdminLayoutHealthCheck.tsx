import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";

// Vite raw glob — pulls source of every admin page at build time.
// `eager: true` means it's resolved synchronously into the bundle (small files, admin-only).
const adminPageSources = import.meta.glob("/src/pages/admin/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

// Pages that intentionally render WITHOUT AdminLayout. Keep this list tight.
const INTENTIONAL_EXCLUSIONS: Record<string, string> = {
  "AdminLogin.tsx": "Pre-auth login screen",
  "AdminRecommendationEmailPreview.tsx": "Full-screen email previewer with own chrome",
  "AdminLayoutHealthCheck.tsx": "This page (self)",
};

interface PageReport {
  file: string;
  fileName: string;
  usesLayout: boolean;
  exclusionReason: string | null;
  status: "ok" | "excluded" | "missing";
}

function buildReport(): PageReport[] {
  return Object.entries(adminPageSources)
    .map(([path, source]) => {
      const fileName = path.split("/").pop() || path;
      // Heuristic: presence of `AdminLayout` import OR JSX usage in the source.
      // Comments, strings, etc. would false-positive — accept that risk for a heuristic
      // scan. The exclusion list keeps it actionable.
      const usesLayout =
        /from\s+["'][^"']*AdminLayout["']/.test(source) &&
        /<AdminLayout[\s>]/.test(source);
      const exclusionReason = INTENTIONAL_EXCLUSIONS[fileName] ?? null;
      const status: PageReport["status"] = usesLayout
        ? "ok"
        : exclusionReason
        ? "excluded"
        : "missing";
      return { file: path, fileName, usesLayout, exclusionReason, status };
    })
    .sort((a, b) => {
      // missing first, then excluded, then ok — alpha within
      const rank = { missing: 0, excluded: 1, ok: 2 } as const;
      const r = rank[a.status] - rank[b.status];
      return r !== 0 ? r : a.fileName.localeCompare(b.fileName);
    });
}

export default function AdminLayoutHealthCheck() {
  const report = useMemo(() => buildReport(), []);

  const counts = {
    total: report.length,
    ok: report.filter((r) => r.status === "ok").length,
    excluded: report.filter((r) => r.status === "excluded").length,
    missing: report.filter((r) => r.status === "missing").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Admin Layout Health Check
          </h1>
          <p className="text-muted-foreground">
            Scans every page under <code className="text-xs bg-muted px-1 py-0.5 rounded">src/pages/admin/</code> and flags any that render without the unified <code className="text-xs bg-muted px-1 py-0.5 rounded">AdminLayout</code> wrapper.
          </p>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total admin pages</CardDescription>
              <CardTitle className="text-3xl">{counts.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Wrapped in layout</CardDescription>
              <CardTitle className="text-3xl text-green-600">{counts.ok}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Intentionally excluded</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{counts.excluded}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={counts.missing > 0 ? "border-destructive" : undefined}>
            <CardHeader className="pb-2">
              <CardDescription>Missing layout (action needed)</CardDescription>
              <CardTitle className={`text-3xl ${counts.missing > 0 ? "text-destructive" : "text-green-600"}`}>
                {counts.missing}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Failures call-out */}
        {counts.missing > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {counts.missing} page{counts.missing === 1 ? "" : "s"} missing AdminLayout
              </CardTitle>
              <CardDescription>
                Wrap the page's returned JSX in <code className="text-xs">{`<AdminLayout>…</AdminLayout>`}</code>, or add it to the intentional-exclusion list at the top of <code className="text-xs">AdminLayoutHealthCheck.tsx</code> if it's a deliberate full-screen view.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Detailed table */}
        <Card>
          <CardHeader>
            <CardTitle>All admin pages</CardTitle>
            <CardDescription>
              Sorted by status — missing first.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((r) => (
                  <TableRow key={r.file}>
                    <TableCell className="font-mono text-xs">{r.fileName}</TableCell>
                    <TableCell>
                      {r.status === "ok" && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/10">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Wrapped
                        </Badge>
                      )}
                      {r.status === "excluded" && (
                        <Badge variant="secondary">
                          <Info className="h-3 w-3 mr-1" /> Excluded
                        </Badge>
                      )}
                      {r.status === "missing" && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.exclusionReason ??
                        (r.status === "missing"
                          ? "Wrap the page's JSX in <AdminLayout> so the sidebar always renders."
                          : "—")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Heuristic: a page is considered wrapped if its source imports <code>AdminLayout</code> and renders <code>{`<AdminLayout>`}</code>. Maintain the exclusion list at the top of the source file. Back to <Link to="/admin" className="underline">Dashboard</Link>.
        </p>
      </div>
    </AdminLayout>
  );
}
