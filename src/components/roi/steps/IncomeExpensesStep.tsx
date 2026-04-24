import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, TrendingUp, AlertCircle, Building, FileText, Shield, Wrench, ShieldCheck, Sparkles } from "lucide-react";
import { RentalIncomeDetails, OperatingExpenses } from "@/types/roi";
import { useLatestCMHCData } from "@/hooks/useCMHCRentalData";

interface IncomeExpensesStepProps {
  rental: RentalIncomeDetails;
  expenses: OperatingExpenses;
  city?: string;
  propertyType?: 'condo' | 'townhome';
  updateRental: (field: string, value: number) => void;
  updateExpenses: (field: string, value: number) => void;
}

export function IncomeExpensesStep({ 
  rental, 
  expenses,
  city,
  propertyType = 'condo',
  updateRental, 
  updateExpenses 
}: IncomeExpensesStepProps) {
  // Fetch CMHC verified rental data for the selected city
  const { data: cmhcData, isLoading: isCMHCLoading } = useLatestCMHCData(city || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get suggested rent from CMHC data based on property type
  const suggestedRent = cmhcData 
    ? propertyType === 'townhome' 
      ? Math.round((cmhcData.avg_rent_2br || 2000) * 1.25) // Townhomes ~25% higher
      : cmhcData.avg_rent_2br 
    : null;

  const suggestedVacancy = cmhcData?.vacancy_rate_overall || null;

  const handleApplyCMHCRent = () => {
    if (suggestedRent) {
      updateRental("monthlyRentStart", suggestedRent);
    }
    if (suggestedVacancy !== null) {
      updateRental("vacancyPercent", Math.round(suggestedVacancy));
    }
  };

  // Income calculations
  const annualGrossRent = rental.monthlyRentStart * 12;
  const annualOtherIncome = rental.otherIncomeMonthly * 12;
  const vacancyLoss = (annualGrossRent + annualOtherIncome) * (rental.vacancyPercent / 100);
  const effectiveRent = annualGrossRent + annualOtherIncome - vacancyLoss;
  const managementCost = effectiveRent * (rental.managementPercent / 100);

  // Expense calculations
  const annualStrata = expenses.strataMonthly * 12;
  const totalAnnualExpenses = 
    annualStrata + 
    expenses.propertyTaxAnnual + 
    expenses.insuranceAnnual + 
    expenses.utilitiesAnnual + 
    expenses.maintenanceReserveAnnual +
    expenses.otherExpensesAnnual +
    managementCost;

  const noi = effectiveRent - totalAnnualExpenses;

  return (
    <div className="space-y-4">
      {/* CMHC Verified Data Banner */}
      {cmhcData && city && (
        <div className="bg-success-soft dark:bg-success-strong/30 border border-success/30 dark:border-success rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success dark:text-success" />
              <span className="text-sm font-medium text-success-strong dark:text-success">
                CMHC Verified Data for {city}
              </span>
              <Badge variant="outline" className="text-[10px] bg-card dark:bg-background">
                {cmhcData.report_year}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCMHCRent}
              className="h-7 text-xs border-success text-success-strong hover:bg-success-soft dark:border-success dark:text-success dark:hover:bg-success-strong"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Apply Verified Data
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2 text-center">
            {cmhcData.avg_rent_1br && (
              <div>
                <p className="text-[10px] text-muted-foreground">1BR Avg</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(cmhcData.avg_rent_1br)}</p>
              </div>
            )}
            {cmhcData.avg_rent_2br && (
              <div>
                <p className="text-[10px] text-muted-foreground">2BR Avg</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(cmhcData.avg_rent_2br)}</p>
              </div>
            )}
            {cmhcData.vacancy_rate_overall !== null && (
              <div>
                <p className="text-[10px] text-muted-foreground">Vacancy</p>
                <p className="text-sm font-semibold text-foreground">{cmhcData.vacancy_rate_overall}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rental Income */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-4 w-4 text-primary" />
            Rental Income
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monthly Rent */}
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monthlyRent"
                type="number"
                value={rental.monthlyRentStart || ''}
                onChange={(e) => updateRental("monthlyRentStart", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="pl-7 text-lg font-medium"
                placeholder="2400"
              />
            </div>
            {suggestedRent && rental.monthlyRentStart !== suggestedRent && (
              <p className="text-xs text-success dark:text-success flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                CMHC suggests {formatCurrency(suggestedRent)}/mo for {propertyType === 'townhome' ? 'townhomes' : '2BR'} in {city}
              </p>
            )}
          </div>

          {/* Rent Growth & Vacancy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                Rent Growth: {rental.annualRentGrowthPercent}%
              </Label>
              <Slider
                value={[rental.annualRentGrowthPercent]}
                onValueChange={([value]) => updateRental("annualRentGrowthPercent", value)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Vacancy: {rental.vacancyPercent}%
              </Label>
              <Slider
                value={[rental.vacancyPercent]}
                onValueChange={([value]) => updateRental("vacancyPercent", value)}
                min={0}
                max={15}
                step={1}
              />
            </div>
          </div>

          {/* Property Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Property Management: {rental.managementPercent}%</Label>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(managementCost)}/yr
              </span>
            </div>
            <Slider
              value={[rental.managementPercent]}
              onValueChange={([value]) => updateRental("managementPercent", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-[10px] text-muted-foreground">0% = self-managed</p>
          </div>

          {/* Income Summary */}
          <div className="bg-success-soft dark:bg-success-strong/20 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Rent:</span>
              <span>{formatCurrency(annualGrossRent)}/yr</span>
            </div>
            <div className="flex justify-between text-destructive text-xs">
              <span>Less Vacancy:</span>
              <span>-{formatCurrency(vacancyLoss)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Effective Income:</span>
              <span className="text-success dark:text-success">{formatCurrency(effectiveRent)}/yr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-primary" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Expenses Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="strata" className="text-sm">Strata (monthly)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="strata"
                  type="number"
                  value={expenses.strataMonthly || ''}
                  onChange={(e) => updateExpenses("strataMonthly", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="propertyTax" className="flex items-center gap-1 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Property Tax (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="propertyTax"
                  type="number"
                  value={expenses.propertyTaxAnnual || ''}
                  onChange={(e) => updateExpenses("propertyTaxAnnual", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurance" className="flex items-center gap-1 text-sm">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Insurance (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="insurance"
                  type="number"
                  value={expenses.insuranceAnnual || ''}
                  onChange={(e) => updateExpenses("insuranceAnnual", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maintenance" className="flex items-center gap-1 text-sm">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                Maintenance (annual)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="maintenance"
                  type="number"
                  value={expenses.maintenanceReserveAnnual || ''}
                  onChange={(e) => updateExpenses("maintenanceReserveAnnual", e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Expenses Summary */}
          <div className="bg-danger-soft dark:bg-danger-strong/20 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strata:</span>
              <span>{formatCurrency(annualStrata)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Tax:</span>
              <span>{formatCurrency(expenses.propertyTaxAnnual)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance + Maint:</span>
              <span>{formatCurrency(expenses.insuranceAnnual + expenses.maintenanceReserveAnnual)}/yr</span>
            </div>
            {rental.managementPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Management:</span>
                <span>{formatCurrency(managementCost)}/yr</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Total Expenses:</span>
              <span className="text-destructive">{formatCurrency(totalAnnualExpenses)}/yr</span>
            </div>
          </div>

          {/* NOI */}
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Operating Income (Year 1)</p>
            <p className={`text-xl font-bold ${noi >= 0 ? 'text-success dark:text-success' : 'text-destructive'}`}>
              {formatCurrency(noi)}/yr
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
