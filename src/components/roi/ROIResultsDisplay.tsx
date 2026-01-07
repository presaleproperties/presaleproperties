import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Table as TableIcon,
  Download,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  GitCompare,
  BarChart3,
  Landmark,
} from "lucide-react";
import { ROIInputs, ROIResults, DEFAULT_SCENARIOS } from "@/types/roi";
import { ROICharts } from "./ROICharts";
import { ProformaTable } from "./ProformaTable";
import { ROILeadCapture } from "./ROILeadCapture";
import { SavedAnalysesPanel } from "./SavedAnalysesPanel";
import { SavedAnalysis } from "@/hooks/useSavedAnalyses";
import { InvestmentTimeline } from "./InvestmentTimeline";
import { MortgageVsCash } from "./MortgageVsCash";
import { AmortizationSchedule } from "./AmortizationSchedule";

interface ROIResultsDisplayProps {
  inputs: ROIInputs;
  results: ROIResults;
  activeScenario: 'conservative' | 'base' | 'aggressive';
  applyScenario: (scenario: 'conservative' | 'base' | 'aggressive') => void;
  onTrackEvent?: (event: string) => void;
  // Compare feature props
  savedAnalyses?: SavedAnalysis[];
  canSave?: boolean;
  canCompare?: boolean;
  maxSaved?: number;
  onSaveAnalysis?: (inputs: ROIInputs, results: ROIResults) => { success: boolean; error?: string };
  onDeleteAnalysis?: (id: string) => void;
  onCompare?: () => void;
}

export function ROIResultsDisplay({
  inputs,
  results,
  activeScenario,
  applyScenario,
  onTrackEvent,
  savedAnalyses = [],
  canSave = true,
  canCompare = false,
  maxSaved = 3,
  onSaveAnalysis,
  onDeleteAnalysis,
  onCompare,
}: ROIResultsDisplayProps) {
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const scenarios = ['conservative', 'base', 'aggressive'] as const;

  return (
    <div className="space-y-6">
      {/* Scenario Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Scenario Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {scenarios.map((key) => {
              const scenario = DEFAULT_SCENARIOS[key];
              return (
                <button
                  key={key}
                  onClick={() => applyScenario(key)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    activeScenario === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted border-border"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">{scenario.name}</div>
                  <div className="text-xs opacity-80">
                    {scenario.priceGrowth}% growth
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Scenarios adjust price growth, rent growth, vacancy, and interest rates
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Cash Invested</div>
            <div className="text-xl font-bold">{formatCurrency(results.totalCashInvested)}</div>
          </CardContent>
        </Card>
        <Card className={`${results.totalReturnPercent >= 0 ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">5-Year Total Return</div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">{formatPercent(results.totalReturnPercent)}</span>
              {results.totalReturnPercent >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(results.totalReturnDollars)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Down Payment:</span>
              <span className="font-medium">{formatCurrency(results.totalDeposit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Closing Costs:</span>
              <span className="font-medium">{formatCurrency(results.totalClosingCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mortgage Amount:</span>
              <span className="font-medium">{formatCurrency(results.mortgageAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Payment:</span>
              <span className="font-medium">{formatCurrency(results.monthlyMortgagePayment)}</span>
            </div>
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Year 1 Net Cashflow:</span>
              <span className={`font-medium ${results.year1NetCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(results.year1NetCashflow)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Year 5 Net Cashflow:</span>
              <span className={`font-medium ${results.year5NetCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(results.year5NetCashflow)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Value (Year 5):</span>
              <span className="font-medium">{formatCurrency(results.estimatedValueYear5)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Equity (Year 5):</span>
              <span className="font-medium text-primary">{formatCurrency(results.estimatedEquityYear5)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. Cash-on-Cash Return:</span>
              <span className="font-medium">{formatPercent(results.averageAnnualCashOnCash)}/yr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Analysis Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 py-2 text-xs">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex flex-col items-center gap-1 py-2 text-xs">
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Cash vs Mtg</span>
          </TabsTrigger>
          <TabsTrigger value="amortization" className="flex flex-col items-center gap-1 py-2 text-xs">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Amortization</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex flex-col items-center gap-1 py-2 text-xs">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="proforma" className="flex flex-col items-center gap-1 py-2 text-xs">
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Proforma</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <InvestmentTimeline inputs={inputs} results={results} />
        </TabsContent>
        <TabsContent value="comparison" className="mt-4">
          <MortgageVsCash inputs={inputs} results={results} />
        </TabsContent>
        <TabsContent value="amortization" className="mt-4">
          <AmortizationSchedule inputs={inputs} results={results} />
        </TabsContent>
        <TabsContent value="charts" className="mt-4">
          <ROICharts results={results} />
        </TabsContent>
        <TabsContent value="proforma" className="mt-4">
          <ProformaTable projections={results.yearlyProjections} />
        </TabsContent>
      </Tabs>

      {/* Return Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4" />
            Return Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Appreciation</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(results.appreciationReturn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm">Principal Paydown</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(results.principalPaydownReturn)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compare Properties Panel */}
      {onSaveAnalysis && onDeleteAnalysis && onCompare && (
        <SavedAnalysesPanel
          savedAnalyses={savedAnalyses}
          canSave={canSave}
          canCompare={canCompare}
          maxSaved={maxSaved}
          currentInputs={inputs}
          currentResults={results}
          onSave={onSaveAnalysis}
          onDelete={onDeleteAnalysis}
          onCompare={onCompare}
        />
      )}

      {/* Lead Capture */}
      {showLeadCapture ? (
        <ROILeadCapture 
          inputs={inputs} 
          results={results}
          onTrackEvent={onTrackEvent}
        />
      ) : (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <h3 className="font-semibold">Save Your Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Get a detailed PDF report emailed to you with your complete 5-year investment projection.
              </p>
              <Button 
                onClick={() => setShowLeadCapture(true)}
                className="w-full sm:w-auto"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email My Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
        <strong>Disclaimer:</strong> These calculations are estimates only and should not be considered 
        financial, legal, or tax advice. Actual returns may vary significantly based on market conditions, 
        interest rates, and other factors. Consult with licensed professionals before making investment decisions.
      </div>
    </div>
  );
}
