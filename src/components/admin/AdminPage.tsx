import { ReactNode } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

interface AdminPageProps {
  /** Main page content. Rendered inside <AdminLayout>. Optional when `loading` is true. */
  children?: ReactNode;
  /** When true, replaces children with a centered spinner — but keeps the
   *  AdminLayout wrapper so the sidebar stays visible. */
  loading?: boolean;
  /** Optional page title rendered as an <h1> at the top of the content area. */
  title?: ReactNode;
  /** Optional supporting text under the title. */
  description?: ReactNode;
  /** Optional right-aligned actions (buttons, etc.) shown next to the title. */
  actions?: ReactNode;
  /** Tailwind classes applied to the inner content wrapper. */
  className?: string;
}

/**
 * Shared admin page template.
 *
 * Goals:
 *   1. Every admin page gets the unified <AdminLayout> sidebar exactly once.
 *   2. Loading state no longer requires a duplicate <AdminLayout> wrapper.
 *   3. Standard header (title + description + actions) lives in one place.
 *
 * Usage:
 *   return (
 *     <AdminPage title="Bookings" description="…" loading={loading}>
 *       …content…
 *     </AdminPage>
 *   );
 */
export function AdminPage({
  children,
  loading = false,
  title,
  description,
  actions,
  className = "space-y-6",
}: AdminPageProps) {
  return (
    <AdminLayout>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className={className}>{children}</div>
      )}
    </AdminLayout>
  );
}
