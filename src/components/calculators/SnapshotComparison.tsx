import { SavedSnapshot } from '@/hooks/useSavedSnapshots';
import { Button } from '@/components/ui/button';
import { Trash2, TrendingUp, TrendingDown, Trophy, DollarSign, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SnapshotComparisonProps {
  snapshots: SavedSnapshot[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function SnapshotComparison({ snapshots, onDelete, onClearAll }: SnapshotComparisonProps) {
  const fmt = (value: number) => new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  if (snapshots.length === 0) {
    return null;
  }

  // Find best metrics
  const bestCashFlow = Math.max(...snapshots.map(s => s.results.monthlyCashFlow));
  const lowestInvestment = Math.min(...snapshots.map(s => s.results.totalCashRequired));
  const lowestMonthly = Math.min(...snapshots.map(s => s.results.totalMonthlyExpenses));

  const isBestCashFlow = (value: number) => value === bestCashFlow && snapshots.length > 1;
  const isLowestInvestment = (value: number) => value === lowestInvestment && snapshots.length > 1;
  const isLowestMonthly = (value: number) => value === lowestMonthly && snapshots.length > 1;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Compare Scenarios</h2>
            <span className="text-sm text-muted-foreground">({snapshots.length}/3)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            Clear All
          </Button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${snapshots.length}, minmax(200px, 1fr))` }}>
          {snapshots.map((snapshot) => {
            const isPositive = snapshot.results.monthlyCashFlow >= 0;
            
            return (
              <div key={snapshot.id} className="bg-secondary/10 rounded-xl p-4 relative">
                {/* Delete button */}
                <button
                  onClick={() => onDelete(snapshot.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Scenario Name */}
                <div className="mb-4 pr-8">
                  <h3 className="font-bold text-sm truncate">{snapshot.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {fmt(snapshot.inputs.purchasePrice)}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="space-y-3">
                  {/* Cash Flow */}
                  <div className={cn(
                    "rounded-lg p-3 text-center",
                    isPositive ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200",
                    isBestCashFlow(snapshot.results.monthlyCashFlow) && "ring-2 ring-primary ring-offset-1"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      {isBestCashFlow(snapshot.results.monthlyCashFlow) && (
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "text-xl font-bold",
                      isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositive ? '+' : ''}{fmt(snapshot.results.monthlyCashFlow)}
                    </div>
                    <div className="text-xs text-muted-foreground">Monthly Cash Flow</div>
                  </div>

                  {/* Total Investment */}
                  <div className={cn(
                    "rounded-lg p-3 bg-white border border-border/50",
                    isLowestInvestment(snapshot.results.totalCashRequired) && "ring-2 ring-primary ring-offset-1"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      {isLowestInvestment(snapshot.results.totalCashRequired) && (
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="text-lg font-bold">{fmt(snapshot.results.totalCashRequired)}</div>
                    <div className="text-xs text-muted-foreground">Total Investment</div>
                  </div>

                  {/* Monthly Costs */}
                  <div className={cn(
                    "rounded-lg p-3 bg-white border border-border/50",
                    isLowestMonthly(snapshot.results.totalMonthlyExpenses) && "ring-2 ring-primary ring-offset-1"
                  )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {isLowestMonthly(snapshot.results.totalMonthlyExpenses) && (
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="text-lg font-bold text-destructive">{fmt(snapshot.results.totalMonthlyExpenses)}</div>
                    <div className="text-xs text-muted-foreground">Monthly Costs</div>
                  </div>

                  {/* Details */}
                  <div className="pt-3 border-t border-border/50 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Down Payment</span>
                      <span className="font-medium">{snapshot.inputs.downPaymentPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate</span>
                      <span className="font-medium">{snapshot.inputs.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent</span>
                      <span className="font-medium">{fmt(snapshot.inputs.monthlyRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Cash Flow</span>
                      <span className={cn("font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                        {isPositive ? '+' : ''}{fmt(snapshot.results.annualCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {snapshots.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span>Best in category</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded ring-2 ring-primary" />
              <span>Highlighted winner</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
