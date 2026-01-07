import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Home,
  DollarSign,
  Percent,
} from "lucide-react";
import { SavedAnalysis } from "@/hooks/useSavedAnalyses";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CompareAnalysesProps {
  analyses: SavedAnalysis[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function CompareAnalyses({ analyses, onBack, onDelete }: CompareAnalysesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  // Find best values for highlighting
  const bestReturn = Math.max(...analyses.map((a) => a.results.totalReturnPercent));
  const bestCashflow = Math.max(...analyses.map((a) => a.results.year5NetCashflow));
  const bestEquity = Math.max(...analyses.map((a) => a.results.estimatedEquityYear5));
  const lowestInvestment = Math.min(...analyses.map((a) => a.results.totalCashInvested));

  const MetricRow = ({
    label,
    getValue,
    format = "currency",
    highlight,
    highlightBest = true,
  }: {
    label: string;
    getValue: (a: SavedAnalysis) => number;
    format?: "currency" | "percent" | "text";
    highlight?: number;
    highlightBest?: boolean;
  }) => (
    <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${analyses.length}, 1fr)` }}>
      <div className="text-sm text-muted-foreground py-2">{label}</div>
      {analyses.map((analysis) => {
        const value = getValue(analysis);
        const isBest = highlight !== undefined && value === highlight;
        const isPositive = value >= 0;
        
        let displayValue: string;
        if (format === "currency") {
          displayValue = formatCurrency(value);
        } else if (format === "percent") {
          displayValue = formatPercent(value);
        } else {
          displayValue = String(value);
        }

        return (
          <div
            key={analysis.id}
            className={`py-2 px-3 rounded text-sm font-medium text-center ${
              isBest && highlightBest
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : format === "percent" || format === "currency"
                ? isPositive
                  ? ""
                  : "text-red-600"
                : ""
            }`}
          >
            {displayValue}
            {isBest && highlightBest && (
              <span className="ml-1 text-xs">★</span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Calculator
        </Button>
        <Badge variant="secondary">{analyses.length} Properties</Badge>
      </div>

      <h2 className="text-xl font-bold text-center">Property Comparison</h2>

      <ScrollArea className="w-full">
        <div className="min-w-[600px] space-y-6 pb-4">
          {/* Property Headers */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${analyses.length}, 1fr)` }}>
            <div />
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(analysis.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <CardContent className="p-3 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {analysis.inputs.purchase.city}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate" title={analysis.name}>
                    {analysis.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(analysis.savedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Purchase Details */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetricRow
                label="Purchase Price"
                getValue={(a) => a.inputs.purchase.purchasePrice}
              />
              <MetricRow
                label="Property Type"
                getValue={(a) => a.inputs.purchase.propertyType === "condo" ? 1 : 2}
                format="text"
              />
              <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${analyses.length}, 1fr)` }}>
                <div className="text-sm text-muted-foreground py-2">Type</div>
                {analyses.map((a) => (
                  <div key={a.id} className="py-2 px-3 text-sm text-center capitalize">
                    {a.inputs.purchase.propertyType}
                  </div>
                ))}
              </div>
              <MetricRow
                label="Completion Year"
                getValue={(a) => a.inputs.purchase.closingYear}
                format="text"
              />
            </CardContent>
          </Card>

          {/* Investment Summary */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Investment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetricRow
                label="Total Cash Invested"
                getValue={(a) => a.results.totalCashInvested}
                highlight={lowestInvestment}
              />
              <MetricRow
                label="Mortgage Amount"
                getValue={(a) => a.results.mortgageAmount}
              />
              <MetricRow
                label="Monthly Payment"
                getValue={(a) => a.results.monthlyMortgagePayment}
              />
            </CardContent>
          </Card>

          {/* 5-Year Returns */}
          <Card className="border-primary/30">
            <CardHeader className="py-3 bg-primary/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Percent className="h-4 w-4" />
                5-Year Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-3">
              <MetricRow
                label="Total Return %"
                getValue={(a) => a.results.totalReturnPercent}
                format="percent"
                highlight={bestReturn}
              />
              <MetricRow
                label="Total Return $"
                getValue={(a) => a.results.totalReturnDollars}
                highlight={Math.max(...analyses.map((a) => a.results.totalReturnDollars))}
              />
              <MetricRow
                label="Est. Value (Yr 5)"
                getValue={(a) => a.results.estimatedValueYear5}
              />
              <MetricRow
                label="Est. Equity (Yr 5)"
                getValue={(a) => a.results.estimatedEquityYear5}
                highlight={bestEquity}
              />
              <MetricRow
                label="Avg Cash-on-Cash"
                getValue={(a) => a.results.averageAnnualCashOnCash}
                format="percent"
              />
            </CardContent>
          </Card>

          {/* Cashflow */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Annual Cashflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetricRow
                label="Year 1 Cashflow"
                getValue={(a) => a.results.year1NetCashflow}
              />
              <MetricRow
                label="Year 5 Cashflow"
                getValue={(a) => a.results.year5NetCashflow}
                highlight={bestCashflow}
              />
            </CardContent>
          </Card>

          {/* Return Breakdown */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Return Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <MetricRow
                label="Appreciation"
                getValue={(a) => a.results.appreciationReturn}
              />
              <MetricRow
                label="Cashflow"
                getValue={(a) => a.results.cashflowReturn}
              />
              <MetricRow
                label="Principal Paydown"
                getValue={(a) => a.results.principalPaydownReturn}
              />
            </CardContent>
          </Card>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
          ★ Best in category
        </span>
      </div>
    </div>
  );
}
