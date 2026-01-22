import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing buyer drip emails...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get buyers who are due for their next drip email
    const { data: buyers, error } = await supabase
      .from("buyer_profiles")
      .select("*")
      .lte("next_drip_at", new Date().toISOString())
      .lt("drip_sequence_step", 5) // We have 5 emails in the sequence
      .limit(50);

    if (error) {
      throw error;
    }

    console.log(`Found ${buyers?.length || 0} buyers due for drip emails`);

    const emailTemplates = [
      {
        step: 1,
        type: "vip_benefits",
        subject: "Your VIP Benefits Explained 📋",
        delay: 3, // Days until next email
      },
      {
        step: 2,
        type: "project_recommendations",
        subject: "New Projects You Might Love 🏗️",
        delay: 5,
      },
      {
        step: 3,
        type: "market_update",
        subject: "Vancouver Presale Market Update 📊",
        delay: 7,
      },
      {
        step: 4,
        type: "exclusive_access",
        subject: "Exclusive: Priority Access to New Launches 🔑",
        delay: 0, // End of sequence
      },
    ];

    let emailsSent = 0;

    for (const buyer of buyers || []) {
      const template = emailTemplates.find((t) => t.step === buyer.drip_sequence_step);
      if (!template) continue;

      const firstName = buyer.full_name?.split(" ")[0] || "there";

      // Generate email content based on template type
      let htmlContent = "";

      if (template.type === "vip_benefits") {
        htmlContent = `
          <h2>Understanding Your VIP Benefits</h2>
          <p>Hi ${firstName},</p>
          <p>As a VIP member, you have access to exclusive benefits that set you apart from other buyers. Here's a deeper look at what's included:</p>
          
          <h3>🏷️ VIP Pricing</h3>
          <p>Developers often offer special pricing tiers or incentives for our VIP members. This can include discounts, upgraded finishes, or reduced deposits.</p>
          
          <h3>⏰ Early Access</h3>
          <p>You'll be notified about new presale launches before they're publicly announced, giving you the best selection of units.</p>
          
          <h3>💰 $1,500 Closing Credit</h3>
          <p>When you purchase through us, you'll receive a $1,500 credit that can be used toward:</p>
          <ul>
            <li>Legal fees at closing</li>
            <li>Professional tenant placement (for investors)</li>
            <li>Cash rebate</li>
          </ul>
          
          <p>Ready to start exploring? <a href="https://presaleproperties.com/presale-projects">Browse our current presale projects</a>.</p>
        `;
      } else if (template.type === "project_recommendations") {
        // Get some featured projects
        const { data: projects } = await supabase
          .from("presale_projects")
          .select("name, slug, city, price_from, main_image_url")
          .eq("is_active", true)
          .in("status", ["Now Selling", "Coming Soon"])
          .limit(3);

        const projectsHtml = projects?.map((p) => `
          <div style="border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; margin-bottom: 15px;">
            <img src="${p.main_image_url || 'https://presaleproperties.com/placeholder.svg'}" alt="${p.name}" style="width: 100%; height: 150px; object-fit: cover;" />
            <div style="padding: 15px;">
              <h4 style="margin: 0 0 5px;">${p.name}</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">${p.city} • From $${p.price_from ? (p.price_from / 1000).toFixed(0) + 'K' : 'TBA'}</p>
              <a href="https://presaleproperties.com/presale-projects/${p.slug}" style="display: inline-block; margin-top: 10px; color: #0f766e; font-weight: 600;">View Details →</a>
            </div>
          </div>
        `).join("") || "";

        htmlContent = `
          <h2>Projects We Think You'll Love</h2>
          <p>Hi ${firstName},</p>
          <p>Based on your profile, here are some presale projects that might interest you:</p>
          ${projectsHtml || "<p>Browse our full collection at presaleproperties.com</p>"}
          <p><a href="https://presaleproperties.com/presale-projects">See all projects →</a></p>
        `;
      } else if (template.type === "market_update") {
        htmlContent = `
          <h2>Vancouver Presale Market Update</h2>
          <p>Hi ${firstName},</p>
          <p>Here's what's happening in the Vancouver presale market:</p>
          
          <h3>📈 Market Highlights</h3>
          <ul>
            <li>New project launches continue in Surrey, Langley, and Coquitlam</li>
            <li>Developer incentives are at their highest in months</li>
            <li>Interest rates are stabilizing, improving buyer confidence</li>
          </ul>
          
          <h3>💡 Insider Tip</h3>
          <p>The best time to buy a presale is often during the "VIP phase" when developers release the first units at their lowest prices. As a VIP member, you get notified first.</p>
          
          <p>Want to discuss your buying strategy? <a href="https://presaleproperties.com/contact">Book a call with our team</a>.</p>
        `;
      } else if (template.type === "exclusive_access") {
        htmlContent = `
          <h2>Your Exclusive Access Status</h2>
          <p>Hi ${firstName},</p>
          <p>Just a reminder that as a VIP member, you have priority access to new presale launches. Here's how it works:</p>
          
          <ol>
            <li><strong>We notify you first</strong> — Before public announcements</li>
            <li><strong>You get priority registration</strong> — Secure your spot before general buyers</li>
            <li><strong>You access VIP pricing</strong> — Often the lowest price tier</li>
            <li><strong>You receive your $1,500 credit</strong> — Applied at closing</li>
          </ol>
          
          <p>Keep an eye on your inbox—new projects are launching soon!</p>
          
          <p>Questions? Just reply to this email or visit your <a href="https://presaleproperties.com/buyer">VIP Dashboard</a>.</p>
        `;
      }

      // Send the email
      try {
        await resend.emails.send({
          from: "Presale Properties <hello@presaleproperties.com>",
          to: [buyer.email],
          subject: template.subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://presaleproperties.com/logo.svg" alt="Presale Properties" style="height: 40px;" />
              </div>
              ${htmlContent}
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
              <p>Best,<br><strong>Umar Ali</strong><br>Presale Specialist | Real Broker</p>
              <p style="font-size: 12px; color: #666; text-align: center;">
                <a href="https://presaleproperties.com" style="color: #666;">presaleproperties.com</a>
              </p>
            </body>
            </html>
          `,
        });

        // Record the email
        await supabase.from("buyer_drip_emails").insert({
          buyer_id: buyer.id,
          email_type: template.type,
          sent_at: new Date().toISOString(),
        });

        // Update buyer's drip sequence
        const nextStep = buyer.drip_sequence_step + 1;
        const nextDripAt = template.delay > 0
          ? new Date(Date.now() + template.delay * 24 * 60 * 60 * 1000).toISOString()
          : null;

        await supabase
          .from("buyer_profiles")
          .update({
            drip_sequence_step: nextStep,
            next_drip_at: nextDripAt,
          })
          .eq("id", buyer.id);

        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${buyer.email}:`, emailError);
      }
    }

    console.log(`Sent ${emailsSent} drip emails`);

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in process-buyer-drip:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
