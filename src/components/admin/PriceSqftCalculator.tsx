import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, Building2, Home } from "lucide-react";
import { toast } from "sonner";

interface PriceSqftResult {
  city: string;
  property_type: 'condo' | 'townhome';
  avg_price_sqft: number;
  listing_count: number;
}

interface PriceSqftCalculatorProps {
  onCalculated?: () => void;
}

export function PriceSqftCalculator({ onCalculated }: PriceSqftCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<PriceSqftResult[] | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-price-sqft', {
        method: 'POST'
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.results || []);
        setLastRun(new Date());
        toast.success(`Updated ${data.updated} city/property combinations with verified price/sqft`);
        onCalculated?.();
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Price/sqft calculation failed:', err);
      toast.error('Failed to calculate price/sqft from MLS data');
    } finally {
      setIsCalculating(false);
    }
  };

  // Group results by property type
  const condoResults = results?.filter(r => r.property_type === 'condo') || [];
  const townhomeResults = results?.filter(r => r.property_type === 'townhome') || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleCalculate} 
          disabled={isCalculating}
          variant="default"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating from MLS...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Calculate Price/Sqft Now
            </>
          )}
        </Button>
        
        {lastRun && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            Last run: {lastRun.toLocaleTimeString()}
          </span>
        )}
      </div>

      {results && results.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Calculated from <strong>{results.reduce((acc, r) => acc + r.listing_count, 0)}</strong> active new construction listings across <strong>{new Set(results.map(r => r.city)).size}</strong> cities
          </p>
          
          {/* Condo Results */}
          {condoResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Condos ({condoResults.length} cities)
              </h4>
              <div className="flex flex-wrap gap-2">
                {condoResults.slice(0, 12).map((r, i) => (
                  <Badge key={i} variant="outline" className="gap-1.5">
                    {r.city}: <span className="font-semibold">${r.avg_price_sqft}</span>/sqft
                    <span className="text-xs text-muted-foreground">({r.listing_count})</span>
                  </Badge>
                ))}
                {condoResults.length > 12 && (
                  <Badge variant="secondary">+{condoResults.length - 12} more</Badge>
                )}
              </div>
            </div>
          )}

          {/* Townhome Results */}
          {townhomeResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Townhomes ({townhomeResults.length} cities)
              </h4>
              <div className="flex flex-wrap gap-2">
                {townhomeResults.slice(0, 12).map((r, i) => (
                  <Badge key={i} variant="outline" className="gap-1.5">
                    {r.city}: <span className="font-semibold">${r.avg_price_sqft}</span>/sqft
                    <span className="text-xs text-muted-foreground">({r.listing_count})</span>
                  </Badge>
                ))}
                {townhomeResults.length > 12 && (
                  <Badge variant="secondary">+{townhomeResults.length - 12} more</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
