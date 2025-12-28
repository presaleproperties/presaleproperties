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
    location && {
      label: "Location",
      value: location,
      icon: <MapPin className="h-4 w-4" />,
    },
    depositStructure && {
      label: "Deposit",
      value: depositStructure.length > 30 ? depositStructure.substring(0, 30) + "..." : depositStructure,
      icon: <DollarSign className="h-4 w-4" />,
    },
    incentives && {
      label: "Incentives",
      value: incentives.length > 30 ? incentives.substring(0, 30) + "..." : incentives,
      icon: <Gift className="h-4 w-4" />,
    },
  ].filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

  if (highlights.length === 0) return null;

  return (
    <div className="border-y border-border/50 py-4 my-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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