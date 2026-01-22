import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: RequestBody = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating verification code for:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete any existing codes for this email
    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", email.toLowerCase());

    // Store the new code
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to store verification code:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const { error: emailError } = await resend.emails.send({
      from: "Presale Properties <no-reply@presaleproperties.com>",
      to: [email],
      subject: "Your VIP Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <tr>
                    <td style="padding: 40px 32px; text-align: center;">
                      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #18181b;">
                        Your Verification Code
                      </h1>
                      <p style="margin: 0 0 32px; font-size: 15px; color: #71717a;">
                        ${name ? `Hi ${name}, enter` : 'Enter'} this code to verify your VIP membership
                      </p>
                      
                      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: monospace;">
                          ${code}
                        </span>
                      </div>
                      
                      <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                        This code expires in 10 minutes.<br>
                        If you didn't request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                        © ${new Date().getFullYear()} Presale Properties. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Failed to send verification email:", emailError);
      throw new Error("Failed to send verification email");
    }

    console.log("Verification code sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification code" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
