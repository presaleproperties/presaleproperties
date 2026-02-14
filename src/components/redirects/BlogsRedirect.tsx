import { Navigate, useParams } from "react-router-dom";

/**
 * Redirects /blogs/:slug → /blog/:slug
 * Google crawled plural /blogs/ form which doesn't exist
 */
export function BlogsRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/blog/${slug || ""}`} replace />;
}
