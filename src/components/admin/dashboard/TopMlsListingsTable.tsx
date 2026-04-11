import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Eye, MousePointerClick, FileText } from "lucide-react";

interface TopMlsListing {
  listing_id: string;
  listing_key: string;
  property_address: string;
  city: string;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  listing_price: number;
  total_views: number;
  unique_viewers: number;
  cta_clicks: number;
  form_starts: number;
}

interface TopMlsListingsTableProps {
  listings: TopMlsListing[];
}

export function TopMlsListingsTable({ listings }: TopMlsListingsTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <Card>
        <CardHeader className="py-4 px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-100 p-1.5">
              <Home className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <CardTitle className="text-sm font-semibold">Move-In Ready (MLS)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 pt-0">
          <div className="text-center py-8">
            <Home className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No listing data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-100 p-1.5">
              <Home className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <CardTitle className="text-sm font-semibold">Move-In Ready (MLS) - Last 90 Days</CardTitle>
          </div>
          <Link to="/admin/assignments?type=mls" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="space-y-0.5">
          {listings.map((listing, index) => (
            <div
              key={listing.listing_id}
              className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold text-cyan-500 bg-cyan-50 px-1.5 py-0.5 rounded shrink-0">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{listing.property_address}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>
                      {listing.bedrooms_total && `${listing.bedrooms_total}bd`}
                      {listing.bathrooms_total && listing.bedrooms_total && ' / '}
                      {listing.bathrooms_total && `${listing.bathrooms_total}ba`}
                    </span>
                    <span className="font-semibold text-foreground">
                      ${(listing.listing_price / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap" title="Total Views">
                  <Eye className="h-2.5 w-2.5" />
                  {listing.total_views}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap" title="CTA Clicks">
                  <MousePointerClick className="h-2.5 w-2.5" />
                  {listing.cta_clicks}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap" title="Form Starts">
                  <FileText className="h-2.5 w-2.5" />
                  {listing.form_starts}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
