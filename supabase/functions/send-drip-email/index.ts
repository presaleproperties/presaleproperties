import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Drip sequence timing (days after signup)
const DRIP_SCHEDULE = [0, 1, 3, 6, 10]; // Email 1 is instant (0), then day 1, 3, 6, 10

// Buyer email sequence
const BUYER_SEQUENCE = [
  {
    subject: "Your Floorplans + Pricing Package 📋",
    body: (name: string, projectName: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Here's Your ${projectName || 'Presale'} Package</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Thanks for requesting information on ${projectName || 'this presale opportunity'}. I've attached the current floorplans and pricing.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Quick tip:</strong> Presale pricing changes fast. The prices in this package are valid as of today—reach out if you want me to confirm current availability.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Questions? Just reply to this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "Quick question: What size home are you looking for?",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">What are you looking for?</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">I wanted to check in and understand what you're looking for so I can point you to the right options.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Can you reply and let me know:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>1 bedroom, 2 bedroom, or townhome?</li>
          <li>Is parking important?</li>
          <li>Any specific areas you prefer?</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">This will help me shortlist the 2-3 best options for you.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "Understanding deposits + key dates (important)",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">The Deposit Structure Explained</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">One of the biggest advantages of presales is the deposit structure. Here's what you need to know:</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Typical deposit structure:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>5% on signing</li>
          <li>5% in 30-90 days</li>
          <li>5% at 180 days or later</li>
          <li>5% at completion</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Key dates to watch:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Rescission period (7 days to cancel with full refund)</li>
          <li>Deposit due dates</li>
          <li>Estimated completion date</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Want me to walk you through the specific deposit structure for a project you're interested in?</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "3 mistakes that cost presale buyers money",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Avoid These 3 Costly Mistakes</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">After helping hundreds of buyers with presales, here are the 3 mistakes I see most often:</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>1. Not reading the disclosure statement</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">This document contains everything—completion delays, strata fees, finishing specs. Most buyers skim it. Don't.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>2. Ignoring assignment restrictions</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">If you might need to sell before completion, assignment terms matter. Some projects charge 2-3% fees or don't allow assignments at all.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>3. Not confirming financing early</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">Interest rates change. Get pre-approved and understand what you can afford at completion, not just today.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;">Questions about any of this? Reply and I'll help clarify.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "Want me to shortlist 3 options for you?",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Let's Find Your Best Options</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">There are a lot of presale projects out there right now. Instead of sorting through them all, let me help.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Here's what I can do:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Review your criteria (size, budget, location, timeline)</li>
          <li>Shortlist the 3 best options that match</li>
          <li>Compare deposit terms and incentives</li>
          <li>Identify any red flags or concerns</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">It takes about 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://presaleproperties.ca/contact" style="background-color: #d4af37; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Book a 10-min Fit Call</a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
];

// Investor email sequence
const INVESTOR_SEQUENCE = [
  {
    subject: "Your Floorplans + Pricing Package 📋",
    body: (name: string, projectName: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Here's Your ${projectName || 'Presale'} Package</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Thanks for your interest in ${projectName || 'this presale opportunity'}. I've attached the current floorplans and pricing.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>For investors:</strong> I've included a quick rental yield estimate where available. Let me know if you want a more detailed analysis for a specific unit.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Questions? Just reply to this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "What's your investment strategy?",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Understanding Your Goals</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">To point you to the right opportunities, it helps to understand your investment approach:</p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li><strong>Cash flow focus?</strong> → I'll prioritize projects with strong rental demand</li>
          <li><strong>Appreciation play?</strong> → I'll look at emerging areas with growth catalysts</li>
          <li><strong>Assignment strategy?</strong> → I'll filter for projects with favorable assignment terms</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Reply and let me know which matters most to you, and I'll tailor my recommendations.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "Deposit structure: How to maximize leverage",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Leverage the Deposit Structure</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Smart investors use presale deposit structures strategically. Here's how:</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>The math:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>$800K unit with 15% deposit = $120K down</li>
          <li>If the unit appreciates 10% by completion = $80K gain</li>
          <li>That's a 67% return on your deposit capital</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>What to look for:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Extended deposit schedules (stretch capital further)</li>
          <li>Developer financing options</li>
          <li>Projects in appreciation corridors</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Want me to analyze the ROI potential on a specific project?</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "3 investor mistakes that kill returns",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">3 Mistakes That Kill Returns</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">I've seen investors leave money on the table. Here's what to avoid:</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>1. Ignoring rental restrictions</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">Some stratas limit rentals to 50% of units. If you can't rent, your cash flow strategy is dead.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>2. Underestimating carrying costs</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">Strata fees, property tax, insurance, vacancy—these add up. Build a realistic pro forma.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>3. Buying the wrong floor plan</strong></p>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-left: 20px;">Renters want function over flash. That expensive corner unit might not rent faster than a standard layout.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;">Want me to review a project from an investor lens? Just reply.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
  {
    subject: "Let's build your presale portfolio strategy",
    body: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Ready to Build a Strategy?</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Whether you're looking to add one unit or build a portfolio, having a clear strategy makes all the difference.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>In a 10-min call, we can cover:</strong></p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Your investment goals and timeline</li>
          <li>The 3 best projects for your criteria right now</li>
          <li>Assignment vs hold strategy comparison</li>
          <li>Realistic ROI projections</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://presaleproperties.ca/contact" style="background-color: #d4af37; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Book a 10-min Strategy Call</a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">— The PresaleProperties Team</p>
      </div>
    `,
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting drip email campaign check...");

    // Find leads who need their next drip email
    const now = new Date().toISOString();
    const { data: leads, error: leadsError } = await supabase
      .from("project_leads")
      .select("id, name, email, persona, drip_sequence, last_drip_sent, project_id, presale_projects(name)")
      .lte("next_drip_at", now)
      .lt("last_drip_sent", 5)
      .limit(50);

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      throw leadsError;
    }

    if (!leads || leads.length === 0) {
      console.log("No leads need drip emails right now");
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${leads.length} leads needing drip emails`);

    let sentCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      try {
        const emailIndex = lead.last_drip_sent; // 0-4
        const isInvestor = lead.persona === "investor" || lead.drip_sequence === "investor";
        const sequence = isInvestor ? INVESTOR_SEQUENCE : BUYER_SEQUENCE;
        const emailTemplate = sequence[emailIndex];

        if (!emailTemplate) {
          console.log(`No more emails for lead ${lead.id}, marking complete`);
          await supabase
            .from("project_leads")
            .update({ next_drip_at: null })
            .eq("id", lead.id);
          continue;
        }

        const projectName = (lead as any).presale_projects?.name || "";
        const subject = emailTemplate.subject;
        const htmlContent = emailTemplate.body(lead.name, projectName);

        console.log(`Sending drip email ${emailIndex + 1} to ${lead.email}`);

        // Send the email
        const emailResponse = await resend.emails.send({
          from: "PresaleProperties <onboarding@resend.dev>",
          to: [lead.email],
          subject,
          html: htmlContent,
        });

        console.log(`Email sent to ${lead.email}:`, emailResponse);

        // Log the email
        await supabase.from("email_logs").insert({
          lead_id: lead.id,
          email_to: lead.email,
          subject,
          template_type: `drip_${isInvestor ? "investor" : "buyer"}_${emailIndex + 1}`,
          status: "sent",
        });

        // Calculate next drip time
        const nextDripIndex = emailIndex + 1;
        let nextDripAt = null;

        if (nextDripIndex < 5) {
          const daysUntilNext = DRIP_SCHEDULE[nextDripIndex] - DRIP_SCHEDULE[emailIndex];
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + daysUntilNext);
          nextDate.setHours(10, 0, 0, 0); // Send at 10 AM
          nextDripAt = nextDate.toISOString();
        }

        // Update lead
        await supabase
          .from("project_leads")
          .update({
            last_drip_sent: nextDripIndex,
            next_drip_at: nextDripAt,
          })
          .eq("id", lead.id);

        sentCount++;
      } catch (emailError: any) {
        console.error(`Error sending to ${lead.email}:`, emailError);
        
        // Log the failure
        await supabase.from("email_logs").insert({
          lead_id: lead.id,
          email_to: lead.email,
          subject: "Drip email",
          template_type: "drip_error",
          status: "failed",
          error_message: emailError.message,
        });

        errorCount++;
      }
    }

    console.log(`Drip campaign complete: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ sent: sentCount, errors: errorCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in drip campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
