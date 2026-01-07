import { Building2, Layers, Calendar, DollarSign, Gift, MapPin, Landmark, Receipt, FileText, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ProjectHighlightsProps {
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unitMix?: string | null;
  completionMonth?: number | null;
  completionYear?: number | null;
  city?: string | null;
  neighborhood?: string | null;
  depositStructure?: string | null;
  incentives?: string | null;
  developerName?: string | null;
  strataFees?: string | null;
  assignmentFees?: string | null;
}

interface Developer {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
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
  developerName,
  strataFees,
  assignmentFees,
}: ProjectHighlightsProps) {
  // Fetch developer info if we have a developer name
  const { data: developer } = useQuery({
    queryKey: ["developer", developerName],
    queryFn: async () => {
      if (!developerName) return null;
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug, website_url, logo_url")
        .eq("name", developerName)
        .eq("is_active", true)
        .maybeSingle();
      if (error) return null;
      return data as Developer | null;
    },
    enabled: !!developerName,
  });

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

  const completionValue = completionYear
    ? completionMonth
      ? `${getMonthName(completionMonth)} ${completionYear}`
      : completionYear.toString()
    : null;

  // Standard tiles (excluding completion and developer - they get special treatment)
  const standardTiles = [
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
    strataFees && {
      label: "Strata Fees",
      value: strataFees,
      icon: <Receipt className="h-5 w-5" />,
    },
    assignmentFees && {
      label: "Assignment",
      value: assignmentFees.length > 20 ? assignmentFees.substring(0, 20) + "..." : assignmentFees,
      icon: <FileText className="h-5 w-5" />,
    },
    incentives && {
      label: "Incentives",
      value: incentives.length > 25 ? incentives.substring(0, 25) + "..." : incentives,
      icon: <Gift className="h-5 w-5" />,
    },
  ].filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

  if (standardTiles.length === 0 && !completionValue && !developerName) return null;

  return (
    <div className="bg-gradient-to-br from-muted/60 to-muted/30 rounded-2xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Project Details</h2>
      </div>

      {/* Featured Completion Tile - Full Width */}
      {completionValue && (
        <div className="mb-3">
          <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">
                Est. Completion
              </div>
              <div className="font-bold text-xl text-foreground">
                {completionValue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard 2-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {standardTiles.map((item, index) => (
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

        {/* Developer Tile - with link if available */}
        {developerName && (
          <div className="group flex flex-col items-center text-center p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              {developer?.logo_url ? (
                <img src={developer.logo_url} alt={developerName} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Landmark className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">
              Developer
            </div>
            {developer?.website_url ? (
              <a
                href={developer.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm text-primary hover:underline leading-tight flex items-center gap-1"
              >
                {developerName.length > 18 ? developerName.substring(0, 18) + "..." : developerName}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Link
                to={`/developers`}
                className="font-bold text-sm text-foreground hover:text-primary leading-tight transition-colors"
              >
                {developerName.length > 20 ? developerName.substring(0, 20) + "..." : developerName}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
