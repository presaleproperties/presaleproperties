import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function CurrencyInput({ 
  value, 
  onChange, 
  className, 
  placeholder = "$0",
  ...props 
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");

  // Format number to currency display
  const formatCurrency = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Parse currency string to number
  const parseCurrency = (str: string): number | undefined => {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    if (!cleaned) return undefined;
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  // Sync display value when external value changes
  React.useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setDisplayValue(rawValue);
  };

  const handleBlur = () => {
    const numericValue = parseCurrency(displayValue);
    onChange(numericValue);
    setDisplayValue(formatCurrency(numericValue));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show raw number on focus for easier editing
    if (value !== undefined && !isNaN(value)) {
      setDisplayValue(value.toString());
    }
    e.target.select();
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}
