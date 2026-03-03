import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SENDER = "PresaleProperties <onboarding@resend.dev>";

interface Body {
  email: string;
}

async function getSenderEmail(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_sender")
    .maybeSingle();
  
  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }
  return DEFAULT_SENDER;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || !supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { createClient: createAuthClient } = await import("https://esm.sh/@supabase/supabase-js@2.89.0");
    const anonClient = createAuthClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: adminRole } = await anonClient.from("user_roles").select("role").eq("user_id", claimsData.claims.sub).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!resendApiKey) throw new Error("Email service not configured");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Backend not configured");

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { email }: Body = await req.json();

    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 255 || !normalizedEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const origin = req.headers.get("origin") || "";
    const redirectTo = origin ? `${origin}/admin/login?type=recovery` : undefined;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("Failed to generate reset link");

    const senderEmail = await getSenderEmail(supabaseAdmin);

    // TEMPORARY: Send to verified testing inbox for end-to-end testing
    const testingInbox = "marketing@meetuzair.com";
    const emailResponse = await resend.emails.send({
      from: senderEmail,
      to: [testingInbox],
      subject: `Admin password reset (for ${normalizedEmail})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 12px;">Reset your admin password</h1>
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Click the button below to set a new password for your admin account.</p>
          <p style="margin: 24px 0;">
            <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 12px 16px; border-radius: 10px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;">Reset Password</a>
          </p>
          <p style="color: #6a6a6a; font-size: 12px; line-height: 1.6;">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });

    console.log("Admin reset email sent", { email: normalizedEmail, emailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    // Normalize common errors so the client gets a helpful message.
    const status = Number(error?.status ?? error?.statusCode ?? 500);
    const message = String(error?.message || "Failed to send reset email");

    console.error("Error in send-admin-reset:", { status, message, code: error?.code });

    // If the email isn't registered, return 404 instead of 500.
    if (status === 404 || error?.code === "user_not_found") {
      return new Response(JSON.stringify({ error: "User with this email not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
