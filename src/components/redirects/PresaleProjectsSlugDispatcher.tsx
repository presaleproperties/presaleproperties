import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl } from "@/lib/seoUrls";
import PresaleCityHubPage from "@/pages/PresaleCityHubPage";

/**
 * Smart dispatcher for /presale-projects/:slug
 *
 * - If :slug matches a published project → 301-style redirect to its SEO URL
 *   (/{neighborhood}-presale-{type}-{slug})
 * - Otherwise → render the city hub page (existing behavior for /presale-projects/surrey, etc.)
 *
 * This rescues every legacy /presale-projects/<project-slug> share link, every
 * Google-indexed legacy URL, and every email already in the wild — without
 * breaking the city hub routes.
 */
export function PresaleProjectsSlugDispatcher() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!citySlug) {
        setChecked(true);
        return;
      }
      try {
        const previewToken = searchParams.get("preview");

        // 1. Check the redirect table first — old slugs (with parens / accents)
        //    that were renamed to URL-safe versions.
        const { data: redirect } = await supabase
          .from("project_slug_redirects")
          .select("new_slug")
          .eq("old_slug", citySlug)
          .maybeSingle();

        const effectiveSlug = redirect?.new_slug || citySlug;

        // 2. Look up the project by (possibly remapped) slug
        let query = supabase
          .from("presale_projects")
          .select("slug, neighborhood, city, project_type, is_published")
          .eq("slug", effectiveSlug);
        if (!previewToken) query = query.eq("is_published", true);

        const { data: project } = await query.maybeSingle();
        if (cancelled) return;

        if (project) {
          const seoUrl = generateProjectUrl({
            slug: project.slug,
            neighborhood: project.neighborhood || project.city,
            projectType: project.project_type as any,
          });
          const finalUrl = previewToken ? `${seoUrl}?preview=${previewToken}` : seoUrl;
          setRedirectUrl(finalUrl);
        }
      } catch {
        // swallow — fall through to city hub
      } finally {
        if (!cancelled) setChecked(true);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [citySlug, searchParams]);

  // Brief loader to avoid flashing the city hub before the redirect resolves
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (redirectUrl) {
    return <Navigate to={redirectUrl} replace />;
  }

  // No project matched — render the city hub as before
  return <PresaleCityHubPage />;
}
