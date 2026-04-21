
-- Normalize a couple of drifted lead_source values
UPDATE public.project_leads SET lead_source = 'floor_plan_request' WHERE lead_source = 'floor_plan_request_step1';
UPDATE public.project_leads SET lead_source = 'city_list' WHERE lead_source = 'city_list_langley';

-- Backfill missing form_type from lead_source
UPDATE public.project_leads
SET form_type = CASE lead_source
  WHEN 'floor_plan_request'      THEN 'floor_plan_request'
  WHEN 'floor_plan_request_step1' THEN 'floor_plan_request'
  WHEN 'pitch_deck'              THEN 'deck_gate'
  WHEN 'exit_intent_guide'       THEN 'exit_intent'
  WHEN 'consultation'            THEN 'consultation'
  WHEN 'general_inquiry'         THEN 'project_inquiry'
  WHEN 'resale_listing'          THEN 'resale_inquiry'
  WHEN 'test'                    THEN 'test'
  ELSE 'project_inquiry'
END
WHERE form_type IS NULL
  AND lead_source IS NOT NULL;
