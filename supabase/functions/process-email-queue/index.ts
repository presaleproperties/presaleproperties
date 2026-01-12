/**
 * Email Queue Processor
 * Processes queued emails that are scheduled to be sent
 * Run this via cron job or manual trigger
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const now = new Date().toISOString();

    // Get queued emails that are ready to send
    const { data: jobs, error: jobsError } = await supabase
      .from("email_jobs")
      .select(`
        id,
        to_email,
        to_name,
        variables,
        template_id,
        email_templates (
          id,
          subject,
          html_content
        )
      `)
      .eq("status", "queued")
      .lte("scheduled_at", now)
      .limit(50);

    if (jobsError) {
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No queued emails to process",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} queued emails`);

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      const templateData = job.email_templates as unknown;
      const template = templateData as { id: string; subject: string; html_content: string } | null;
      
      if (!template) {
        console.log(`Job ${job.id}: No template found`);
        await supabase
          .from("email_jobs")
          .update({ status: "failed", error_message: "Template not found" })
          .eq("id", job.id);
        failed++;
        continue;
      }

      // Mark as processing
      await supabase
        .from("email_jobs")
        .update({ status: "processing" })
        .eq("id", job.id);

      try {
        const variables = job.variables as Record<string, unknown> || {};
        const subject = renderTemplate(template.subject, variables);
        const htmlContent = renderTemplate(template.html_content, variables);

        const result = await sendEmail({
          to: job.to_email,
          subject,
          html: htmlContent,
        });

        if (result.success) {
          await supabase
            .from("email_jobs")
            .update({ 
              status: "sent", 
              sent_at: new Date().toISOString() 
            })
            .eq("id", job.id);
          processed++;
        } else {
          await supabase
            .from("email_jobs")
            .update({ 
              status: "failed", 
              error_message: result.error 
            })
            .eq("id", job.id);
          failed++;
        }
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        await supabase
          .from("email_jobs")
          .update({ 
            status: "failed", 
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq("id", job.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: jobs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Queue processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
