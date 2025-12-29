import { Building2, Layers, Calendar, DollarSign, Gift, MapPin } from "lucide-react";

interface ProjectHighlightsProps {
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unitMix?: string | null;
  completionMonth?: number | null;
  completionYear?: number | null;
  city?: string | null;
  neighborhood?: string | null;
  depositStructure?: string | null;
  incentives?: string | null;
}

export function ProjectHighlights({
  projectType,
  unitMix,
  completionMonth,
  completionYear,
  city,
  neighborhood,
  depositStructure,
  incentives,
}: ProjectHighlightsProps) {
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", { month: "short" });
  };

  const getLocation = () => {
    if (neighborhood && city) return `${neighborhood}, ${city}`;
    if (city) return city;
    if (neighborhood) return neighborhood;
    return null;
  };

  const location = getLocation();

  const formatProjectType = (type: string) => {
    const typeMap: Record<string, string> = {
      condo: "Condo",
      townhome: "Townhome",
      mixed: "Mixed",
      duplex: "Duplex",
      single_family: "Single Family",
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const highlights = [
    {
      label: "Type",
      value: formatProjectType(projectType),
      icon: <Building2 className="h-5 w-5" />,
    },
    unitMix && {
      label: "Unit Mix",
      value: unitMix,
      icon: <Layers className="h-5 w-5" />,
    },
    completionYear && {
      label: "Completion",
      value: completionMonth ? `${getMonthName(completionMonth)} ${completionYear}` : completionYear.toString(),
      icon: <Calendar className="h-5 w-5" />,
    },
    location && {
      label: "Location",
      value: location,
      icon: <MapPin className="h-5 w-5" />,
    },
    depositStructure && {
      label: "Deposit",
      value: depositStructure.length > 25 ? depositStructure.substring(0, 25) + "..." : depositStructure,
      icon: <DollarSign className="h-5 w-5" />,
    },
    incentives && {
      label: "Incentives",
      value: incentives.length > 25 ? incentives.substring(0, 25) + "..." : incentives,
      icon: <Gift className="h-5 w-5" />,
    },
  ].filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

  if (highlights.length === 0) return null;

  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <div className="grid grid-cols-2 gap-4">
        {highlights.map((item, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-2 rounded-lg"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                {item.label}
              </div>
              <div className="font-semibold text-sm text-foreground leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}