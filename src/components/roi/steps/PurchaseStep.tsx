import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Calendar, Ruler } from "lucide-react";
import { PurchaseDetails, BC_CITIES } from "@/types/roi";

interface PurchaseStepProps {
  purchase: PurchaseDetails;
  updateInputs: (field: string, value: number | string | null) => void;
}

export function PurchaseStep({ purchase, updateInputs }: PurchaseStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    updateInputs("purchasePrice", value ? parseInt(value) : 0);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Purchase Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the basic details of the presale property you're analyzing.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Purchase Price */}
        <div className="space-y-2">
          <Label htmlFor="purchasePrice" className="flex items-center gap-2">
            Purchase Price *
          </Label>
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
          <p className="text-xs text-muted-foreground">
            Contract price before GST and closing costs
          </p>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            City *
          </Label>
          <Select
            value={purchase.city}
            onValueChange={(value) => updateInputs("city", value)}
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

        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="propertyType" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Property Type *
          </Label>
          <Select
            value={purchase.propertyType}
            onValueChange={(value) => updateInputs("propertyType", value)}
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

        {/* Closing Year */}
        <div className="space-y-2">
          <Label htmlFor="closingYear" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Expected Completion Year *
          </Label>
          <Select
            value={purchase.closingYear.toString()}
            onValueChange={(value) => updateInputs("closingYear", parseInt(value))}
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

        {/* Unit Size */}
        <div className="space-y-2">
          <Label htmlFor="unitSize" className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            Unit Size (sq ft)
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="unitSize"
            type="number"
            value={purchase.unitSizeSqft || ""}
            onChange={(e) => updateInputs("unitSizeSqft", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="550"
          />
          {purchase.unitSizeSqft && purchase.purchasePrice > 0 && (
            <p className="text-xs text-muted-foreground">
              Price per sq ft: {formatCurrency(purchase.purchasePrice / purchase.unitSizeSqft)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
