import { useMemo } from "react";
import { useMinYearBuilt, DEFAULT_MIN_YEAR_BUILT } from "./useMinYearBuilt";

interface YearOption {
  value: string;
  label: string;
}

/**
 * Hook to generate year built filter options based on admin-controlled minimum year.
 * Returns options from current year down to the minimum year set in admin portal.
 */
export function useYearBuiltOptions() {
  const { data: minYear = DEFAULT_MIN_YEAR_BUILT, isLoading } = useMinYearBuilt();
  
  const options = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + 2; // Allow for pre-construction completion years
    
    const yearOptions: YearOption[] = [
      { value: "any", label: "Any Year" },
    ];
    
    // Add year options from future down to minimum
    for (let year = futureYear; year >= minYear; year--) {
      yearOptions.push({
        value: year.toString(),
        label: year.toString(),
      });
    }
    
    return yearOptions;
  }, [minYear]);
  
  // Generate range options for "Year Built" filter (e.g., "2024+", "2023+")
  const rangeOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    const ranges: YearOption[] = [
      { value: "any", label: "Any Year" },
    ];
    
    // Add "YEAR+" options from current year down to minimum
    for (let year = currentYear; year >= minYear; year--) {
      ranges.push({
        value: `${year}+`,
        label: `${year}+`,
      });
    }
    
    return ranges;
  }, [minYear]);
  
  return {
    options,
    rangeOptions,
    minYear,
    isLoading,
  };
}

/**
 * Parse year built filter value.
 * Handles both exact years ("2024") and range formats ("2024+")
 */
export function parseYearBuiltFilter(value: string): { minYear: number | null; maxYear: number | null } {
  if (!value || value === "any") {
    return { minYear: null, maxYear: null };
  }
  
  // Handle "2024+" format - means minYear = 2024, no maxYear
  if (value.endsWith("+")) {
    const year = parseInt(value.slice(0, -1));
    if (!isNaN(year)) {
      return { minYear: year, maxYear: null };
    }
  }
  
  // Handle exact year "2024" - means both min and max = 2024
  const year = parseInt(value);
  if (!isNaN(year)) {
    return { minYear: year, maxYear: year };
  }
  
  return { minYear: null, maxYear: null };
}
