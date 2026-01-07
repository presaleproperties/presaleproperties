import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { ROIResults } from "@/types/roi";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ROIChartsProps {
  results: ROIResults;
}

export function ROICharts({ results }: ROIChartsProps) {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Cashflow by year data
  const cashflowData = results.yearlyProjections.map((p) => ({
    year: `Year ${p.year}`,
    cashflow: Math.round(p.netCashflow),
    positive: p.netCashflow >= 0,
  }));

  // Equity by year data
  const equityData = results.yearlyProjections.map((p) => ({
    year: `Year ${p.year}`,
    equity: Math.round(p.equity),
    value: Math.round(p.estimatedValue),
    mortgage: Math.round(p.mortgageBalance),
  }));

  // Return breakdown data
  const returnBreakdownData = [
    { name: "Appreciation", value: Math.max(0, results.appreciationReturn), fill: "hsl(var(--chart-1))" },
    { name: "Cashflow", value: Math.max(0, results.cashflowReturn), fill: "hsl(var(--chart-2))" },
    { name: "Principal", value: results.principalPaydownReturn, fill: "hsl(var(--chart-3))" },
  ].filter(d => d.value > 0);

  const chartConfig = {
    cashflow: { label: "Net Cashflow", color: "hsl(var(--chart-1))" },
    equity: { label: "Equity", color: "hsl(var(--chart-2))" },
    value: { label: "Property Value", color: "hsl(var(--chart-3))" },
    mortgage: { label: "Mortgage Balance", color: "hsl(var(--chart-4))" },
  };

  return (
    <div className="space-y-4">
      {/* Cashflow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Annual Net Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <Bar dataKey="cashflow" radius={[4, 4, 0, 0]}>
                {cashflowData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.positive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Equity Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Equity & Value Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={equityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-3))" }}
                name="Property Value"
              />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
                name="Equity"
              />
              <Line 
                type="monotone" 
                dataKey="mortgage" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-4))" }}
                name="Mortgage Balance"
              />
            </LineChart>
          </ChartContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[hsl(var(--chart-3))]" />
              <span>Value</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[hsl(var(--chart-2))]" />
              <span>Equity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[hsl(var(--chart-4))] border-dashed" />
              <span>Mortgage</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Breakdown Pie */}
      {returnBreakdownData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Return Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={returnBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {returnBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
