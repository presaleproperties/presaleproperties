import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectNotificationRequest {
  projectId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId }: ProjectNotificationRequest = await req.json();
    console.log("Processing social notification for project:", projectId);

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("presale_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Error fetching project:", projectError);
      throw new Error("Project not found");
    }

    console.log("Project fetched:", project.name);

    // Get webhook URL from app_settings
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_social_webhook")
      .single();

    const webhookUrl = webhookSetting?.value as string;

    if (!webhookUrl) {
      console.log("No social webhook configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No webhook configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format price for display
    const formatPrice = (price: number | null) => {
      if (!price) return "Contact for pricing";
      if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
      return `$${Math.round(price / 1000)}K`;
    };

    // Format completion date
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    const completionDate = project.completion_year 
      ? project.completion_month 
        ? `${months[project.completion_month - 1]} ${project.completion_year}`
        : `${project.completion_year}`
      : "TBA";

    // Status mapping
    const statusMap: Record<string, string> = {
      selling: "🟢 Selling Now",
      registering: "🔵 Now Registering",
      coming_soon: "🟡 Coming Soon",
      active: "🟢 Selling Now",
    };

    // Project type formatting
    const typeMap: Record<string, string> = {
      condo: "Condos",
      townhome: "Townhomes",
      townhouse: "Townhomes",
      mixed: "Mixed Development",
      duplex: "Duplexes",
      single_family: "Single Family Homes",
    };

    // Create Facebook Marketplace-ready description
    const marketplaceTitle = `${project.name} | ${typeMap[project.project_type] || project.project_type} in ${project.neighborhood}, ${project.city}`;
    
    const marketplaceDescription = `🏗️ NEW PRESALE: ${project.name}

📍 ${project.neighborhood}, ${project.city}
💰 Starting from ${formatPrice(project.starting_price)}
🏠 ${typeMap[project.project_type] || project.project_type}
📅 Est. Completion: ${completionDate}
${project.near_skytrain ? "🚇 Near SkyTrain\n" : ""}
${project.incentives_available ? "🎁 Incentives Available!\n" : ""}
${project.developer_name ? `🏢 Developer: ${project.developer_name}\n` : ""}

${project.short_description || ""}

${project.highlights && project.highlights.length > 0 
  ? "✨ HIGHLIGHTS:\n" + project.highlights.slice(0, 5).map((h: string) => `• ${h}`).join("\n") 
  : ""}

${project.amenities && project.amenities.length > 0 
  ? "\n🏊 AMENITIES:\n" + project.amenities.slice(0, 5).map((a: string) => `• ${a}`).join("\n") 
  : ""}

📲 View full details: presaleproperties.com/presale-projects/${project.slug}

#${project.city.replace(/\s+/g, "")}RealEstate #${project.city.replace(/\s+/g, "")}Condos #BCPresales #NewHomes #VancouverRealEstate`;

    // Payload for Zapier/Slack/Email
    const payload = {
      // Identifiers
      project_id: project.id,
      timestamp: new Date().toISOString(),
      notification_type: "new_project_published",
      
      // Ready-to-post content
      marketplace_title: marketplaceTitle,
      marketplace_description: marketplaceDescription,
      
      // Structured data for custom formatting
      project_name: project.name,
      project_slug: project.slug,
      project_url: `https://presaleproperties.com/presale-projects/${project.slug}`,
      city: project.city,
      neighborhood: project.neighborhood,
      address: project.address || "",
      
      // Pricing
      starting_price: project.starting_price,
      starting_price_formatted: formatPrice(project.starting_price),
      price_range: project.price_range || "",
      
      // Status & Type
      status: project.status,
      status_display: statusMap[project.status] || project.status,
      project_type: project.project_type,
      project_type_display: typeMap[project.project_type] || project.project_type,
      
      // Completion
      completion_year: project.completion_year,
      completion_month: project.completion_month,
      completion_display: completionDate,
      
      // Developer
      developer_name: project.developer_name || "",
      
      // Features
      near_skytrain: project.near_skytrain,
      incentives_available: project.incentives_available,
      deposit_percent: project.deposit_percent,
      
      // Content
      short_description: project.short_description || "",
      highlights: project.highlights || [],
      amenities: project.amenities || [],
      
      // Images (for attachments)
      featured_image: project.featured_image || "",
      gallery_images: project.gallery_images?.slice(0, 5) || [],
      
      // Hashtags
      suggested_hashtags: `#${project.city.replace(/\s+/g, "")}RealEstate #${project.city.replace(/\s+/g, "")}Condos #BCPresales #NewHomes #VancouverRealEstate #${project.neighborhood.replace(/\s+/g, "")}`,
    };

    console.log("Sending social notification to webhook");

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Webhook response status:", response.status);

      if (!response.ok) {
        console.error("Webhook failed:", await response.text());
      }
    } catch (webhookError) {
      console.error("Error sending to webhook:", webhookError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId: project.id,
        message: "Social notification sent successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing social notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
