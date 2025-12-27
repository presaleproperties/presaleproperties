import { Building2, Home, Layers, Calendar, DollarSign } from "lucide-react";

interface ProjectHighlightsProps {
  projectType: "condo" | "townhome" | "mixed";
  unitMix?: string | null;
  completionMonth?: number | null;
  completionYear?: number | null;
  startingPrice?: number | null;
  priceRange?: string | null;
}

export function ProjectHighlights({
  projectType,
  unitMix,
  completionMonth,
  completionYear,
  startingPrice,
  priceRange,
}: ProjectHighlightsProps) {
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", { month: "short" });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const highlights = [
    {
      label: "Type",
      value: projectType.charAt(0).toUpperCase() + projectType.slice(1),
      icon: <Building2 className="h-4 w-4" />,
    },
    unitMix && {
      label: "Unit Mix",
      value: unitMix,
      icon: <Layers className="h-4 w-4" />,
    },
    completionYear && {
      label: "Completion",
      value: completionMonth ? `${getMonthName(completionMonth)} ${completionYear}` : completionYear.toString(),
      icon: <Calendar className="h-4 w-4" />,
    },
    (startingPrice || priceRange) && {
      label: "Starting From",
      value: startingPrice ? formatPrice(startingPrice) : priceRange,
      icon: <DollarSign className="h-4 w-4" />,
    },
  ].filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

  if (highlights.length === 0) return null;

  return (
    <div className="border-y border-border/50 py-4 my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {highlights.map((item, index) => (
          <div key={index} className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-muted-foreground mb-1">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <div className="font-semibold text-sm md:text-base text-foreground">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
