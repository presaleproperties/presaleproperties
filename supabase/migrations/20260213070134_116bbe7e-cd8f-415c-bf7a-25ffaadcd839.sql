
-- Function to get engagement funnel stats
CREATE OR REPLACE FUNCTION public.get_engagement_funnel(days_back integer DEFAULT 90)
RETURNS TABLE(
  total_page_views bigint,
  total_property_views bigint,
  total_floorplan_views bigint,
  total_cta_clicks bigint,
  total_form_starts bigint,
  total_form_submits bigint,
  unique_page_viewers bigint,
  unique_property_viewers bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE activity_type = 'page_view') as total_page_views,
    COUNT(*) FILTER (WHERE activity_type = 'property_view') as total_property_views,
    COUNT(*) FILTER (WHERE activity_type = 'floorplan_view') as total_floorplan_views,
    COUNT(*) FILTER (WHERE activity_type = 'cta_click') as total_cta_clicks,
    COUNT(*) FILTER (WHERE activity_type = 'form_start') as total_form_starts,
    COUNT(*) FILTER (WHERE activity_type = 'form_submit') as total_form_submits,
    COUNT(DISTINCT visitor_id) FILTER (WHERE activity_type = 'page_view') as unique_page_viewers,
    COUNT(DISTINCT visitor_id) FILTER (WHERE activity_type = 'property_view') as unique_property_viewers
  FROM client_activity
  WHERE created_at >= (now() - (days_back || ' days')::interval);
$$;

-- Function to get top viewed projects with engagement data
CREATE OR REPLACE FUNCTION public.get_top_projects_with_engagement(days_back integer DEFAULT 90, result_limit integer DEFAULT 5)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  project_city text,
  total_views bigint,
  unique_visitors bigint,
  floorplan_views bigint,
  cta_clicks bigint,
  form_starts bigint,
  form_submits bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ca.project_id,
    COALESCE(pp.name, ca.project_name) as project_name,
    COALESCE(pp.city, '') as project_city,
    COUNT(*) FILTER (WHERE ca.activity_type = 'property_view') as total_views,
    COUNT(DISTINCT ca.visitor_id) FILTER (WHERE ca.activity_type = 'property_view') as unique_visitors,
    COUNT(*) FILTER (WHERE ca.activity_type = 'floorplan_view') as floorplan_views,
    COUNT(*) FILTER (WHERE ca.activity_type = 'cta_click') as cta_clicks,
    COUNT(*) FILTER (WHERE ca.activity_type = 'form_start') as form_starts,
    COUNT(*) FILTER (WHERE ca.activity_type = 'form_submit') as form_submits
  FROM client_activity ca
  LEFT JOIN presale_projects pp ON pp.id = ca.project_id
  WHERE ca.project_id IS NOT NULL
    AND ca.created_at >= (now() - (days_back || ' days')::interval)
  GROUP BY ca.project_id, pp.name, ca.project_name, pp.city
  ORDER BY total_views DESC
  LIMIT result_limit;
$$;
