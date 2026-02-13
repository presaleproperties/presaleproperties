import { useEffect, useState } from "react";
import { useParams, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl, slugify, getProjectTypeSlug } from "@/lib/seoUrls";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/NotFound";

/**
 * SEO Redirect Component for Presale Projects
 * 
 * Redirects legacy /presale-projects/:slug URLs to SEO-friendly URLs:
 * /{neighborhood}-presale-{type}-{slug}
 * 
 * This ensures:
 * 1. Single canonical URL per project
 * 2. 301 redirect for SEO equity transfer
 * 3. Prevents duplicate content issues
 */
export function PresaleProjectSEORedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProjectAndRedirect() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Check if this is a preview request (allow admin preview)
        const previewToken = searchParams.get("preview");
        
        let query = supabase
          .from("presale_projects")
          .select("slug, neighborhood, city, project_type, is_published")
          .eq("slug", slug);
        
        // If not preview mode, only fetch published projects
        if (!previewToken) {
          query = query.eq("is_published", true);
        }
        
        const { data: project, error } = await query.maybeSingle();

        if (error || !project) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Generate SEO-friendly URL
        const seoUrl = generateProjectUrl({
          slug: project.slug,
          neighborhood: project.neighborhood || project.city,
          projectType: project.project_type,
        });

        // Preserve preview token if present
        const finalUrl = previewToken ? `${seoUrl}?preview=${previewToken}` : seoUrl;
        
        setRedirectUrl(finalUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching project for redirect:", err);
        setNotFound(true);
        setLoading(false);
      }
    }

    fetchProjectAndRedirect();
  }, [slug, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    // Render 404 inline to preserve the original URL for debugging
    return <NotFound />;
  }

  if (redirectUrl) {
    // 301 permanent redirect to SEO URL
    return <Navigate to={redirectUrl} replace />;
  }

  return null;
}
