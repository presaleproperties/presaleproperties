import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminBackLinkProps {
  /**
   * Destination route. If provided, renders a real <Link> (best UX — supports
   * cmd-click, right-click "open in new tab", correct browser history entry).
   *
   * If omitted, the component falls back to `navigate(-1)` which returns to
   * the previous in-app screen (useful from modals/details opened via list
   * row clicks where the source list is always the last route).
   */
  to?: string;
  /** Visible label. Defaults to "Back". */
  label?: ReactNode;
  /** Optional Tailwind classes for layout tweaks. */
  className?: string;
}

/**
 * Consistent in-layout "Back" affordance for admin details, modals-as-pages,
 * and any nested screen.
 *
 * Always renders inline (does NOT replace AdminLayout's sidebar) so the user
 * never loses navigation context.
 *
 * Usage (preferred — explicit destination):
 *   <AdminBackLink to="/admin/leads" label="Back to leads" />
 *
 * Usage (fallback — go to previous in-app screen):
 *   <AdminBackLink label="Back" />
 */
export function AdminBackLink({ to, label = "Back", className }: AdminBackLinkProps) {
  const navigate = useNavigate();
  const baseClasses = cn(
    "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        <ChevronLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={baseClasses}>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
