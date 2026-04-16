/**
 * Send Builder Email
 * Sends the Email Builder's rendered HTML to one or more recipients via Gmail SMTP
 * Injects tracking pixel for open tracking
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name?: string;
  firstName?: string;
}

function personalizeContent(content: string, firstName?: string) {
  const safeFirstName = firstName?.trim() || "there";

  return content
    .replaceAll("[First Name]", safeFirstName)
    .replaceAll("[first name]", safeFirstName)
    .replaceAll("[FirstName]", safeFirstName)
    .replaceAll("[Lead Name]", safeFirstName)
    .replaceAll("[lead name]", safeFirstName)
    .replaceAll("[Lead name]", safeFirstName)
    .replaceAll("[Client Name]", safeFirstName)
    .replaceAll("[client name]", safeFirstName)
    .replaceAll("[Client name]", safeFirstName)
    .replaceAll("[Name]", safeFirstName)
    .replaceAll("[name]", safeFirstName)
    .replaceAll("{{first_name}}", safeFirstName)
    .replaceAll("{{firstName}}", safeFirstName)
    .replaceAll("{{lead_name}}", safeFirstName)
    .replaceAll("{{leadName}}", safeFirstName)
    .replaceAll("{{client_name}}", safeFirstName)
    .replaceAll("{{clientName}}", safeFirstName)
    .replaceAll("{{name}}", safeFirstName)
    .replaceAll("*|FNAME|*", safeFirstName)
    .replaceAll("{$name}", safeFirstName);
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

    // Build tracking pixel base URL
    const trackingBaseUrl = `${supabaseUrl}/functions/v1/track-email-open`;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const personalizedFirstName = recipient.firstName || recipient.name?.trim().split(/\s+/)[0] || undefined;

        // Create email log entry first to get tracking_id
        const { data: logEntry } = await supabase
          .from("email_logs")
          .insert({
            email_to: recipient.email,
            recipient_name: recipient.name || null,
            subject,
            status: "queued",
            template_type: "builder_send",
            sent_by: user.id,
          })
          .select("id, tracking_id")
          .single();

        const trackingId = logEntry?.tracking_id;

        // Personalize HTML content
        let personalizedHtml = personalizeContent(html, personalizedFirstName);

        // Rewrite links for click tracking
        if (trackingId) {
          personalizedHtml = personalizedHtml.replace(
            /href="(https?:\/\/[^"]+)"/gi,
            (_match: string, linkUrl: string) => {
              if (linkUrl.includes("track-email-open")) return `href="${linkUrl}"`;
              const clickUrl = `${trackingBaseUrl}?tid=${trackingId}&t=click&url=${encodeURIComponent(linkUrl)}`;
              return `href="${clickUrl}"`;
            }
          );
        }

        // Inject tracking pixel into HTML before </body>
        if (trackingId) {
          const pixelUrl = `${trackingBaseUrl}?tid=${trackingId}`;
          const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
          if (personalizedHtml.includes("</body>")) {
            personalizedHtml = personalizedHtml.replace("</body>", `${pixelTag}</body>`);
          } else {
            personalizedHtml += pixelTag;
          }
        }

        const result = await sendEmail({
          to: recipient.email,
          subject: personalizeContent(subject, personalizedFirstName),
          html: personalizedHtml,
          fromName: fromName || "Presale Properties",
          cc: user.email ? [user.email] : undefined,
          replyTo: user.email || undefined,
        });

        if (result.success) {
          sent++;
          if (logEntry) {
            await supabase
              .from("email_logs")
              .update({ status: "sent" })
              .eq("id", logEntry.id);
          }
        } else {
          failed++;
          errors.push(`${recipient.email}: ${result.error}`);
          if (logEntry) {
            await supabase
              .from("email_logs")
              .update({ status: "failed", error_message: result.error })
              .eq("id", logEntry.id);
          }
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
