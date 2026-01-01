import { X, MapPin, DollarSign, Building2, Calendar, Bed, Bath, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  project_type: string;
  starting_price: number | null;
  deposit_percent: number | null;
  completion_year: number | null;
  completion_month: number | null;
  featured_image: string | null;
}

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  property_type: string;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  assignment_price: number;
  completion_year: number | null;
  featured_image: string | null;
}

interface AICompareModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  listings: Listing[];
  mode: "projects" | "assignments";
  onViewProject: (slug: string) => void;
  onViewListing: (id: string) => void;
  onRemove: (id: string) => void;
}

export function AICompareModal({ 
  open, 
  onClose, 
  projects, 
  listings, 
  mode,
  onViewProject,
  onViewListing,
  onRemove 
}: AICompareModalProps) {
  if (!open) return null;

  const formatPrice = (price: number | null) => {
    if (!price) return "TBD";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const formatCompletion = (year: number | null, month: number | null) => {
    if (!year) return "TBD";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month && month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return String(year);
  };

  const items = mode === "projects" ? projects : listings;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-4xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="font-semibold text-lg text-foreground">
              Compare {mode === "projects" ? "Projects" : "Assignments"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} selected
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Comparison Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Column Headers - Items */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <div className="p-4 bg-muted/30 font-medium text-sm text-muted-foreground">
                Property
              </div>
              {mode === "projects" ? (
                projects.map((project) => (
                  <div key={project.id} className="p-4 border-l border-border">
                    <div className="relative">
                      <button
                        onClick={() => onRemove(project.id)}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {project.featured_image && (
                        <img 
                          src={project.featured_image} 
                          alt={project.name} 
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => onViewProject(project.slug)}
                      >
                        View Details →
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="p-4 border-l border-border">
                    <div className="relative">
                      <button
                        onClick={() => onRemove(listing.id)}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {listing.featured_image && (
                        <img 
                          src={listing.featured_image} 
                          alt={listing.title} 
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => onViewListing(listing.id)}
                      >
                        View Details →
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comparison Rows */}
            {mode === "projects" ? (
              <>
                <CompareRow label="Location" icon={<MapPin className="h-4 w-4" />} colCount={projects.length}>
                  {projects.map((p) => (
                    <div key={p.id} className="text-sm">{p.city}, {p.neighborhood}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Type" icon={<Building2 className="h-4 w-4" />} colCount={projects.length}>
                  {projects.map((p) => (
                    <div key={p.id} className="text-sm capitalize">{p.project_type}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Starting Price" icon={<DollarSign className="h-4 w-4" />} colCount={projects.length} highlight>
                  {projects.map((p) => (
                    <div key={p.id} className="text-sm font-semibold text-primary">{formatPrice(p.starting_price)}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Deposit" icon={<DollarSign className="h-4 w-4" />} colCount={projects.length}>
                  {projects.map((p) => (
                    <div key={p.id} className="text-sm">{p.deposit_percent ? `${p.deposit_percent}%` : "TBD"}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Completion" icon={<Calendar className="h-4 w-4" />} colCount={projects.length}>
                  {projects.map((p) => (
                    <div key={p.id} className="text-sm">{formatCompletion(p.completion_year, p.completion_month)}</div>
                  ))}
                </CompareRow>
              </>
            ) : (
              <>
                <CompareRow label="Location" icon={<MapPin className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.city}{l.neighborhood ? `, ${l.neighborhood}` : ""}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Project" icon={<Building2 className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.project_name}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Bedrooms" icon={<Bed className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.beds} bed</div>
                  ))}
                </CompareRow>
                <CompareRow label="Bathrooms" icon={<Bath className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.baths} bath</div>
                  ))}
                </CompareRow>
                <CompareRow label="Size" icon={<Ruler className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.interior_sqft ? `${l.interior_sqft} sqft` : "TBD"}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Price" icon={<DollarSign className="h-4 w-4" />} colCount={listings.length} highlight>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm font-semibold text-primary">{formatPrice(l.assignment_price)}</div>
                  ))}
                </CompareRow>
                <CompareRow label="Completion" icon={<Calendar className="h-4 w-4" />} colCount={listings.length}>
                  {listings.map((l) => (
                    <div key={l.id} className="text-sm">{l.completion_year || "TBD"}</div>
                  ))}
                </CompareRow>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ 
  label, 
  icon, 
  children, 
  colCount,
  highlight = false 
}: { 
  label: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  colCount: number;
  highlight?: boolean;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  
  return (
    <div 
      className={cn(
        "grid border-b border-border",
        highlight && "bg-primary/5"
      )}
      style={{ gridTemplateColumns: `160px repeat(${colCount}, 1fr)` }}
    >
      <div className="p-3 bg-muted/30 flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      {childArray.map((child, idx) => (
        <div key={idx} className="p-3 border-l border-border flex items-center">
          {child}
        </div>
      ))}
    </div>
  );
}
