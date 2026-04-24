CREATE OR REPLACE FUNCTION public.get_trending_projects(result_limit integer DEFAULT 4)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  city text,
  neighborhood text,
  starting_price numeric,
  featured_image text,
  project_type text,
  short_description text,
  hotness_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH lead_counts AS (
    SELECT project_id, COUNT(*)::numeric AS recent_leads
    FROM public.project_leads
    WHERE project_id IS NOT NULL
      AND created_at >= now() - interval '30 days'
    GROUP BY project_id
  ),
  deck_counts AS (
    SELECT pp.id AS project_id, COUNT(dv.*)::numeric AS recent_deck_visits
    FROM public.presale_projects pp
    LEFT JOIN public.deck_visits dv
      ON lower(dv.project_name) = lower(pp.name)
     AND dv.created_at >= now() - interval '30 days'
    GROUP BY pp.id
  )
  SELECT
    pp.id,
    pp.name,
    pp.slug,
    pp.city,
    pp.neighborhood,
    pp.starting_price,
    pp.featured_image,
    pp.project_type,
    pp.short_description,
    (
      COALESCE(pp.view_count, 0)::numeric * 1.0
      + COALESCE(lc.recent_leads, 0) * 25.0
      + COALESCE(dc.recent_deck_visits, 0) * 15.0
      + CASE WHEN pp.is_featured THEN 200.0 ELSE 0.0 END
      - LEAST(EXTRACT(EPOCH FROM (now() - COALESCE(pp.updated_at, pp.created_at))) / 86400.0 * 0.5, 100.0)
    ) AS hotness_score
  FROM public.presale_projects pp
  LEFT JOIN lead_counts lc ON lc.project_id = pp.id
  LEFT JOIN deck_counts dc ON dc.project_id = pp.id
  WHERE pp.is_published = true
    AND pp.featured_image IS NOT NULL
  ORDER BY hotness_score DESC NULLS LAST
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_projects(integer) TO anon, authenticated;