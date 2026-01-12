/**
 * Email Workflow Trigger Engine
 * Processes workflow events and queues emails based on workflow configuration
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

function renderTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event, data, meta }: WorkflowTriggerRequest = await req.json();

    if (!event || !data?.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event and data.email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing workflow event: ${event} for ${data.email}`);

    // Find active workflow for this event
    const { data: workflow, error: workflowError } = await supabase
      .from("email_workflows")
      .select(`
        id,
        workflow_key,
        name,
        audience_type
      `)
      .eq("trigger_event", event)
      .eq("is_active", true)
      .maybeSingle();

    if (workflowError) {
      console.error("Error fetching workflow:", workflowError);
      throw workflowError;
    }

    if (!workflow) {
      console.log(`No active workflow found for event: ${event}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No active workflow for event: ${event}`,
          emails_sent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get workflow steps with templates
    const { data: steps, error: stepsError } = await supabase
      .from("email_workflow_steps")
      .select(`
        id,
        step_order,
        delay_minutes,
        template_id,
        send_condition,
        email_templates (
          id,
          template_key,
          subject,
          html_content
        )
      `)
      .eq("workflow_id", workflow.id)
      .eq("is_active", true)
      .order("step_order", { ascending: true });

    if (stepsError) {
      console.error("Error fetching workflow steps:", stepsError);
      throw stepsError;
    }

    if (!steps || steps.length === 0) {
      console.log(`No active steps found for workflow: ${workflow.workflow_key}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No steps configured for workflow: ${workflow.workflow_key}`,
          emails_sent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    // Process each step
    for (const step of steps) {
      const templateData = step.email_templates as unknown;
      const template = templateData as { id: string; template_key: string; subject: string; html_content: string } | null;
      if (!template) {
        console.log(`Step ${step.step_order}: No template found`);
        continue;
      }

      // Build variables for template
      const variables: Record<string, unknown> = {
        first_name: data.first_name || "there",
        last_name: data.last_name || "",
        email: data.email,
        project_name: data.project_name || "",
        city: data.city || "",
        price_range: data.price_range || "",
        completion_date: data.completion_date || "",
        booking_date: data.booking_date || "",
        booking_time: data.booking_time || "",
        request_type: data.request_type || "General Inquiry",
        submitted_date: new Date().toLocaleDateString("en-US", { 
          weekday: "long", 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        }),
        project_url: data.project_id 
          ? `https://presaleproperties.com/projects/${data.project_id}` 
          : "https://presaleproperties.com/presale-projects",
      };

      // If delay is 0, send immediately; otherwise queue
      if (step.delay_minutes === 0) {
        const subject = renderTemplate(template.subject, variables);
        const htmlContent = renderTemplate(template.html_content, variables);

        console.log(`Sending immediate email for step ${step.step_order}: ${template.template_key}`);

        const result = await sendEmail({
          to: data.email,
          subject,
          html: htmlContent,
        });

        if (result.success) {
          emailsSent++;
          
          // Log the email job
          await supabase.from("email_jobs").insert({
            to_email: data.email,
            to_name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            template_id: template.id,
            workflow_id: workflow.id,
            variables,
            status: "sent",
            sent_at: new Date().toISOString(),
            meta: meta || {},
          });
        } else {
          errors.push(`Step ${step.step_order}: ${result.error}`);
          
          // Log failed job
          await supabase.from("email_jobs").insert({
            to_email: data.email,
            to_name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            template_id: template.id,
            workflow_id: workflow.id,
            variables,
            status: "failed",
            error_message: result.error,
            meta: meta || {},
          });
        }
      } else {
        // Queue for later (future enhancement - for now just log)
        const scheduledAt = new Date(Date.now() + step.delay_minutes * 60 * 1000);
        
        await supabase.from("email_jobs").insert({
          to_email: data.email,
          to_name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          template_id: template.id,
          workflow_id: workflow.id,
          variables,
          scheduled_at: scheduledAt.toISOString(),
          status: "queued",
          meta: meta || {},
        });

        console.log(`Queued email for step ${step.step_order} at ${scheduledAt.toISOString()}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow: workflow.workflow_key,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
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
