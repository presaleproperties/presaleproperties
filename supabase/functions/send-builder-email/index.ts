/**
 * Send Builder Email
 * Sends the Email Builder's rendered HTML to one or more recipients via Gmail SMTP
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name?: string;
}

interface SendBuilderEmailRequest {
  subject: string;
  html: string;
  recipients: Recipient[];
  fromName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html, recipients, fromName }: SendBuilderEmailRequest = await req.json();

    if (!subject || !html || !recipients?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, html, and recipients" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recipients.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 recipients per send" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject,
          html,
          fromName: fromName || "Presale Properties",
        });

        if (result.success) {
          sent++;
          // Log to email_logs
          await supabase.from("email_logs").insert({
            email_to: recipient.email,
            subject,
            status: "sent",
            template_type: "builder_send",
          });
        } else {
          failed++;
          errors.push(`${recipient.email}: ${result.error}`);
          await supabase.from("email_logs").insert({
            email_to: recipient.email,
            subject,
            status: "failed",
            error_message: result.error,
            template_type: "builder_send",
          });
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${recipient.email}: ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-builder-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
