import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  DollarSign, 
  Home, 
  Key, 
  TrendingUp,
  Wallet,
  PiggyBank,
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

export function InvestmentTimeline({ inputs, results }: InvestmentTimelineProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { purchase, financing } = inputs;
  
  // Fallback to 'fall' if closingSeason is undefined (for backwards compatibility)
  const season = purchase.closingSeason || 'fall';
  const completionSeason = SEASON_MONTHS[season];
  
  // Calculate timeline events
  const deposit1Date = new Date();
  const deposit2Date = new Date();
  deposit2Date.setMonth(deposit2Date.getMonth() + financing.deposit2Months);
  
  const completionDate = new Date(purchase.closingYear, completionSeason.start - 1, 1);
  
  // Calculate amounts
  const deposit1Amount = purchase.purchasePrice * (financing.deposit1Percent / 100);
  const deposit2Amount = purchase.purchasePrice * (financing.deposit2Percent / 100);
  const completionAmount = results.totalCashInvested - deposit1Amount - deposit2Amount;

  const timelineEvents = [
    {
      id: 'deposit1',
      date: deposit1Date,
      label: 'First Deposit',
      sublabel: `${financing.deposit1Percent}% of purchase price`,
      amount: deposit1Amount,
      icon: Wallet,
      status: 'current' as const,
    },
    {
      id: 'deposit2',
      date: deposit2Date,
      label: 'Second Deposit',
      sublabel: `${financing.deposit2Percent}% (in ${financing.deposit2Months} months)`,
      amount: deposit2Amount,
      icon: PiggyBank,
      status: 'upcoming' as const,
    },
    {
      id: 'completion',
      date: completionDate,
      label: 'Completion',
      sublabel: `${purchase.closingSeason.charAt(0).toUpperCase() + purchase.closingSeason.slice(1)} ${purchase.closingYear}`,
      amount: completionAmount,
      icon: Key,
      status: 'future' as const,
    },
    {
      id: 'year5',
      date: new Date(purchase.closingYear + 5, completionSeason.start - 1, 1),
      label: 'Year 5 Exit',
      sublabel: 'Projected sale',
      amount: results.estimatedValueYear5,
      icon: TrendingUp,
      status: 'future' as const,
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

        {/* Timeline */}
        <div className="p-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                const isLast = index === timelineEvents.length - 1;
                
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                      event.status === 'current' 
                        ? 'bg-primary text-primary-foreground' 
                        : event.isReturn
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{event.label}</span>
                            {event.status === 'current' && (
                              <Badge variant="default" className="text-[10px] h-5">Now</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{event.sublabel}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className={`text-right shrink-0 ${
                          event.isReturn ? 'text-green-600 dark:text-green-400' : ''
                        }`}>
                          <span className={`font-semibold text-sm ${event.isReturn ? '' : ''}`}>
                            {event.isReturn ? '' : '-'}{formatCurrency(event.amount)}
                          </span>
                          {event.isReturn && (
                            <p className="text-[10px] text-muted-foreground">Est. Value</p>
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
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                +{formatCurrency(results.totalReturnDollars)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
