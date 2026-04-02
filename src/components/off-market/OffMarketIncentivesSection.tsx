import { Gift, CheckCircle2, Calendar, Car, Warehouse, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OffMarketIncentivesSectionProps {
  listing: any;
}

export function OffMarketIncentivesSection({ listing }: OffMarketIncentivesSectionProps) {
  const incentiveExpiry = listing?.incentive_expiry ? new Date(listing.incentive_expiry) : null;
  const daysUntilExpiry = incentiveExpiry ? Math.max(0, Math.ceil((incentiveExpiry.getTime() - Date.now()) / 86400000)) : null;

  return (
    <section id="incentives" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="mb-10 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Deal Structure</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Incentives & Details</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Incentives */}
          {(listing.incentives || listing.vip_incentives) && (
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Developer Incentives</h3>
              </div>
              {listing.incentives && <p className="text-base text-foreground/80 leading-relaxed">{listing.incentives}</p>}
              {listing.vip_incentives && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                  <Badge className="mb-2 bg-primary text-primary-foreground text-xs font-bold">VIP ONLY</Badge>
                  <p className="text-sm text-foreground/80">{listing.vip_incentives}</p>
                </div>
              )}
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                  <Calendar className="h-4 w-4" />
                  Offer expires in {daysUntilExpiry} days
                </div>
              )}
            </div>
          )}

          {/* Deposit & Details */}
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-foreground/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Deposit & Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              {listing.deposit_structure && (
                <div className="flex items-start gap-3 pb-3 border-b border-border/40">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Deposit Structure</p>
                    <p className="text-foreground font-medium">{listing.deposit_structure}</p>
                  </div>
                </div>
              )}
              {listing.deposit_percentage && (
                <div className="flex items-start gap-3 pb-3 border-b border-border/40">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Deposit %</p>
                    <p className="text-foreground font-medium">{listing.deposit_percentage}%</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {listing.parking_included ? "Parking Included" : listing.parking_cost ? `Parking: $${Number(listing.parking_cost).toLocaleString()}` : "No parking info"}
                  {listing.parking_type && <Badge variant="outline" className="text-xs ml-2">{listing.parking_type}</Badge>}
                </span>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {listing.storage_included ? "Storage Included" : listing.storage_cost ? `Storage: $${Number(listing.storage_cost).toLocaleString()}` : "No storage info"}
                </span>
              </div>
              {listing.assignment_allowed && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">Assignment Allowed {listing.assignment_fee && `(${listing.assignment_fee})`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
