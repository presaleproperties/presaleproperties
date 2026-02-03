import { useMemo } from "react";

interface SqftOption {
  value: string;
  label: string;
}

/**
 * Hook to generate square footage filter options.
 * Returns standard options for filtering by minimum square footage.
 */
export function useSqftOptions() {
  const options = useMemo(() => {
    const sqftOptions: SqftOption[] = [
      { value: "any", label: "Any Size" },
      { value: "500", label: "500+ sqft" },
      { value: "750", label: "750+ sqft" },
      { value: "1000", label: "1,000+ sqft" },
      { value: "1250", label: "1,250+ sqft" },
      { value: "1500", label: "1,500+ sqft" },
      { value: "2000", label: "2,000+ sqft" },
      { value: "2500", label: "2,500+ sqft" },
      { value: "3000", label: "3,000+ sqft" },
    ];
    
    return sqftOptions;
  }, []);
  
  return { options };
}

/**
 * Parse sqft filter value.
 * Returns minimum sqft value or null if no filter.
 */
export function parseSqftFilter(value: string): number | null {
  if (!value || value === "any") {
    return null;
  }
  
  const sqft = parseInt(value);
  if (!isNaN(sqft)) {
    return sqft;
  }
  
  return null;
}
