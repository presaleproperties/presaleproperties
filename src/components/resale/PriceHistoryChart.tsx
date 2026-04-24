import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus, Calendar, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface PriceHistoryChartProps {
  currentPrice: number;
  originalPrice: number | null;
  listDate: string | null;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const formatFullPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

export function PriceHistoryChart({ 
  currentPrice, 
  originalPrice, 
  listDate 
}: PriceHistoryChartProps) {
  const priceData = useMemo(() => {
    const data = [];
    const today = new Date();
    const listingDate = listDate ? new Date(listDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // If we have an original price that differs from current, show the change
    if (originalPrice && originalPrice !== currentPrice) {
      // Original listing date
      data.push({
        date: listingDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        price: originalPrice,
        label: "Original Price",
        fullDate: listingDate.toISOString(),
      });
      
      // Assume price change happened roughly in the middle
      const midDate = new Date((listingDate.getTime() + today.getTime()) / 2);
      data.push({
        date: midDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        price: currentPrice,
        label: "Price Change",
        fullDate: midDate.toISOString(),
      });
      
      // Current price
      data.push({
        date: today.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        price: currentPrice,
        label: "Current Price",
        fullDate: today.toISOString(),
      });
    } else {
      // No price change - show flat line from listing to now
      data.push({
        date: listingDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        price: currentPrice,
        label: "Listed Price",
        fullDate: listingDate.toISOString(),
      });
      
      data.push({
        date: today.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        price: currentPrice,
        label: "Current Price",
        fullDate: today.toISOString(),
      });
    }
    
    return data;
  }, [currentPrice, originalPrice, listDate]);

  const priceChange = originalPrice && originalPrice !== currentPrice 
    ? currentPrice - originalPrice 
    : 0;
  
  const priceChangePercent = originalPrice && originalPrice !== currentPrice
    ? ((currentPrice - originalPrice) / originalPrice) * 100
    : 0;

  const minPrice = Math.min(...priceData.map(d => d.price)) * 0.98;
  const maxPrice = Math.max(...priceData.map(d => d.price)) * 1.02;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground">{data.label}</p>
          <p className="font-bold text-foreground">{formatFullPrice(data.price)}</p>
          <p className="text-xs text-muted-foreground">{data.date}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground">Price History</h2>
        {priceChange !== 0 && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            priceChange < 0 
              ? 'bg-success-soft text-success-strong' 
              : 'bg-danger-soft text-danger-strong'
          }`}>
            {priceChange < 0 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {priceChange < 0 ? '' : '+'}{formatFullPrice(priceChange)} ({priceChangePercent.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis 
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => formatPrice(value)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="stepAfter" 
              dataKey="price" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
            {originalPrice && originalPrice !== currentPrice && (
              <ReferenceLine 
                y={originalPrice} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Price Timeline */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="space-y-3">
          {originalPrice && originalPrice !== currentPrice && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                <span className="text-muted-foreground">Original List Price</span>
              </div>
              <span className="font-medium text-muted-foreground line-through">
                {formatFullPrice(originalPrice)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-foreground font-medium">Current Price</span>
            </div>
            <span className="font-bold text-foreground">
              {formatFullPrice(currentPrice)}
            </span>
          </div>
          {listDate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Listed</span>
              </div>
              <span className="text-muted-foreground">
                {new Date(listDate).toLocaleDateString('en-CA', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No price change message */}
      {(!originalPrice || originalPrice === currentPrice) && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Minus className="h-4 w-4" />
          <span>No price changes since listing</span>
        </div>
      )}
    </div>
  );
}

export default PriceHistoryChart;
