import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Info, DollarSign } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InteractiveMortgageCalculatorProps {
  defaultPrice?: number;
}

export function InteractiveMortgageCalculator({ defaultPrice = 650000 }: InteractiveMortgageCalculatorProps) {
  const [price, setPrice] = useState(defaultPrice);
  const [priceInput, setPriceInput] = useState(defaultPrice.toString());
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(5.5);
  const [amortization, setAmortization] = useState(25);

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue) && numValue > 0) {
      setPrice(numValue);
    }
  };

  const handlePriceBlur = () => {
    setPriceInput(price.toLocaleString());
  };

  const handlePriceFocus = () => {
    setPriceInput(price.toString());
  };

  const calculations = useMemo(() => {
    const downPayment = (price * downPaymentPercent) / 100;
    const principal = price - downPayment;
    
    // CMHC insurance for down payments less than 20%
    let cmhcInsurance = 0;
    if (downPaymentPercent < 20) {
      if (downPaymentPercent >= 15) {
        cmhcInsurance = principal * 0.028;
      } else if (downPaymentPercent >= 10) {
        cmhcInsurance = principal * 0.031;
      } else {
        cmhcInsurance = principal * 0.04;
      }
    }
    
    const mortgageAmount = principal + cmhcInsurance;
    
    // Monthly payment calculation
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = amortization * 12;
    
    const monthlyPayment = 
      (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Estimate property tax and strata (typical for Metro Vancouver)
    const monthlyPropertyTax = (price * 0.003) / 12; // ~0.3% annual property tax
    const monthlyStrata = 350; // Average strata fee
    
    const totalMonthly = monthlyPayment + monthlyPropertyTax + monthlyStrata;
    
    return {
      downPayment,
      mortgageAmount,
      cmhcInsurance,
      monthlyPayment,
      monthlyPropertyTax,
      monthlyStrata,
      totalMonthly,
    };
  }, [price, downPaymentPercent, interestRate, amortization]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-primary/20 max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Mortgage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purchase Price Input */}
        <div>
          <Label htmlFor="purchase-price" className="text-sm font-medium text-foreground mb-2 block">
            Purchase Price
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="purchase-price"
              type="text"
              inputMode="numeric"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              onFocus={handlePriceFocus}
              className="pl-9 text-lg font-semibold"
              placeholder="650,000"
            />
          </div>
        </div>

        {/* Down Payment Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Down Payment</label>
            <span className="text-sm font-bold text-primary">
              {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
            </span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(v) => setDownPaymentPercent(v[0])}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Interest Rate</label>
            <span className="text-sm font-bold">{interestRate.toFixed(1)}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(v) => setInterestRate(v[0])}
            min={3}
            max={8}
            step={0.25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3%</span>
            <span>8%</span>
          </div>
        </div>

        {/* Amortization */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Amortization</label>
            <span className="text-sm font-bold">{amortization} years</span>
          </div>
          <Slider
            value={[amortization]}
            onValueChange={(v) => setAmortization(v[0])}
            min={15}
            max={30}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>15 yrs</span>
            <span>30 yrs</span>
          </div>
        </div>

        {/* Results */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mortgage Amount</span>
            <span className="font-medium">{formatCurrency(calculations.mortgageAmount)}</span>
          </div>
          
          {calculations.cmhcInsurance > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                CMHC Insurance
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Required for down payments less than 20%. Added to your mortgage.
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium text-amber-600">+{formatCurrency(calculations.cmhcInsurance)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Principal & Interest</span>
            <span className="font-medium">{formatCurrency(calculations.monthlyPayment)}/mo</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. Property Tax</span>
            <span className="font-medium">{formatCurrency(calculations.monthlyPropertyTax)}/mo</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. Strata Fee</span>
            <span className="font-medium">{formatCurrency(calculations.monthlyStrata)}/mo</span>
          </div>

          <div className="flex justify-between pt-3 border-t">
            <span className="font-semibold text-foreground">Total Monthly</span>
            <span className="font-bold text-xl text-primary">
              {formatCurrency(calculations.totalMonthly)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Estimates only. Consult a mortgage broker for accurate rates.
        </p>
      </CardContent>
    </Card>
  );
}