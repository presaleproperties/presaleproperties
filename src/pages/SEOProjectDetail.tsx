import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PresaleProjectDetail from "./PresaleProjectDetail";

/**
 * SEO-friendly project detail page wrapper
 * Handles URLs like: /{neighborhood}-presale-{type}-{slug}
 * Extracts the project slug and renders PresaleProjectDetail
 */
export default function SEOProjectDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>();
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!seoSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Parse the SEO slug to extract project slug
    // Pattern: {neighborhood}-presale-{type}-{project-slug}
    const match = seoSlug.match(/^(.+)-presale-(condos|townhomes|homes|duplexes)-(.+)$/);
    
    if (match) {
      const extractedSlug = match[3];
      
      // Verify project exists
      verifyProject(extractedSlug);
    } else {
      // If pattern doesn't match, check if it's just a plain slug
      verifyProject(seoSlug);
    }
  }, [seoSlug]);

  const verifyProject = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("slug")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProjectSlug(data.slug);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // PresaleProjectDetail will show its own loading state
  }

  if (notFound) {
    // Redirect to 404
    return <Navigate to="/404" replace />;
  }

  // Render the actual project detail page with the extracted slug
  return <PresaleProjectDetail />;
}
