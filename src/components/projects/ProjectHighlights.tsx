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
      label: "Est. Completion",
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
    <div className="bg-gradient-to-br from-muted/60 to-muted/30 rounded-2xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Project Details</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {highlights.map((item, index) => (
          <div 
            key={index} 
            className="group flex flex-col items-center text-center p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
              <div className="text-primary">
                {item.icon}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">
              {item.label}
            </div>
            <div className="font-bold text-sm text-foreground leading-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}