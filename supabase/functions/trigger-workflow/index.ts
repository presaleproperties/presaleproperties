/**
 * Email Workflow Trigger Engine
 * Processes workflow events and queues emails based on workflow configuration
 * 
 * STATUS: DISABLED - Automated emails to leads are turned off
 * All lead data still flows to Zapier via send-project-lead and send-behavior-event
 * To re-enable, remove the early return block below
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowTriggerRequest {
  event: string;
  data: {
    email: string;
    first_name?: string;
    last_name?: string;
    project_name?: string;
    project_id?: string;
    city?: string;
    price_range?: string;
    completion_date?: string;
    booking_date?: string;
    booking_time?: string;
    request_type?: string;
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, data }: WorkflowTriggerRequest = await req.json();

    if (!event || !data?.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event and data.email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GLOBAL KILL SWITCH: Automated emails to leads are disabled
    // All lead data still flows to Zapier via other functions (send-project-lead, send-behavior-event)
    // To re-enable automated emails, comment out this block and restore the full implementation
    console.log(`[DISABLED] Automated lead emails are turned off. Event: ${event} for ${data.email}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Automated lead emails are disabled - data flows to Zapier only",
        emails_sent: 0,
        event 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Workflow trigger error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
