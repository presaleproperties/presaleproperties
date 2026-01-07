import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Calendar, DollarSign, Percent } from "lucide-react";
import { PurchaseDetails, FinancingDetails, BC_CITIES, CompletionSeason } from "@/types/roi";

interface PropertyFinancingStepProps {
  purchase: PurchaseDetails;
  financing: FinancingDetails;
  updatePurchase: (field: string, value: number | string | null) => void;
  updateFinancing: (field: string, value: number | string) => void;
}

const SEASONS: { value: CompletionSeason; label: string; months: string }[] = [
  { value: 'spring', label: 'Spring', months: 'Mar - May' },
  { value: 'summer', label: 'Summer', months: 'Jun - Aug' },
  { value: 'fall', label: 'Fall', months: 'Sep - Nov' },
  { value: 'winter', label: 'Winter', months: 'Dec - Feb' },
];

export function PropertyFinancingStep({ 
  purchase, 
  financing, 
  updatePurchase, 
  updateFinancing 
}: PropertyFinancingStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    updatePurchase("purchasePrice", value ? parseInt(value) : 0);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Calculate financing details
  const totalDeposit = purchase.purchasePrice * ((financing.deposit1Percent + financing.deposit2Percent) / 100);
  const downPayment = purchase.purchasePrice * (financing.downPaymentPercent / 100);
  const additionalAtClose = Math.max(0, downPayment - totalDeposit);
  const mortgageAmount = purchase.purchasePrice - downPayment;

  // Calculate monthly payment
  const monthlyRate = financing.mortgageInterestRate / 100 / 12;
  const numPayments = financing.amortizationYears * 12;
  const monthlyPayment = mortgageAmount > 0 && monthlyRate > 0
    ? mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0;

  return (
    <div className="space-y-4">
      {/* Property Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="purchasePrice"
                type="text"
                value={purchase.purchasePrice.toLocaleString()}
                onChange={handlePriceChange}
                className="pl-7 text-lg font-medium"
                placeholder="650,000"
              />
            </div>
          </div>

          {/* City & Property Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                City
              </Label>
              <Select
                value={purchase.city}
                onValueChange={(value) => updatePurchase("city", value)}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {BC_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType" className="text-sm">Property Type</Label>
              <Select
                value={purchase.propertyType}
                onValueChange={(value) => updatePurchase("propertyType", value)}
              >
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhome">Townhome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Completion Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="closingSeason" className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Completion Season
              </Label>
              <Select
                value={purchase.closingSeason}
                onValueChange={(value) => updatePurchase("closingSeason", value)}
              >
                <SelectTrigger id="closingSeason">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingYear" className="text-sm">Completion Year</Label>
              <Select
                value={purchase.closingYear.toString()}
                onValueChange={(value) => updatePurchase("closingYear", parseInt(value))}
              >
                <SelectTrigger id="closingYear">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Deposit & Financing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Deposit Structure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit1" className="text-sm">1st Deposit (%)</Label>
              <Input
                id="deposit1"
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={financing.deposit1Percent}
                onChange={(e) => updateFinancing("deposit1Percent", parseFloat(e.target.value) || 0)}
              />
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(purchase.purchasePrice * (financing.deposit1Percent / 100))} at signing
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit2" className="text-sm">2nd Deposit (%)</Label>
              <Input
                id="deposit2"
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={financing.deposit2Percent}
                onChange={(e) => updateFinancing("deposit2Percent", parseFloat(e.target.value) || 0)}
              />
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(purchase.purchasePrice * (financing.deposit2Percent / 100))} in {financing.deposit2Months}mo
              </p>
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Down Payment: {financing.downPaymentPercent}%</Label>
              <span className="text-xs font-medium">{formatCurrency(downPayment)}</span>
            </div>
            <Slider
              value={[financing.downPaymentPercent]}
              onValueChange={([value]) => updateFinancing("downPaymentPercent", value)}
              min={5}
              max={50}
              step={5}
            />
            {additionalAtClose > 0 && (
              <p className="text-xs text-primary">
                + {formatCurrency(additionalAtClose)} additional at closing
              </p>
            )}
          </div>

          <Separator />

          {/* Mortgage Terms */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1.5 text-sm">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Interest Rate: {financing.mortgageInterestRate.toFixed(2)}%
              </Label>
            </div>
            <Slider
              value={[financing.mortgageInterestRate]}
              onValueChange={([value]) => updateFinancing("mortgageInterestRate", value)}
              min={2}
              max={8}
              step={0.25}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amortization" className="text-sm">Amortization</Label>
              <Select
                value={financing.amortizationYears.toString()}
                onValueChange={(value) => updateFinancing("amortizationYears", parseInt(value))}
              >
                <SelectTrigger id="amortization">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="term" className="text-sm">Term</Label>
              <Select
                value={financing.mortgageTermYears.toString()}
                onValueChange={(value) => updateFinancing("mortgageTermYears", parseInt(value))}
              >
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="7">7 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mortgage:</span>
              <span className="font-medium">{formatCurrency(mortgageAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Payment:</span>
              <span className="font-semibold text-primary">{formatCurrency(monthlyPayment)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
