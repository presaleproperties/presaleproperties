import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const SITE_URL = "https://presaleproperties.com";
const ADMIN_EMAIL = "info@presaleproperties.com";

interface EmailPayload {
  event_type: string;
  data: Record<string, any>;
}

function buildEmail(event: string, data: Record<string, any>): { to: string[]; subject: string; html: string } | null {
  switch (event) {
    // ── Admin notifications ──
    case "access_request": {
      return {
        to: [ADMIN_EMAIL],
        subject: `🔓 New Off-Market Access Request: ${data.project_name}`,
        html: `
          <h2>New Off-Market Access Request</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${data.first_name} ${data.last_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${data.email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${data.phone}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Project</td><td style="padding:8px">${data.project_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Budget</td><td style="padding:8px">${data.budget || "N/A"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Timeline</td><td style="padding:8px">${data.timeline || "N/A"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Has Agent</td><td style="padding:8px">${data.has_agent ? "Yes" : "No"}</td></tr>
          </table>
        `,
      };
    }

    case "developer_signup": {
      return {
        to: [ADMIN_EMAIL],
        subject: `🏗️ New Developer Application: ${data.company_name}`,
        html: `
          <h2>New Developer Signup</h2>
          <p><strong>Company:</strong> ${data.company_name}</p>
          <p><strong>Contact:</strong> ${data.contact_name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
          <p><strong>Website:</strong> ${data.website || "N/A"}</p>
        `,
      };
    }

    case "developer_submission": {
      return {
        to: [ADMIN_EMAIL],
        subject: `📋 New Inventory Submission: ${data.project_name}`,
        html: `
          <h2>Developer Inventory Submission</h2>
          <p><strong>Project:</strong> ${data.project_name}</p>
          <p><strong>Developer:</strong> ${data.developer_name}</p>
          <p><strong>Units:</strong> ${data.unit_count}</p>
          <p>Review in <a href="${SITE_URL}/admin/off-market/submissions">Admin Portal</a></p>
        `,
      };
    }

    // ── Developer notifications ──
    case "developer_verified": {
      if (!data.email) return null;
      return {
        to: [data.email],
        subject: "✅ Your Developer Account is Approved — PresaleProperties.com",
        html: `
          <h2>Welcome to PresaleProperties.com!</h2>
          <p>Hi ${data.contact_name},</p>
          <p>Your developer account for <strong>${data.company_name}</strong> has been approved.</p>
          <p>You can now log in and upload your inventory:</p>
          <p><a href="${SITE_URL}/developer-portal/login" style="display:inline-block;padding:12px 24px;background:#C4993A;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Log In to Developer Portal</a></p>
        `,
      };
    }

    case "developer_rejected": {
      if (!data.email) return null;
      return {
        to: [data.email],
        subject: "Developer Application Update — PresaleProperties.com",
        html: `
          <p>Hi ${data.contact_name},</p>
          <p>Thank you for your interest in listing on PresaleProperties.com. Unfortunately, your developer application was not approved at this time.</p>
          <p>If you have questions, please contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.</p>
        `,
      };
    }

    case "listing_approved": {
      if (!data.developer_email) return null;
      return {
        to: [data.developer_email],
        subject: `🎉 Your ${data.project_name} inventory is now live!`,
        html: `
          <h2>Your Inventory is Live!</h2>
          <p>Great news — your <strong>${data.project_name}</strong> inventory is now published on PresaleProperties.com.</p>
          <p><a href="${SITE_URL}/off-market/${data.project_slug}" style="display:inline-block;padding:12px 24px;background:#C4993A;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Live Listing</a></p>
        `,
      };
    }

    case "listing_changes_requested": {
      if (!data.developer_email) return null;
      return {
        to: [data.developer_email],
        subject: `📝 Feedback on your ${data.project_name} submission`,
        html: `
          <p>Hi,</p>
          <p>We've reviewed your <strong>${data.project_name}</strong> submission and have some feedback:</p>
          <blockquote style="border-left:3px solid #C4993A;padding-left:12px;margin:16px 0;color:#666">${data.admin_notes || "Please review and update your submission."}</blockquote>
          <p>Your listing has been returned to draft status. Please make updates and resubmit.</p>
          <p><a href="${SITE_URL}/developer-portal/login">Log in to Developer Portal</a></p>
        `,
      };
    }

    case "developer_new_inquiry": {
      if (!data.developer_email) return null;
      return {
        to: [data.developer_email],
        subject: `👤 New buyer inquiry for ${data.project_name}`,
        html: `
          <h2>New Buyer Inquiry</h2>
          <p>A buyer has requested access to your <strong>${data.project_name}</strong> inventory.</p>
          <p><strong>Name:</strong> ${data.buyer_name}</p>
          <p><strong>Budget:</strong> ${data.budget || "N/A"}</p>
          <p>Log in to view full details: <a href="${SITE_URL}/developer-portal/login">Developer Portal</a></p>
        `,
      };
    }

    // ── Client notifications ──
    case "access_approved": {
      if (!data.email) return null;
      return {
        to: [data.email],
        subject: `🔓 VIP Access Granted: ${data.project_name}`,
        html: `
          <h2>You've been granted VIP access!</h2>
          <p>Hi ${data.first_name},</p>
          <p>You now have access to exclusive pricing and floor plans for <strong>${data.project_name}</strong>.</p>
          <p><a href="${SITE_URL}/off-market/${data.project_slug}" style="display:inline-block;padding:12px 24px;background:#C4993A;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Exclusive Details</a></p>
        `,
      };
    }

    case "access_denied": {
      if (!data.email) return null;
      return {
        to: [data.email],
        subject: `Update on your ${data.project_name} access request`,
        html: `
          <p>Hi ${data.first_name},</p>
          <p>Thank you for your interest in <strong>${data.project_name}</strong>. Our team will reach out with alternative options that may suit your needs.</p>
          <p>In the meantime, browse our other exclusive listings: <a href="${SITE_URL}/off-market">Off-Market Inventory</a></p>
        `,
      };
    }

    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: EmailPayload = await req.json();
    const { event_type, data } = payload;

    if (!event_type || !data) {
      return new Response(JSON.stringify({ error: "Missing event_type or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = buildEmail(event_type, data);
    if (!email) {
      return new Response(JSON.stringify({ error: "Unknown event type or missing recipient" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "PresaleProperties <info@presaleproperties.com>",
        to: email.to,
        subject: email.subject,
        html: email.html,
      }),
    });

    const result = await response.json();

    // Log to email_logs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("email_logs").insert({
      email_to: email.to[0],
      subject: email.subject,
      template_type: `off_market_${event_type}`,
      status: response.ok ? "sent" : "failed",
      error_message: response.ok ? null : JSON.stringify(result),
    });

    return new Response(JSON.stringify({ success: response.ok, result }), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
