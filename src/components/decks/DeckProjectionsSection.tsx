import { Card, CardContent } from "@/components/ui/card";
import { MortgageCalculator } from "./MortgageCalculator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, DollarSign, Percent, Home } from "lucide-react";

export interface Projections {
  rental_min?: number;
  rental_max?: number;
  cap_rate_min?: number;
  cap_rate_max?: number;
  appreciation?: number[];
}

interface DeckProjectionsSectionProps {
  projections: Projections;
  defaultPrice?: number;
}

function formatCAD(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DeckProjectionsSection({ projections, defaultPrice }: DeckProjectionsSectionProps) {
  const appreciation = projections.appreciation || [4, 5, 5.5, 6, 6.5];

  const chartData = appreciation.map((pct, i) => ({
    year: `Yr ${i + 1}`,
    pct,
  }));

  const totalAppreciation5yr = appreciation.reduce((acc, pct) => acc * (1 + pct / 100), 1) - 1;
  const price = defaultPrice ?? 799900;
  const projectedValue = Math.round(price * (1 + totalAppreciation5yr));

  const stats = [
    {
      icon: DollarSign,
      label: "Rental Estimate",
      value:
        projections.rental_min && projections.rental_max
          ? `${formatCAD(projections.rental_min)}–${formatCAD(projections.rental_max)}/mo`
          : "TBD",
    },
    {
      icon: Percent,
      label: "Cap Rate",
      value:
        projections.cap_rate_min != null && projections.cap_rate_max != null
          ? `${projections.cap_rate_min}–${projections.cap_rate_max}%`
          : "TBD",
    },
    {
      icon: TrendingUp,
      label: "5-Year Appreciation",
      value: `~${(totalAppreciation5yr * 100).toFixed(1)}%`,
    },
    {
      icon: Home,
      label: "Projected Value",
      value: formatCAD(projectedValue),
    },
  ];

  return (
    <section id="projections" className="relative py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          05
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest">05 — Projections</p>
          <h2 className="text-4xl font-bold text-foreground">Investment Outlook</h2>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two column: mortgage calc + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Mortgage calculator */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">Live Mortgage Calculator</h3>
            <MortgageCalculator defaultPrice={defaultPrice} />
          </div>

          {/* Bar chart */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">5-Year Appreciation Forecast</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Appreciation"]}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="hsl(var(--primary))" opacity={0.7 + i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rental yield table */}
            {projections.rental_min && projections.rental_max && (
              <div className="mt-6 rounded-xl border border-border/50 overflow-hidden">
                <div className="bg-muted/50 px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Rental Yield Snapshot
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {[
                    ["Monthly Rent Range", `${formatCAD(projections.rental_min)} – ${formatCAD(projections.rental_max)}`],
                    ["Annual Gross Income", `${formatCAD(projections.rental_min * 12)} – ${formatCAD(projections.rental_max * 12)}`],
                    ["Cap Rate", projections.cap_rate_min != null && projections.cap_rate_max != null
                      ? `${projections.cap_rate_min}% – ${projections.cap_rate_max}%`
                      : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
