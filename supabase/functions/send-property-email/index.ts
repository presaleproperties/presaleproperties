import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Property {
  id: string;
  type: "resale" | "presale";
  name: string;
  address: string;
  city: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image: string | null;
  url?: string;
}

interface SendPropertyEmailRequest {
  clientEmail: string;
  clientName: string;
  clientId?: string;
  properties: Property[];
}

const WEBSITE_BASE_URL = "https://presaleproperties.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { clientEmail, clientName, clientId, properties }: SendPropertyEmailRequest = await req.json();

    if (!clientEmail || !properties?.length) {
      return new Response(
        JSON.stringify({ error: "Missing email or properties" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatPrice = (price: number) => 
      new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

    // Build tracked property URL
    const getPropertyUrl = (prop: Property): string => {
      const basePath = prop.type === "presale" 
        ? `${WEBSITE_BASE_URL}/presale-projects/${prop.id}`
        : `${WEBSITE_BASE_URL}/resale/${prop.id}`;
      
      // Add tracking params
      const params = new URLSearchParams({
        utm_source: "email",
        utm_medium: "property_alert",
        utm_campaign: "manual_send",
      });
      if (clientId) {
        params.append("cid", clientId);
      }
      return `${basePath}?${params.toString()}`;
    };

    const firstName = clientName.split(" ")[0];

    // Generate property cards with clear borders and spacing
    const propertyCards = properties.map((prop, index) => {
      const propertyUrl = getPropertyUrl(prop);
      const specs: string[] = [];
      if (prop.beds) specs.push(`${prop.beds} Bed`);
      if (prop.baths) specs.push(`${prop.baths} Bath`);
      if (prop.sqft) specs.push(`${prop.sqft.toLocaleString()} sqft`);
      const specsText = specs.join(" | ");
      const typeLabel = prop.type === "presale" ? "PRESALE" : "MOVE-IN READY";
      const typeBgColor = prop.type === "presale" ? "#C9A227" : "#059669";
      const location = [prop.address, prop.city].filter(Boolean).join(", ");

      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border:2px solid #E2E8F0;border-radius:16px;overflow:hidden;background:#FFFFFF;"><tr><td>${prop.image ? `<a href="${propertyUrl}"><img src="${prop.image}" alt="${prop.name}" width="600" height="260" style="display:block;width:100%;height:260px;object-fit:cover;border-bottom:2px solid #E2E8F0;"/></a>` : `<div style="height:260px;background:linear-gradient(135deg,#1E293B,#334155);display:flex;align-items:center;justify-content:center;border-bottom:2px solid #E2E8F0;"><span style="color:#C9A227;font-size:20px;font-weight:700;">${typeLabel}</span></div>`}</td></tr><tr><td style="padding:28px 32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom:16px;"><span style="display:inline-block;background:${typeBgColor};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:8px 16px;border-radius:6px;">${typeLabel}</span></td></tr><tr><td style="padding-bottom:10px;"><a href="${propertyUrl}" style="text-decoration:none;color:#0F172A;font-size:24px;font-weight:800;line-height:1.2;">${prop.name}</a></td></tr><tr><td style="padding-bottom:16px;"><span style="color:#64748B;font-size:15px;">${location}</span></td></tr><tr><td style="padding-bottom:12px;border-top:1px solid #E2E8F0;padding-top:16px;"><span style="font-size:32px;font-weight:800;color:#C9A227;">${formatPrice(prop.price)}</span></td></tr>${specsText ? `<tr><td style="padding-bottom:24px;"><span style="font-size:15px;color:#475569;font-weight:500;">${specsText}</span></td></tr>` : ""}<tr><td><a href="${propertyUrl}" style="display:inline-block;background:#0F172A;color:#FFFFFF;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">View Property Details</a></td></tr></table></td></tr></table>`;
    }).join("");

    const emailHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Properties Selected For You</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#F1F5F9;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;"><tr><td align="center" style="padding:40px 20px;"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;"><tr><td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:40px;border-radius:16px 16px 0 0;text-align:center;"><span style="font-size:26px;font-weight:800;color:#FFFFFF;">PRESALE</span><span style="font-size:26px;font-weight:800;color:#C9A227;">PROPERTIES</span><br/><span style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:2px;">New Construction Specialists</span></td></tr><tr><td style="background:#FFFFFF;padding:40px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:12px;"><span style="font-size:28px;font-weight:700;color:#0F172A;">Properties Selected For You</span></td></tr><tr><td align="center" style="padding-bottom:32px;"><span style="font-size:16px;color:#64748B;">Hi ${firstName}, I've handpicked ${properties.length} ${properties.length === 1 ? "property" : "properties"} based on your preferences.</span></td></tr><tr><td align="center" style="padding-bottom:32px;"><div style="width:60px;height:3px;background:#C9A227;"></div></td></tr></table>${propertyCards}</td></tr><tr><td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:40px;text-align:center;"><span style="font-size:20px;font-weight:700;color:#FFFFFF;">Questions about these properties?</span><br/><span style="font-size:14px;color:#94A3B8;display:inline-block;margin-top:8px;margin-bottom:24px;">I'm here to help you find your perfect home.</span><br/><a href="${WEBSITE_BASE_URL}/contact?utm_source=email&utm_medium=property_alert&utm_campaign=manual_send${clientId ? `&cid=${clientId}` : ""}" style="display:inline-block;background:#C9A227;color:#FFFFFF;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;">Schedule a Call</a></td></tr><tr><td style="background:#FFFFFF;padding:32px 40px;border-radius:0 0 16px 16px;text-align:center;border:1px solid #E2E8F0;border-top:none;"><span style="font-size:18px;font-weight:700;color:#0F172A;">Uzair Muhammad</span><br/><span style="font-size:14px;color:#64748B;">New Construction Specialist</span><br/><br/><span style="font-size:13px;color:#94A3B8;">Real Broker | 666 Burrard St, Suite 500, Vancouver, BC</span><br/><a href="${WEBSITE_BASE_URL}" style="font-size:14px;color:#C9A227;text-decoration:none;font-weight:600;">presaleproperties.com</a></td></tr><tr><td style="padding:24px;text-align:center;"><span style="font-size:11px;color:#94A3B8;">You received this because you're a valued client of Presale Properties.</span></td></tr></table></td></tr></table></body></html>`;

    const subject = `${properties.length} ${properties.length === 1 ? "Property" : "Properties"} Selected For You - Uzair Muhammad`;
    
    const result = await sendEmail({
      to: clientEmail,
      subject,
      html: emailHtml,
      fromName: "Uzair Muhammad | Presale Properties",
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    // Log activity for each property sent
    if (clientId) {
      const activityLogs = properties.map(prop => ({
        client_id: clientId,
        activity_type: "property_email_sent",
        project_name: prop.name,
        city: prop.city,
        price: prop.price,
        listing_key: prop.type === "resale" ? prop.id : null,
        project_id: prop.type === "presale" ? prop.id : null,
      }));
      
      await supabase.from("client_activity").insert(activityLogs);
    }

    // Log the email
    await supabase.from("email_logs").insert({
      email_to: clientEmail,
      subject,
      status: "sent",
      template_type: "property_send",
    });

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-property-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
