import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Banknote,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { ROIInputs, ROIResults } from "@/types/roi";

interface MortgageVsCashProps {
  inputs: ROIInputs;
  results: ROIResults;
}

export function MortgageVsCash({ inputs, results }: MortgageVsCashProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const { purchase, financing, exit } = inputs;
  
  // Calculate cash purchase scenario (no mortgage)
  const cashPurchaseAmount = purchase.purchasePrice + results.totalClosingCosts;
  
  // For cash scenario, all rental income is profit (no mortgage payment)
  const cashYearlyProjections = results.yearlyProjections.map(proj => ({
    ...proj,
    netCashflow: proj.noi, // NOI without mortgage payment
    cumulativeCashflow: 0, // Will recalculate
  }));
  
  // Recalculate cumulative for cash scenario
  let cashCumulative = 0;
  cashYearlyProjections.forEach(proj => {
    cashCumulative += proj.netCashflow;
    proj.cumulativeCashflow = cashCumulative;
  });
  
  const cashYear5 = cashYearlyProjections[4];
  const cashTotalCashflow = cashYearlyProjections.reduce((sum, y) => sum + y.netCashflow, 0);
  
  // Cash scenario returns
  const cashAppreciation = cashYear5.estimatedValue - purchase.purchasePrice;
  const cashSellingCosts = cashYear5.estimatedValue * (exit.sellingCostPercent / 100);
  const cashNetProceeds = cashYear5.estimatedValue - cashSellingCosts;
  const cashTotalReturn = cashNetProceeds - cashPurchaseAmount + cashTotalCashflow;
  const cashReturnPercent = (cashTotalReturn / cashPurchaseAmount) * 100;
  const cashAnnualizedReturn = Math.pow(1 + cashReturnPercent / 100, 1/5) - 1;
  
  // Mortgage scenario (from existing results)
  const mortgageReturnPercent = results.totalReturnPercent;
  const mortgageAnnualizedReturn = Math.pow(1 + mortgageReturnPercent / 100, 1/5) - 1;

  // Leverage multiplier
  const leverageMultiplier = mortgageReturnPercent / cashReturnPercent;

  const scenarios = [
    {
      id: 'mortgage',
      title: 'With Mortgage',
      icon: Banknote,
      color: 'primary',
      bgColor: 'bg-primary/5 border-primary/20',
      investment: results.totalCashInvested,
      totalReturn: results.totalReturnDollars,
      returnPercent: mortgageReturnPercent,
      annualized: mortgageAnnualizedReturn * 100,
      year1Cashflow: results.year1NetCashflow,
      year5Cashflow: results.year5NetCashflow,
      totalCashflow: results.cashflowReturn,
      appreciation: results.appreciationReturn,
      principalPaydown: results.principalPaydownReturn,
      pros: [
        'Lower initial investment',
        'Higher ROI through leverage',
        'Preserve capital for other investments',
      ],
      cons: [
        'Monthly mortgage payments',
        'Interest costs reduce cashflow',
        'Market risk on larger asset',
      ],
    },
    {
      id: 'cash',
      title: 'Cash Purchase',
      icon: Wallet,
      color: 'secondary',
      bgColor: 'bg-muted/50 border-border',
      investment: cashPurchaseAmount,
      totalReturn: cashTotalReturn,
      returnPercent: cashReturnPercent,
      annualized: cashAnnualizedReturn * 100,
      year1Cashflow: cashYearlyProjections[0].netCashflow,
      year5Cashflow: cashYear5.netCashflow,
      totalCashflow: cashTotalCashflow,
      appreciation: cashAppreciation,
      principalPaydown: 0,
      pros: [
        'No mortgage payments',
        'Positive cashflow from day one',
        'Lower stress, no debt',
      ],
      cons: [
        'Large capital requirement',
        'Lower percentage returns',
        'Opportunity cost of tied-up capital',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm mb-1">Leverage Effect</h3>
              <p className="text-xs text-muted-foreground">
                Mortgage vs. Cash Purchase Comparison
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {leverageMultiplier.toFixed(1)}x
              </div>
              <p className="text-xs text-muted-foreground">ROI multiplier</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isPositiveReturn = scenario.returnPercent >= 0;
          const isPositiveCashflow = scenario.year1Cashflow >= 0;
          
          return (
            <Card key={scenario.id} className={scenario.bgColor}>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${
                    scenario.id === 'mortgage' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${
                      scenario.id === 'mortgage' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <CardTitle className="text-xs font-medium">{scenario.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                {/* Investment */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investment</p>
                  <p className="text-sm font-semibold">{formatCurrency(scenario.investment)}</p>
                </div>

                {/* Return */}
                <div className={`p-2 rounded-lg ${
                  isPositiveReturn 
                    ? 'bg-success-soft dark:bg-success-strong/30' 
                    : 'bg-danger-soft dark:bg-danger-strong/30'
                }`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">5-Year Return</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${
                      isPositiveReturn ? 'text-success dark:text-success' : 'text-danger'
                    }`}>
                      {formatPercent(scenario.returnPercent)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(scenario.totalReturn)}
                  </p>
                </div>

                {/* Annualized */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Annualized</p>
                  <p className="text-sm font-medium">{formatPercent(scenario.annualized)}/yr</p>
                </div>

                {/* Cashflow */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Year 1 Cashflow</p>
                  <p className={`text-sm font-medium ${
                    isPositiveCashflow ? 'text-success dark:text-success' : 'text-danger'
                  }`}>
                    {formatCurrency(scenario.year1Cashflow)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComparisonRow 
            label="Initial Investment"
            mortgage={formatCurrency(scenarios[0].investment)}
            cash={formatCurrency(scenarios[1].investment)}
          />
          <ComparisonRow 
            label="5-Year Total Return"
            mortgage={formatPercent(scenarios[0].returnPercent)}
            cash={formatPercent(scenarios[1].returnPercent)}
            highlight="mortgage"
          />
          <ComparisonRow 
            label="Total Return ($)"
            mortgage={formatCurrency(scenarios[0].totalReturn)}
            cash={formatCurrency(scenarios[1].totalReturn)}
          />
          <ComparisonRow 
            label="Appreciation Gain"
            mortgage={formatCurrency(scenarios[0].appreciation)}
            cash={formatCurrency(scenarios[1].appreciation)}
          />
          <ComparisonRow 
            label="5-Year Cashflow"
            mortgage={formatCurrency(scenarios[0].totalCashflow)}
            cash={formatCurrency(scenarios[1].totalCashflow)}
            highlight={scenarios[0].totalCashflow > scenarios[1].totalCashflow ? 'mortgage' : 'cash'}
          />
          <ComparisonRow 
            label="Principal Paydown"
            mortgage={formatCurrency(scenarios[0].principalPaydown)}
            cash="N/A"
          />
        </CardContent>
      </Card>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-3">
        {scenarios.map((scenario) => (
          <Card key={`pros-${scenario.id}`} className="overflow-hidden">
            <div className={`px-3 py-2 ${
              scenario.id === 'mortgage' ? 'bg-primary/10' : 'bg-muted/50'
            }`}>
              <p className="text-xs font-medium">{scenario.title}</p>
            </div>
            <CardContent className="p-3 space-y-2">
              {scenario.pros.slice(0, 2).map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  <span className="text-xs">{pro}</span>
                </div>
              ))}
              {scenario.cons.slice(0, 2).map((con, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <X className="h-3 w-3 text-danger mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{con}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ComparisonRow({ 
  label, 
  mortgage, 
  cash, 
  highlight 
}: { 
  label: string; 
  mortgage: string; 
  cash: string;
  highlight?: 'mortgage' | 'cash';
}) {
  return (
    <div className="grid grid-cols-[1fr,80px,80px] gap-2 items-center text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-right font-medium ${
        highlight === 'mortgage' ? 'text-primary' : ''
      }`}>
        {mortgage}
        {highlight === 'mortgage' && <span className="ml-1">★</span>}
      </span>
      <span className={`text-right font-medium ${
        highlight === 'cash' ? 'text-primary' : ''
      }`}>
        {cash}
        {highlight === 'cash' && <span className="ml-1">★</span>}
      </span>
    </div>
  );
}
