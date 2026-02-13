
CREATE OR REPLACE FUNCTION public.get_top_mls_listings_with_engagement(days_back integer DEFAULT 90, result_limit integer DEFAULT 5)
 RETURNS TABLE(
   listing_id uuid,
   listing_key text,
   property_address text,
   city text,
   bedrooms_total integer,
   bathrooms_total integer,
   listing_price numeric,
   total_views bigint,
   unique_viewers bigint,
   cta_clicks bigint,
   form_starts bigint
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ml.id as listing_id,
    ml.listing_key,
    CONCAT(ml.street_number, ' ', ml.street_name, ' ', ml.city) as property_address,
    ml.city,
    ml.bedrooms_total,
    ml.bathrooms_total,
    ml.listing_price,
    COUNT(*) FILTER (WHERE ca.activity_type = 'property_view') as total_views,
    COUNT(DISTINCT ca.visitor_id) FILTER (WHERE ca.activity_type = 'property_view') as unique_viewers,
    COUNT(*) FILTER (WHERE ca.activity_type = 'cta_click') as cta_clicks,
    COUNT(*) FILTER (WHERE ca.activity_type = 'form_start') as form_starts
  FROM mls_listings ml
  LEFT JOIN client_activity ca ON ca.listing_key = ml.listing_key
    AND ca.created_at >= (now() - (days_back || ' days')::interval)
  WHERE ml.mls_status = ANY (ARRAY['Active'::text, 'Pending'::text])
  GROUP BY ml.id, ml.listing_key, ml.street_number, ml.street_name, ml.city, ml.bedrooms_total, ml.bathrooms_total, ml.listing_price
  ORDER BY total_views DESC
  LIMIT result_limit;
$function$
