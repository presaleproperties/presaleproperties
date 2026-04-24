import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROIInputs, ROIResults } from "@/types/roi";
import { Landmark } from "lucide-react";

interface AmortizationScheduleProps {
  inputs: ROIInputs;
  results: ROIResults;
}

interface AmortizationYear {
  year: number;
  calendarYear: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

// Calculate monthly mortgage payment
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  amortizationYears: number
): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Calculate remaining balance after n months
function calculateBalance(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  monthsPaid: number
): number {
  if (principal <= 0 || annualRate <= 0) return principal;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;
  const balance = principal * (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, monthsPaid)) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.max(0, balance);
}

export function AmortizationSchedule({ inputs, results }: AmortizationScheduleProps) {
  const { financing, purchase } = inputs;
  const amortizationYears = financing.amortizationYears;
  const mortgageAmount = results.mortgageAmount;
  const monthlyPayment = results.monthlyMortgagePayment;
  const startYear = purchase.closingYear;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Generate full amortization schedule
  const schedule = useMemo<AmortizationYear[]>(() => {
    const years: AmortizationYear[] = [];
    let remainingBalance = mortgageAmount;

    for (let year = 1; year <= amortizationYears && remainingBalance > 0; year++) {
      const startBalance = remainingBalance;
      const endBalance = calculateBalance(
        mortgageAmount,
        financing.mortgageInterestRate,
        amortizationYears,
        year * 12
      );
      
      const annualPayment = monthlyPayment * 12;
      const principalPaid = startBalance - endBalance;
      const interestPaid = annualPayment - principalPaid;
      
      years.push({
        year,
        calendarYear: startYear + year - 1,
        totalPaid: annualPayment,
        principalPaid: Math.max(0, principalPaid),
        interestPaid: Math.max(0, interestPaid),
        balance: Math.max(0, endBalance),
      });
      
      remainingBalance = endBalance;
    }
    
    return years;
  }, [mortgageAmount, financing.mortgageInterestRate, amortizationYears, monthlyPayment, startYear]);

  // Get the mortgage term years for the table (first 5 years or term length)
  const termYears = Math.min(financing.mortgageTermYears, schedule.length);
  const termSchedule = schedule.slice(0, termYears);

  // Calculate term totals
  const termTotals = useMemo(() => {
    return termSchedule.reduce(
      (acc, year) => ({
        totalPaid: acc.totalPaid + year.totalPaid,
        principalPaid: acc.principalPaid + year.principalPaid,
        interestPaid: acc.interestPaid + year.interestPaid,
      }),
      { totalPaid: 0, principalPaid: 0, interestPaid: 0 }
    );
  }, [termSchedule]);

  // Chart data - show every year but with reasonable x-axis ticks
  const chartData = schedule.map(year => ({
    year: year.calendarYear,
    interest: year.interestPaid,
    principal: year.principalPaid,
    balance: year.balance,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4 text-primary" />
          Amortization Schedule
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {amortizationYears}-year amortization • {financing.mortgageInterestRate}% interest
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Chart */}
        <div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toString()}
                  interval={Math.floor(amortizationYears / 6)}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatCurrencyShort}
                  label={{ value: 'Balance', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatCurrencyShort}
                  label={{ value: 'Payment', angle: 90, position: 'insideRight', fontSize: 11, fill: '#888' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="interest" 
                  name="Interest" 
                  stackId="a"
                  fill="hsl(200, 70%, 45%)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="principal" 
                  name="Principal" 
                  stackId="a"
                  fill="hsl(140, 60%, 45%)"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke="hsl(30, 90%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table - First term */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            First {financing.mortgageTermYears}-Year Term
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Year</TableHead>
                  <TableHead className="text-xs font-medium text-right">Total Paid</TableHead>
                  <TableHead className="text-xs font-medium text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      Principal
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-info" />
                      Interest
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termSchedule.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="text-sm font-medium">{year.calendarYear}</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(year.totalPaid)}</TableCell>
                    <TableCell className="text-sm text-right text-success dark:text-success">
                      {formatCurrency(year.principalPaid)}
                    </TableCell>
                    <TableCell className="text-sm text-right text-info dark:text-info">
                      {formatCurrency(year.interestPaid)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      {formatCurrency(year.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="bg-muted/50 border-t-2">
                  <TableCell className="text-sm font-semibold">Total (term)</TableCell>
                  <TableCell className="text-sm text-right font-semibold">
                    {formatCurrency(termTotals.totalPaid)}
                  </TableCell>
                  <TableCell className="text-sm text-right font-semibold text-success dark:text-success">
                    {formatCurrency(termTotals.principalPaid)}
                  </TableCell>
                  <TableCell className="text-sm text-right font-semibold text-info dark:text-info">
                    {formatCurrency(termTotals.interestPaid)}
                  </TableCell>
                  <TableCell className="text-sm text-right font-semibold">
                    {formatCurrency(termSchedule[termSchedule.length - 1]?.balance || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Interest (Full Amortization)</p>
            <p className="text-lg font-bold text-info dark:text-info">
              {formatCurrency(schedule.reduce((sum, y) => sum + y.interestPaid, 0))}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Mortgage Paid Off</p>
            <p className="text-lg font-bold">
              {startYear + amortizationYears}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
