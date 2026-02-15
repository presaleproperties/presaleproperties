import { Link } from "react-router-dom";
import { Building2, MapPin, Calendar, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/seoUrls";

interface PresaleProjectCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood?: string | null;
  status?: string | null;
  projectType?: string | null;
  startingPrice?: number | null;
  completionYear?: number | null;
  featuredImage?: string | null;
  galleryImages?: string[] | null;
  lastVerifiedDate?: string | null;
  size?: "default" | "large" | "featured";
}

function formatPrice(price: number) {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "Now Selling": return "bg-emerald-500/90 text-white";
    case "Coming Soon": return "bg-amber-500/90 text-white";
    case "Sold Out": return "bg-muted text-muted-foreground";
    case "Move-In Ready": return "bg-primary/90 text-primary-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
}

export function PresaleProjectCard({
  id,
  slug,
  name,
  city,
  neighborhood,
  status,
  projectType,
  startingPrice,
  completionYear,
  featuredImage,
  galleryImages,
  lastVerifiedDate,
  size = "default",
}: PresaleProjectCardProps) {
  const citySlug = slugify(city);
  const typeSlug = projectType?.toLowerCase().includes("townhome") ? "townhomes" : "condos";
  const projectUrl = `/${citySlug}-presale-${typeSlug}/${slug}`;

  const imageUrl = featuredImage || galleryImages?.[0] || null;

  return (
    <Link to={projectUrl} className="group block">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${name} - ${city} presale ${projectType || "development"}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Status Badge */}
          {status && (
            <Badge className={`absolute top-3 left-3 ${getStatusColor(status)} text-[11px] font-semibold px-2.5 py-0.5 border-0 shadow-sm`}>
              {status}
            </Badge>
          )}

          {/* Project Type */}
          {projectType && (
            <Badge variant="secondary" className="absolute top-3 right-3 text-[10px] font-medium bg-background/80 backdrop-blur-sm border-0">
              {projectType}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-2">
          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {neighborhood ? `${neighborhood}, ${city}` : city}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {startingPrice ? (
              <span className="text-sm sm:text-base font-bold text-foreground">
                From {formatPrice(startingPrice)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Price TBA</span>
            )}
            
            {completionYear && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {completionYear}
              </span>
            )}
          </div>

          {lastVerifiedDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <BadgeCheck className="h-3 w-3" />
              Verified {new Date(lastVerifiedDate).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
