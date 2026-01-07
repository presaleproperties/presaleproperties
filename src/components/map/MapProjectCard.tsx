import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, ExternalLink } from "lucide-react";

interface MapProjectCardProps {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: string;
  project_type: string;
  starting_price: number | null;
  featured_image: string | null;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Selling Now";
    case "registering": return "Registering";
    case "coming_soon": return "Coming Soon";
    case "sold_out": return "Sold Out";
    default: return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-500 hover:bg-green-600";
    case "registering": return "bg-purple-500 hover:bg-purple-600";
    case "coming_soon": return "bg-blue-500 hover:bg-blue-600";
    case "sold_out": return "bg-gray-500 hover:bg-gray-600";
    default: return "bg-blue-500 hover:bg-blue-600";
  }
};

export function MapProjectCard({ 
  id,
  name, 
  slug, 
  city, 
  neighborhood, 
  status, 
  project_type, 
  starting_price, 
  featured_image,
  isHighlighted,
  onHover
}: MapProjectCardProps) {
  return (
    <Link 
      to={`/presale-projects/${slug}`}
      className={`block group ${isHighlighted ? 'ring-2 ring-primary' : ''}`}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className={`bg-card border rounded-lg overflow-hidden transition-all hover:shadow-md ${isHighlighted ? 'shadow-lg border-primary' : ''}`}>
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="w-24 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            {featured_image ? (
              <img 
                src={featured_image} 
                alt={name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              {starting_price ? (
                <p className="font-bold text-base">
                  From {formatPrice(starting_price)}
                </p>
              ) : (
                <p className="font-bold text-base text-muted-foreground">
                  Price TBD
                </p>
              )}
              <Badge className={`${getStatusColor(status)} text-[10px] px-1.5 py-0.5 shrink-0`}>
                {getStatusLabel(status)}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{neighborhood}, {city}</span>
            </p>
            
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {project_type}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
