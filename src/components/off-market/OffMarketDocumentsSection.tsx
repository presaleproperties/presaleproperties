import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOffMarketEvent } from "@/lib/offMarketAnalytics";

interface OffMarketDocumentsSectionProps {
  listing: any;
}

export function OffMarketDocumentsSection({ listing }: OffMarketDocumentsSectionProps) {
  const docs = [
    listing.pricing_sheet_url && { label: "Pricing Sheet", url: listing.pricing_sheet_url, event: "pricing_download" },
    listing.brochure_url && { label: "Brochure", url: listing.brochure_url, event: "floorplan_download" },
    listing.info_sheet_url && { label: "Info Sheet", url: listing.info_sheet_url, event: "floorplan_download" },
  ].filter(Boolean) as { label: string; url: string; event: string }[];

  if (docs.length === 0) return null;

  return (
    <section id="documents" className="py-16 sm:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-10 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">05 — Resources</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Download Documents</h2>
          <p className="text-muted-foreground text-sm max-w-lg">
            Access pricing sheets, brochures, and project info exclusively for VIP buyers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <a
              key={doc.label}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOffMarketEvent(doc.event as any, listing.id)}
              className="group flex items-center justify-between p-5 rounded-2xl border-2 border-border bg-background hover:border-primary hover:shadow-lg transition-all duration-300"
            >
              <div>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{doc.label}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF Download</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Download className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
