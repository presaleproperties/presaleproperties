import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-function-token",
};

interface ExpiringListing {
  id: string;
  title: string;
  project_name: string;
  agent_id: string;
  expires_at: string;
  daysUntilExpiry: number;
  notificationType: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate scheduled/cron requests with secret token
  const functionToken = req.headers.get("x-function-token");
  const expectedToken = Deno.env.get("FUNCTION_SECRET_TOKEN");
  
  // Also allow authenticated admin requests
  const authHeader = req.headers.get("authorization");
  let isAdmin = false;
  
  if (authHeader?.startsWith("Bearer ")) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await authClient.auth.getClaims(token);
    
    if (claims?.claims?.sub) {
      // Check if user is admin
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claims.claims.sub)
        .eq("role", "admin")
        .maybeSingle();
      
      isAdmin = !!roleData;
    }
  }
  
  // Require either valid function token OR authenticated admin
  if ((!expectedToken || functionToken !== expectedToken) && !isAdmin) {
    console.error("Unauthorized access attempt to check-expiring-listings");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    const notifications: { listing: ExpiringListing; agentEmail: string; agentName: string }[] = [];

    // Check for listings expiring at 30, 7, and 1 day thresholds
    const thresholds = [
      { days: 30, type: "30_day" },
      { days: 7, type: "7_day" },
      { days: 1, type: "1_day" },
    ];

    for (const threshold of thresholds) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + threshold.days);
      
      // Window: listings expiring within this threshold but not before (within 1 day range)
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      console.log(`Checking for listings expiring around ${threshold.days} days from now (${startDate.toISOString()} to ${endDate.toISOString()})`);

      // Get published listings expiring within this window
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, title, project_name, agent_id, expires_at")
        .eq("status", "published")
        .gte("expires_at", startDate.toISOString())
        .lte("expires_at", endDate.toISOString());

      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        continue;
      }

      if (!listings || listings.length === 0) {
        console.log(`No listings expiring in ${threshold.days} days`);
        continue;
      }

      console.log(`Found ${listings.length} listings expiring in ${threshold.days} days`);

      // Check which ones haven't been notified yet
      for (const listing of listings) {
        const { data: existingNotification } = await supabase
          .from("expiration_notifications")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("notification_type", threshold.type)
          .maybeSingle();

        if (existingNotification) {
          console.log(`Already sent ${threshold.type} notification for listing ${listing.id}`);
          continue;
        }

        // Get agent details
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", listing.agent_id)
          .single();

        if (!profile?.email) {
          console.log(`No email found for agent ${listing.agent_id}`);
          continue;
        }

        notifications.push({
          listing: {
            ...listing,
            daysUntilExpiry: threshold.days,
            notificationType: threshold.type,
          },
          agentEmail: profile.email,
          agentName: profile.full_name || "Agent",
        });
      }
    }

    console.log(`Total notifications to send: ${notifications.length}`);

    // Send notifications
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notifications");
      // Still record that we would have sent notifications
      for (const notif of notifications) {
        await supabase.from("expiration_notifications").insert({
          listing_id: notif.listing.id,
          notification_type: notif.listing.notificationType,
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email not configured, notifications tracked",
          count: notifications.length 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    let sentCount = 0;
    
    for (const notif of notifications) {
      const { listing, agentEmail, agentName } = notif;
      
      const urgency = listing.daysUntilExpiry === 1 
        ? "⚠️ URGENT" 
        : listing.daysUntilExpiry === 7 
          ? "⏰ Reminder" 
          : "📅 Notice";
      
      const expiresAt = new Date(listing.expires_at);

      try {
        await resend.emails.send({
          from: "PresaleProperties <noreply@presaleproperties.com>",
          to: [agentEmail],
          subject: `${urgency}: Your listing "${listing.title}" expires in ${listing.daysUntilExpiry} day${listing.daysUntilExpiry === 1 ? "" : "s"}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
                ${urgency}: Listing Expiring Soon
              </h1>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${agentName},
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Your listing is expiring ${listing.daysUntilExpiry === 1 ? "tomorrow" : `in ${listing.daysUntilExpiry} days`}:
              </p>
              
              <div style="background: ${listing.daysUntilExpiry === 1 ? "#fef2f2" : "#f5f5f5"}; border-radius: 8px; padding: 16px; margin: 20px 0; ${listing.daysUntilExpiry === 1 ? "border: 1px solid #fecaca;" : ""}">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a; font-size: 18px;">${listing.title}</p>
                <p style="margin: 4px 0 0; color: #6a6a6a; font-size: 14px;">${listing.project_name}</p>
                <p style="margin: 8px 0 0; color: ${listing.daysUntilExpiry === 1 ? "#dc2626" : "#6a6a6a"}; font-size: 14px; font-weight: 500;">
                  Expires: ${expiresAt.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${listing.daysUntilExpiry === 1 
                  ? "This is your last chance to renew! Once expired, your listing will no longer be visible to potential buyers."
                  : "To keep your listing visible on the marketplace, please renew it before the expiration date."}
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Visit your dashboard to renew your listing and keep it active.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
              
              <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
                This email was sent from PresaleProperties. You can manage your listings in your dashboard.
              </p>
            </div>
          `,
        });

        // Record that notification was sent
        await supabase.from("expiration_notifications").insert({
          listing_id: listing.id,
          notification_type: listing.notificationType,
        });

        sentCount++;
        console.log(`Sent ${listing.notificationType} notification for listing ${listing.id} to ${agentEmail}`);
      } catch (emailError) {
        console.error(`Failed to send email for listing ${listing.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sentCount, totalChecked: notifications.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-listings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
