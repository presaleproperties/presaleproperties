import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileStack, Eye, MapPin, DollarSign } from "lucide-react";

interface TopListing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  assignment_price: number;
  status: string;
  view_count: number;
  lead_count: number;
}

interface TopListingsTableProps {
  listings: TopListing[];
}

export function TopListingsTable({ listings }: TopListingsTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <Card>
        <CardHeader className="py-4 px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <FileStack className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Top Listings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 pt-0">
          <div className="text-center py-8">
            <FileStack className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
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
            <div className="rounded-lg bg-primary/10 p-1.5">
              <FileStack className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Top Listings (Assignments)</CardTitle>
          </div>
          <Link to="/admin/assignments" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="space-y-0.5">
          {listings.map((listing, index) => (
            <div 
              key={listing.id} 
              className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {listing.city}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <DollarSign className="h-2.5 w-2.5" />
                      {listing.assignment_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5" title="Views">
                  <Eye className="h-2.5 w-2.5" />
                  {listing.view_count}
                </span>
                <Badge 
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    listing.status === 'published' ? 'bg-success-soft text-success-strong border-success/30' :
                    listing.status === 'pending_approval' ? 'bg-warning-soft text-warning-strong border-warning/30' :
                    ''
                  }`}
                >
                  {listing.status === 'pending_approval' ? 'pending' : listing.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
