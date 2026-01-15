import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  url: string;
}

interface SendPropertyEmailRequest {
  clientEmail: string;
  clientName: string;
  properties: Property[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { clientEmail, clientName, properties }: SendPropertyEmailRequest = await req.json();

    if (!clientEmail || !properties?.length) {
      return new Response(
        JSON.stringify({ error: "Missing email or properties" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatPrice = (price: number) => 
      new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

    // Generate property cards HTML
    const propertyCardsHtml = properties.map((prop) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 16px; background: white;">
        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="width: 100%; height: 180px; object-fit: cover;" />` : `<div style="width: 100%; height: 180px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px;">${prop.type === "presale" ? "Presale Project" : "Move-In Ready"}</div>`}
        <div style="padding: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${prop.type === "presale" ? "#dbeafe" : "#dcfce7"}; color: ${prop.type === "presale" ? "#1d4ed8" : "#166534"}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${prop.type === "presale" ? "Presale" : "Move-In Ready"}
            </span>
          </div>
          <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #111827;">${prop.name}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${prop.address}, ${prop.city}</p>
          <p style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827;">${formatPrice(prop.price)}</p>
          ${prop.beds || prop.baths || prop.sqft ? `
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              ${prop.beds ? `${prop.beds} Bed` : ""} ${prop.baths ? `• ${prop.baths} Bath` : ""} ${prop.sqft ? `• ${prop.sqft} sqft` : ""}
            </p>
          ` : ""}
          <a href="${prop.url}" style="display: inline-block; background: #c9a227; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
            View Details →
          </a>
        </div>
      </div>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Properties For You</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #111827;">
              🏠 Properties Selected For You
            </h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              Hi ${clientName}, I found ${properties.length} ${properties.length === 1 ? "property" : "properties"} you might like
            </p>
          </div>

          <!-- Property Cards -->
          ${propertyCardsHtml}

          <!-- CTA Section -->
          <div style="text-align: center; margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px;">
            <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: white;">
              Questions About These Properties?
            </h2>
            <p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 14px;">
              I'm here to help you find your perfect home
            </p>
            <a href="https://presaleproperties.ca/contact" style="display: inline-block; background: #c9a227; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Schedule a Call
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              Presale Properties | New Construction Specialists
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              Real Broker | 666 Burrard St, Suite 500, Vancouver, BC V6C 3P6
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `🏠 ${properties.length} ${properties.length === 1 ? "Property" : "Properties"} Selected For You`;
    
    const result = await sendEmail({
      to: clientEmail,
      subject,
      html: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

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
