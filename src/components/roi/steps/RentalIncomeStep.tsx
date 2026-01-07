import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Home, TrendingUp, AlertCircle, ParkingCircle } from "lucide-react";
import { RentalIncomeDetails } from "@/types/roi";

interface RentalIncomeStepProps {
  rental: RentalIncomeDetails;
  updateInputs: (field: string, value: number) => void;
}

export function RentalIncomeStep({ rental, updateInputs }: RentalIncomeStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const annualGrossRent = rental.monthlyRentStart * 12;
  const annualOtherIncome = rental.otherIncomeMonthly * 12;
  const vacancyLoss = (annualGrossRent + annualOtherIncome) * (rental.vacancyPercent / 100);
  const effectiveRent = annualGrossRent + annualOtherIncome - vacancyLoss;
  const managementCost = effectiveRent * (rental.managementPercent / 100);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-primary" />
          Rental Income
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimate your rental income and vacancy assumptions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Rent */}
        <div className="space-y-2">
          <Label htmlFor="monthlyRent" className="flex items-center gap-2">
            Monthly Rent *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="monthlyRent"
              type="number"
              value={rental.monthlyRentStart}
              onChange={(e) => updateInputs("monthlyRentStart", parseInt(e.target.value) || 0)}
              className="pl-7 text-lg font-medium"
              placeholder="2400"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Expected starting rent when unit is completed
          </p>
        </div>

        {/* Annual Rent Growth */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Annual Rent Growth: {rental.annualRentGrowthPercent}%
            </Label>
          </div>
          <Slider
            value={[rental.annualRentGrowthPercent]}
            onValueChange={([value]) => updateInputs("annualRentGrowthPercent", value)}
            min={0}
            max={10}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Vacancy Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Vacancy Rate: {rental.vacancyPercent}%
            </Label>
          </div>
          <Slider
            value={[rental.vacancyPercent]}
            onValueChange={([value]) => updateInputs("vacancyPercent", value)}
            min={0}
            max={15}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>15%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Typical vacancy in Metro Vancouver is 3-8%
          </p>
        </div>

        {/* Other Income */}
        <div className="space-y-2">
          <Label htmlFor="otherIncome" className="flex items-center gap-2">
            <ParkingCircle className="h-4 w-4 text-muted-foreground" />
            Other Monthly Income
            <span className="text-xs text-muted-foreground">(parking, storage)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="otherIncome"
              type="number"
              value={rental.otherIncomeMonthly}
              onChange={(e) => updateInputs("otherIncomeMonthly", parseInt(e.target.value) || 0)}
              className="pl-7"
              placeholder="100"
            />
          </div>
        </div>

        {/* Property Management */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>
              Property Management: {rental.managementPercent}%
            </Label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(managementCost)}/yr
            </span>
          </div>
          <Slider
            value={[rental.managementPercent]}
            onValueChange={([value]) => updateInputs("managementPercent", value)}
            min={0}
            max={10}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0% (self-managed)</span>
            <span>10%</span>
          </div>
        </div>

        {/* Income Summary */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Annual Gross Rent:</span>
            <span>{formatCurrency(annualGrossRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Other Income:</span>
            <span>{formatCurrency(annualOtherIncome)}</span>
          </div>
          <div className="flex justify-between text-sm text-destructive">
            <span>Less Vacancy ({rental.vacancyPercent}%):</span>
            <span>-{formatCurrency(vacancyLoss)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>Effective Gross Income:</span>
            <span className="text-primary">{formatCurrency(effectiveRent)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
