import { Building2, Layers, Calendar, DollarSign, Gift, MapPin, Landmark, Receipt, FileText, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ProjectHighlightsProps {
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  unitMix?: string | null;
  completionMonth?: number | null;
  completionYear?: number | null;
  occupancyEstimate?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  depositStructure?: string | null;
  incentives?: string | null;
  developerId?: string | null;
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
  occupancyEstimate,
  city,
  neighborhood,
  depositStructure,
  incentives,
  developerId,
  developerName,
  strataFees,
  assignmentFees,
}: ProjectHighlightsProps) {
  // Fetch developer info - prefer developer_id, fallback to name
  const { data: developer } = useQuery({
    queryKey: ["developer", developerId, developerName],
    queryFn: async () => {
      // Prefer lookup by ID if available
      if (developerId) {
        const { data, error } = await supabase
          .from("developers")
          .select("id, name, slug, website_url, logo_url")
          .eq("id", developerId)
          .eq("is_active", true)
          .maybeSingle();
        if (!error && data) return data as Developer;
      }
      // Fallback to name lookup
      if (developerName) {
        const { data, error } = await supabase
          .from("developers")
          .select("id, name, slug, website_url, logo_url")
          .eq("name", developerName)
          .eq("is_active", true)
          .maybeSingle();
        if (!error && data) return data as Developer;
      }
      return null;
    },
    enabled: !!(developerId || developerName),
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

  const completionValue = (() => {
    if (occupancyEstimate) {
      const seasonMatch = occupancyEstimate.match(/\b(Spring|Summer|Fall|Winter)\b/i);
      const yearMatch = occupancyEstimate.match(/\b(\d{4})\b/);
      const season = seasonMatch ? seasonMatch[1] : null;
      const occYear = yearMatch ? yearMatch[1] : null;
      if (season && occYear) return `${season} ${occYear}`;
      if (season && completionYear) return `${season} ${completionYear}`;
      if (occYear) return occYear;
    }
    if (completionYear) {
      return completionMonth
        ? `${getMonthName(completionMonth)} ${completionYear}`
        : completionYear.toString();
    }
    return null;
  })();

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
    <div className="bg-gradient-to-br from-muted/60 to-muted/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-2.5 sm:mb-3 md:mb-4">
        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
        </div>
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground">Project Details</h2>
      </div>

      {/* Featured Completion Tile - Full Width */}
      {completionValue && (
        <div className="mb-2.5 sm:mb-3">
          <div className="group flex items-center gap-2.5 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">
                Est. Completion
              </div>
              <div className="font-bold text-base sm:text-lg md:text-xl text-foreground truncate">
                {completionValue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard 2-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
        {standardTiles.map((item, index) => (
          <div 
            key={index} 
            className="group flex flex-col items-center text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 min-w-0 overflow-hidden"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="text-primary [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4 md:[&>svg]:h-5 md:[&>svg]:w-5">
                {item.icon}
              </div>
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground font-semibold uppercase tracking-wide sm:tracking-widest mb-0.5">
              {item.label}
            </div>
            <div className="font-bold text-[11px] sm:text-xs md:text-sm text-foreground leading-tight truncate w-full px-0.5 sm:px-1">
              {item.value}
            </div>
          </div>
        ))}

        {/* Developer Tile - fully clickable with link to developer website */}
        {developerName && (
          developer?.website_url ? (
            <a
              href={developer.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 min-w-0 overflow-hidden cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0">
                {developer?.logo_url ? (
                  <img src={developer.logo_url} alt={developerName} className="w-full h-full object-contain p-0.5 sm:p-1" />
                ) : (
                  <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                )}
              </div>
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground font-semibold uppercase tracking-wide sm:tracking-widest mb-0.5">
                Developer
              </div>
              <div className="font-bold text-[11px] sm:text-xs md:text-sm text-primary group-hover:underline leading-tight flex items-center gap-0.5 truncate w-full justify-center px-0.5 sm:px-1">
                <span className="truncate">{developerName.length > 14 ? developerName.substring(0, 14) + "..." : developerName}</span>
                <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 shrink-0 opacity-70" />
              </div>
            </a>
          ) : (
            <div className="group flex flex-col items-center text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 min-w-0 overflow-hidden">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0">
                <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground font-semibold uppercase tracking-wide sm:tracking-widest mb-0.5">
                Developer
              </div>
              <div className="font-bold text-[11px] sm:text-xs md:text-sm text-foreground leading-tight truncate w-full px-0.5 sm:px-1">
                {developerName.length > 14 ? developerName.substring(0, 14) + "..." : developerName}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
