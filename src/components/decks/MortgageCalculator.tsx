import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AMORTIZATION_OPTIONS = [15, 20, 25, 30];

function formatCAD(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function MortgageCalculator({ defaultPrice = 799900 }: { defaultPrice?: number }) {
  const [price, setPrice] = useState(Math.min(Math.max(defaultPrice, 300000), 2000000));
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [amort, setAmort] = useState(25);

  const { monthly, principal, downAmt } = useMemo(() => {
    const downAmt = Math.round((price * downPct) / 100);
    const principal = price - downAmt;
    const r = rate / 100 / 12;
    const n = amort * 12;
    let monthly: number;
    if (r === 0) {
      monthly = principal / n;
    } else {
      monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    return { monthly, principal, downAmt };
  }, [price, downPct, rate, amort]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Purchase Price */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Purchase Price</span>
            <span className="text-sm font-bold text-primary">{formatCAD(price)}</span>
          </div>
          <Slider
            min={300000}
            max={2000000}
            step={25000}
            value={[price]}
            onValueChange={([v]) => setPrice(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>$300K</span>
            <span>$2M</span>
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Down Payment</span>
            <span className="text-sm font-bold text-primary">{downPct}% · {formatCAD(downAmt)}</span>
          </div>
          <Slider
            min={5}
            max={50}
            step={1}
            value={[downPct]}
            onValueChange={([v]) => setDownPct(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Interest Rate</span>
            <span className="text-sm font-bold text-primary">{rate.toFixed(1)}%</span>
          </div>
          <Slider
            min={2}
            max={9}
            step={0.1}
            value={[rate]}
            onValueChange={([v]) => setRate(parseFloat(v.toFixed(1)))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>2%</span>
            <span>9%</span>
          </div>
        </div>

        {/* Amortization */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Amortization</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {AMORTIZATION_OPTIONS.map((yr) => (
              <button
                key={yr}
                onClick={() => setAmort(yr)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  amort === yr
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {yr} yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Est. Monthly Payment</p>
            <p className="text-4xl font-bold text-primary">{formatCAD(monthly)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              on {formatCAD(principal)} mortgage · {rate}% · {amort} yr amort
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/10">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-sm font-semibold text-foreground">{formatCAD(monthly * amort * 12 - principal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-sm font-semibold text-foreground">{formatCAD(monthly * amort * 12 + downAmt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        * Estimate only. Does not include CMHC insurance, strata fees, property tax, or closing costs.
        Consult a mortgage professional for accurate figures.
      </p>
    </div>
  );
}
