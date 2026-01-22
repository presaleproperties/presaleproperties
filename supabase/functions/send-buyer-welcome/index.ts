import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BuyerWelcomeRequest {
  userId: string;
  email: string;
  fullName: string;
  buyerType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, fullName, buyerType }: BuyerWelcomeRequest = await req.json();
    
    console.log("Sending welcome email to buyer:", email);

    const firstName = fullName?.split(" ")[0] || "there";
    const buyerTypeLabel = buyerType === "first_time" ? "first-time buyer" 
      : buyerType === "investor" ? "investor"
      : buyerType === "upgrader" ? "looking to upgrade"
      : "looking to downsize";

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Presale Properties <hello@presaleproperties.com>",
      to: [email],
      subject: "Welcome to VIP! Here's Your $1,500 Closing Credit 🏠",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://presaleproperties.com/logo.svg" alt="Presale Properties" style="height: 40px;" />
          </div>
          
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0 0 10px; font-size: 28px;">Welcome to VIP, ${firstName}! 🎉</h1>
            <p style="margin: 0; opacity: 0.9;">Your exclusive access starts now</p>
          </div>
          
          <p>Hi ${firstName},</p>
          
          <p>Congratulations on joining our VIP program! As a ${buyerTypeLabel}, you now have access to exclusive benefits that will help you find the perfect presale property.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 10px; color: #92400e;">Your $1,500 Closing Credit</h3>
            <p style="margin: 0; color: #78350f;">When you purchase a presale through us, you'll receive a $1,500 credit toward your closing costs. This can be used for legal fees, tenant placement, or as a cash rebate.</p>
          </div>
          
          <h3 style="color: #1a1a2e;">Your VIP Benefits:</h3>
          <ul style="padding-left: 20px;">
            <li><strong>Early Access</strong> — Be first to know about new presale launches</li>
            <li><strong>VIP Pricing</strong> — Access exclusive developer incentives</li>
            <li><strong>Expert Guidance</strong> — Personalized support from our team</li>
            <li><strong>Save & Compare</strong> — Build your shortlist of favorite projects</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://presaleproperties.com/buyer" style="display: inline-block; background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Dashboard</a>
          </div>
          
          <p>I'm Umar Ali, your dedicated presale specialist. If you have any questions or want to discuss your goals, just reply to this email or book a call.</p>
          
          <p>Looking forward to helping you find your perfect presale!</p>
          
          <p>Best,<br><strong>Umar Ali</strong><br>Presale Specialist | Real Broker<br>umar@presaleproperties.com</p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            Presale Properties | Vancouver, BC<br>
            <a href="https://presaleproperties.com" style="color: #666;">presaleproperties.com</a>
          </p>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    // Record email in drip sequence
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get buyer profile ID
    const { data: buyerProfile } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (buyerProfile) {
      await supabase.from("buyer_drip_emails").insert({
        buyer_id: buyerProfile.id,
        email_type: "welcome",
        sent_at: new Date().toISOString(),
      });

      // Schedule next drip email (VIP benefits) for 2 days later
      const nextDripDate = new Date();
      nextDripDate.setDate(nextDripDate.getDate() + 2);

      await supabase
        .from("buyer_profiles")
        .update({
          drip_sequence_step: 1,
          next_drip_at: nextDripDate.toISOString(),
        })
        .eq("id", buyerProfile.id);
    }

    // Also sync to Zapier/Lofty
    const zapierWebhook = Deno.env.get("ZAPIER_PROJECT_LEADS_WEBHOOK");
    if (zapierWebhook) {
      await fetch(zapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: fullName,
          phone: "",
          lead_source: "VIP Account Signup",
          form_type: "VIP Account Creation",
          tags: `VIP Member, ${buyerType === "investor" ? "Investor" : "End User"}, Account Created`,
          landing_page: "https://presaleproperties.com/buyer/signup",
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-buyer-welcome:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
