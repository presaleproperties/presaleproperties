
CREATE OR REPLACE FUNCTION public.get_top_viewed_projects(days_back integer DEFAULT 90, result_limit integer DEFAULT 5)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  project_city text,
  total_views bigint,
  unique_visitors bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ca.project_id,
    COALESCE(pp.name, ca.project_name) as project_name,
    COALESCE(pp.city, '') as project_city,
    COUNT(*) as total_views,
    COUNT(DISTINCT ca.visitor_id) as unique_visitors
  FROM client_activity ca
  LEFT JOIN presale_projects pp ON pp.id = ca.project_id
  WHERE ca.activity_type = 'property_view'
    AND ca.project_id IS NOT NULL
    AND ca.created_at >= (now() - (days_back || ' days')::interval)
  GROUP BY ca.project_id, pp.name, ca.project_name, pp.city
  ORDER BY total_views DESC
  LIMIT result_limit;
$$;
