import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SearchResultsHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  resultCount: number;
  newCount?: number;
  resultLabel?: string;
}

export function SearchResultsHeader({
  breadcrumbs,
  title,
  subtitle,
  resultCount,
  newCount,
  resultLabel = "results",
}: SearchResultsHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
        <Link to="/" className="hover:text-foreground transition-colors shrink-0">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
            {crumb.href ? (
              <Link to={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Title + Count */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{resultCount.toLocaleString()}</span>
          <span>{resultLabel}</span>
          {newCount && newCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-green-600 font-medium">{newCount} new this week</span>
            </>
          )}
          {subtitle && (
            <>
              <span className="text-border">•</span>
              <span>{subtitle}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
