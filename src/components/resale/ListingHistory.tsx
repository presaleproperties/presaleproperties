import { Calendar, Clock, TrendingDown, ArrowDownRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ListingHistoryProps {
  listDate: string | null;
  currentPrice: number;
  originalPrice: number | null;
  daysOnMarket: number | null;
  modificationTimestamp?: string | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function ListingHistory({
  listDate,
  currentPrice,
  originalPrice,
  daysOnMarket,
  modificationTimestamp,
}: ListingHistoryProps) {
  // Calculate days on market if not provided
  let calculatedDom = daysOnMarket;
  if (calculatedDom === null && listDate) {
    const listDateObj = new Date(listDate);
    const today = new Date();
    calculatedDom = Math.floor((today.getTime() - listDateObj.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Check if there's been a price reduction
  const hasPriceReduction = originalPrice !== null && originalPrice > currentPrice;
  const priceReduction = hasPriceReduction ? originalPrice - currentPrice : 0;
  const priceReductionPercent = hasPriceReduction 
    ? Math.round((priceReduction / originalPrice) * 100) 
    : 0;

  // Build timeline events
  const events: Array<{
    date: string;
    label: string;
    description: string;
    type: "listed" | "price_change" | "updated";
    highlight?: boolean;
  }> = [];

  // Add list date event
  if (listDate) {
    events.push({
      date: listDate,
      label: "Listed",
      description: hasPriceReduction 
        ? `Original price: ${formatPrice(originalPrice!)}` 
        : `List price: ${formatPrice(currentPrice)}`,
      type: "listed",
    });
  }

  // Add price reduction event if applicable
  if (hasPriceReduction && modificationTimestamp) {
    events.push({
      date: modificationTimestamp,
      label: "Price Reduced",
      description: `Reduced by ${formatPrice(priceReduction)} (${priceReductionPercent}%)`,
      type: "price_change",
      highlight: true,
    });
  }

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        Listing History
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {listDate && (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Listed</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(listDate)}
              </p>
            </div>
          </div>
        )}
        {calculatedDom !== null && calculatedDom >= 0 && (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days on Market</p>
              <p className="text-sm font-medium text-foreground">
                {calculatedDom === 0 ? "New Today" : `${calculatedDom} days`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Price Reduction Alert */}
      {hasPriceReduction && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Price Reduced!
            </span>
            <Badge className="ml-auto bg-red-600 text-white text-xs">
              -{priceReductionPercent}%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="text-muted-foreground line-through">
              {formatPrice(originalPrice!)}
            </span>
            <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-foreground">
              {formatPrice(currentPrice)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Save {formatPrice(priceReduction)} off original asking price
          </p>
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Activity Timeline
          </p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            
            {events.map((event, index) => (
              <div key={index} className="relative flex gap-3 pb-3 last:pb-0">
                {/* Timeline dot */}
                <div 
                  className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 mt-0.5 ${
                    event.highlight 
                      ? "bg-red-600 border-red-600" 
                      : event.type === "listed"
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                  }`} 
                />
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium ${
                      event.highlight ? "text-red-600 dark:text-red-400" : "text-foreground"
                    }`}>
                      {event.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No history fallback */}
      {!listDate && calculatedDom === null && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No listing history available
        </p>
      )}
    </div>
  );
}