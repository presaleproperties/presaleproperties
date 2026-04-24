import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Wallet,
  PiggyBank,
  Key,
  TrendingUp,
  HardHat,
  Banknote,
} from "lucide-react";
import { ROIInputs, ROIResults, CompletionSeason } from "@/types/roi";

interface InvestmentTimelineProps {
  inputs: ROIInputs;
  results: ROIResults;
}

const SEASON_MONTHS: Record<CompletionSeason, { start: number; label: string }> = {
  spring: { start: 3, label: 'Mar-May' },
  summer: { start: 6, label: 'Jun-Aug' },
  fall: { start: 9, label: 'Sep-Nov' },
  winter: { start: 12, label: 'Dec-Feb' },
};

// Color coding for different phases
const PHASE_COLORS = {
  deposit: {
    bg: 'bg-warning',
    text: 'text-on-dark',
    ring: 'ring-warning',
  },
  construction: {
    bg: 'bg-neutral-500',
    text: 'text-on-dark',
    ring: 'ring-ring',
  },
  completion: {
    bg: 'bg-info',
    text: 'text-on-dark',
    ring: 'ring-info',
  },
  mortgage: {
    bg: 'bg-primary',
    text: 'text-on-dark',
    ring: 'ring-primary',
  },
  exit: {
    bg: 'bg-success',
    text: 'text-on-dark',
    ring: 'ring-success',
  },
};

export function InvestmentTimeline({ inputs, results }: InvestmentTimelineProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { purchase, financing } = inputs;
  
  // Fallback to 'fall' if closingSeason is undefined (for backwards compatibility)
  const season = purchase.closingSeason || 'fall';
  const completionSeason = SEASON_MONTHS[season];
  
  // Calculate timeline events
  const deposit1Date = new Date();
  const deposit2Date = new Date();
  deposit2Date.setMonth(deposit2Date.getMonth() + financing.deposit2Months);
  
  const completionDate = new Date(purchase.closingYear, completionSeason.start - 1, 1);
  const exitDate = new Date(purchase.closingYear + 5, completionSeason.start - 1, 1);
  
  // Calculate amounts
  const deposit1Amount = purchase.purchasePrice * (financing.deposit1Percent / 100);
  const deposit2Amount = purchase.purchasePrice * (financing.deposit2Percent / 100);
  const totalDeposits = deposit1Amount + deposit2Amount;
  const cashOnCompletion = results.totalCashInvested - totalDeposits;

  // Calculate construction period
  const monthsUntilCompletion = Math.max(0, 
    (completionDate.getFullYear() - new Date().getFullYear()) * 12 + 
    (completionDate.getMonth() - new Date().getMonth())
  );

  const timelineEvents = [
    {
      id: 'deposit1',
      date: deposit1Date,
      label: 'First Deposit',
      sublabel: `${financing.deposit1Percent}% of purchase price`,
      amount: deposit1Amount,
      icon: Wallet,
      phase: 'deposit' as const,
      isCurrent: true,
    },
    {
      id: 'deposit2',
      date: deposit2Date,
      label: 'Second Deposit',
      sublabel: `${financing.deposit2Percent}% (in ${financing.deposit2Months} months)`,
      amount: deposit2Amount,
      icon: PiggyBank,
      phase: 'deposit' as const,
      isCurrent: false,
    },
    {
      id: 'construction',
      date: deposit2Date,
      label: 'Under Construction',
      sublabel: `~${monthsUntilCompletion} months until completion`,
      amount: null,
      icon: HardHat,
      phase: 'construction' as const,
      isCurrent: false,
      isPhaseIndicator: true,
    },
    {
      id: 'completion',
      date: completionDate,
      label: 'Cash on Completion',
      sublabel: `Down payment minus deposits`,
      amount: cashOnCompletion,
      icon: Key,
      phase: 'completion' as const,
      isCurrent: false,
      detail: `${financing.downPaymentPercent}% down - ${financing.deposit1Percent + financing.deposit2Percent}% deposits`,
    },
    {
      id: 'mortgage',
      date: completionDate,
      label: 'Mortgage Starts',
      sublabel: `${formatCurrency(results.mortgageAmount)} @ ${financing.mortgageInterestRate}%`,
      amount: results.monthlyMortgagePayment,
      icon: Banknote,
      phase: 'mortgage' as const,
      isCurrent: false,
      isMonthly: true,
    },
    {
      id: 'year5',
      date: exitDate,
      label: 'Year 5 Exit',
      sublabel: 'Projected sale',
      amount: results.estimatedValueYear5,
      icon: TrendingUp,
      phase: 'exit' as const,
      isCurrent: false,
      isReturn: true,
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Investment Timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Key dates and amounts for your presale investment
          </p>
        </div>

        {/* Color Legend */}
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${PHASE_COLORS.deposit.bg}`} />
            <span className="text-[10px] text-muted-foreground">Deposits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${PHASE_COLORS.construction.bg}`} />
            <span className="text-[10px] text-muted-foreground">Construction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${PHASE_COLORS.completion.bg}`} />
            <span className="text-[10px] text-muted-foreground">Completion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${PHASE_COLORS.mortgage.bg}`} />
            <span className="text-[10px] text-muted-foreground">Mortgage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${PHASE_COLORS.exit.bg}`} />
            <span className="text-[10px] text-muted-foreground">Exit</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 pt-2">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border" />
            
            <div className="space-y-5">
              {timelineEvents.map((event) => {
                const Icon = event.icon;
                const colors = PHASE_COLORS[event.phase];
                
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${colors.bg} ${colors.text} ring-2 ${colors.ring}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{event.label}</span>
                            {event.isCurrent && (
                              <Badge variant="default" className="text-[10px] h-5 bg-warning hover:bg-warning">Now</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{event.sublabel}</p>
                          {event.detail && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{event.detail}</p>
                          )}
                          {!event.isPhaseIndicator && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(event.date)}
                            </p>
                          )}
                        </div>
                        <div className={`text-right shrink-0 ${
                          event.isReturn ? 'text-success dark:text-success' : ''
                        }`}>
                          {event.amount !== null && (
                            <>
                              <span className="font-semibold text-sm">
                                {event.isReturn ? '' : '-'}{formatCurrency(event.amount)}
                              </span>
                              {event.isMonthly && (
                                <p className="text-[10px] text-muted-foreground">/month</p>
                              )}
                              {event.isReturn && (
                                <p className="text-[10px] text-muted-foreground">Est. Value</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 p-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Cash Needed</p>
              <p className="font-bold text-lg">{formatCurrency(results.totalCashInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Return (5yr)</p>
              <p className="font-bold text-lg text-success dark:text-success">
                +{formatCurrency(results.totalReturnDollars)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
