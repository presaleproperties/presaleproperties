import { Calendar, Clock, TrendingDown, ArrowDownRight, History, Flame, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PriceHistoryEntry {
  id: string;
  recorded_at: string;
  price: number;
  previous_price: number | null;
}

// Market activity thresholds
const MARKET_THRESHOLDS = {
  HOT: 7,           // Under 7 days = Hot listing
  NORMAL: 60,       // 7-60 days = Normal
  OPPORTUNITY: 60,  // 60+ days = Opportunity for negotiation
};

interface ListingHistoryProps {
  listingKey: string;
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
  listingKey,
  listDate,
  currentPrice,
  originalPrice,
  daysOnMarket,
  modificationTimestamp,
}: ListingHistoryProps) {
  // Fetch price history from database
  const { data: priceHistory } = useQuery({
    queryKey: ["priceHistory", listingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_price_history")
        .select("*")
        .eq("listing_key", listingKey)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Error fetching price history:", error);
        return [];
      }
      return data as PriceHistoryEntry[];
    },
    enabled: !!listingKey,
  });

  // Calculate days on market if not provided
  let calculatedDom = daysOnMarket;
  if (calculatedDom === null && listDate) {
    const listDateObj = new Date(listDate);
    const today = new Date();
    calculatedDom = Math.floor((today.getTime() - listDateObj.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Check if there's been a price reduction (from API or from our tracked history)
  const hasPriceReductionFromApi = originalPrice !== null && originalPrice > currentPrice;
  const hasPriceReductionFromHistory = priceHistory && priceHistory.length > 0;
  const hasPriceReduction = hasPriceReductionFromApi || hasPriceReductionFromHistory;

  // Calculate total price reduction
  let totalOriginalPrice = originalPrice;
  if (!totalOriginalPrice && priceHistory && priceHistory.length > 0) {
    // Get the first recorded previous_price as the original
    totalOriginalPrice = priceHistory[0].previous_price || priceHistory[0].price;
  }

  const priceReduction = totalOriginalPrice && totalOriginalPrice > currentPrice 
    ? totalOriginalPrice - currentPrice 
    : 0;
  const priceReductionPercent = totalOriginalPrice && priceReduction > 0
    ? Math.round((priceReduction / totalOriginalPrice) * 100) 
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
    const initialPrice = totalOriginalPrice || currentPrice;
    events.push({
      date: listDate,
      label: "Listed",
      description: `List price: ${formatPrice(initialPrice)}`,
      type: "listed",
    });
  }

  // Add price change events from our tracked history
  if (priceHistory && priceHistory.length > 0) {
    priceHistory.forEach((entry) => {
      const changeAmount = entry.previous_price ? entry.previous_price - entry.price : 0;
      const changePercent = entry.previous_price 
        ? Math.round((changeAmount / entry.previous_price) * 100)
        : 0;
      
      events.push({
        date: entry.recorded_at,
        label: changeAmount > 0 ? "Price Reduced" : "Price Changed",
        description: changeAmount > 0 
          ? `Reduced by ${formatPrice(changeAmount)} (${changePercent}%) to ${formatPrice(entry.price)}`
          : `Changed to ${formatPrice(entry.price)}`,
        type: "price_change",
        highlight: changeAmount > 0,
      });
    });
  } else if (hasPriceReductionFromApi && modificationTimestamp) {
    // Fallback to API-provided original price if no tracked history
    events.push({
      date: modificationTimestamp,
      label: "Price Reduced",
      description: `Reduced by ${formatPrice(priceReduction)} (${priceReductionPercent}%)`,
      type: "price_change",
      highlight: true,
    });
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        Listing History
      </h3>

      {/* Market Activity Badges */}
      {calculatedDom !== null && (
        <div className="mb-4">
          {calculatedDom <= MARKET_THRESHOLDS.HOT && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-orange-500">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    Hot Listing!
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Listed {calculatedDom === 0 ? "today" : calculatedDom === 1 ? "yesterday" : `${calculatedDom} days ago`} - Act fast!
                  </p>
                </div>
                <Badge className="ml-auto bg-orange-500 text-white text-xs">
                  NEW
                </Badge>
              </div>
            </div>
          )}
          {calculatedDom >= MARKET_THRESHOLDS.OPPORTUNITY && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-600">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Negotiation Opportunity
                  </span>
                  <p className="text-xs text-muted-foreground">
                    On market for {calculatedDom} days - seller may be motivated
                  </p>
                </div>
                <Badge className="ml-auto bg-amber-600 text-white text-xs">
                  {calculatedDom}+ DAYS
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

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
      {hasPriceReduction && priceReduction > 0 && (
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
              {formatPrice(totalOriginalPrice!)}
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
