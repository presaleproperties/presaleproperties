import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  email: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) throw new Error("Email service not configured");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Backend not configured");

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("Failed to generate reset link");

    const emailResponse = await resend.emails.send({
      from: "PresaleProperties <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Admin password reset",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 12px;">Reset your admin password</h1>
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Click the button below to set a new password for your admin account.</p>
          <p style="margin: 24px 0;">
            <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 12px 16px; border-radius: 10px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;">Reset Password</a>
          </p>
          <p style="color: #6a6a6a; font-size: 12px; line-height: 1.6;">If you didn’t request this, you can ignore this email.</p>
        </div>
      `,
    });

    console.log("Admin reset email sent", { email: normalizedEmail, emailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-admin-reset:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed to send reset email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
