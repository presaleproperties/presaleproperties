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
  url?: string;
}

interface SendPropertyEmailRequest {
  clientEmail: string;
  clientName: string;
  properties: Property[];
}

// Use the production domain
const WEBSITE_BASE_URL = "https://presaleproperties.com";

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

    // Build correct property URL based on type
    const getPropertyUrl = (prop: Property): string => {
      if (prop.type === "presale") {
        return `${WEBSITE_BASE_URL}/presale-projects/${prop.id}`;
      } else {
        return `${WEBSITE_BASE_URL}/resale/${prop.id}`;
      }
    };

    // Generate property cards HTML
    const propertyCardsHtml = properties.map((prop, index) => {
      const propertyUrl = getPropertyUrl(prop);
      const specs: string[] = [];
      if (prop.beds) specs.push(`${prop.beds} Bed`);
      if (prop.baths) specs.push(`${prop.baths} Bath`);
      if (prop.sqft) specs.push(`${prop.sqft.toLocaleString()} sqft`);
      const specsText = specs.join(" &bull; ");
      const typeLabel = prop.type === "presale" ? "PRESALE" : "MOVE-IN READY";
      const typeBgColor = prop.type === "presale" ? "#C9A227" : "#059669";
      
      return `
        <tr>
          <td style="padding: 0 0 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
              <tr>
                <td>
                  ${prop.image ? `
                  <a href="${propertyUrl}" style="display: block; text-decoration: none;">
                    <img src="${prop.image}" alt="${prop.name}" width="600" style="display: block; width: 100%; height: 280px; object-fit: cover;" />
                  </a>
                  ` : `
                  <div style="width: 100%; height: 280px; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); display: table;">
                    <div style="display: table-cell; vertical-align: middle; text-align: center;">
                      <span style="color: #C9A227; font-size: 18px; font-weight: 600;">${typeLabel}</span>
                    </div>
                  </div>
                  `}
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 28px 28px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <span style="display: inline-block; background: ${typeBgColor}; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 6px 14px; border-radius: 50px; text-transform: uppercase;">
                          ${typeLabel}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <a href="${propertyUrl}" style="text-decoration: none;">
                          <span style="font-size: 22px; font-weight: 700; color: #1E293B; line-height: 1.3;">${prop.name}</span>
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 8px;">
                        <span style="font-size: 14px; color: #64748B;">${prop.address}${prop.address && prop.city ? ", " : ""}${prop.city}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <span style="font-size: 28px; font-weight: 800; color: #C9A227;">${formatPrice(prop.price)}</span>
                      </td>
                    </tr>
                    ${specsText ? `
                    <tr>
                      <td style="padding-top: 8px;">
                        <span style="font-size: 14px; color: #64748B;">${specsText}</span>
                      </td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td style="padding-top: 24px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background: linear-gradient(135deg, #C9A227 0%, #A78B1F 100%); border-radius: 8px;">
                              <a href="${propertyUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                                View Details
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join("");

    const firstName = clientName.split(" ")[0];

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Properties Selected For You</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 48px 40px; border-radius: 20px 20px 0 0; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">PRESALE</span><span style="font-size: 28px; font-weight: 800; color: #C9A227; letter-spacing: -0.5px;">PROPERTIES</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px;">New Construction Specialists</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting Section -->
          <tr>
            <td style="background: #ffffff; padding: 48px 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 32px; font-weight: 700; color: #0F172A; line-height: 1.2;">Properties Selected Just For You</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <span style="font-size: 16px; color: #64748B; line-height: 1.6;">Hi ${firstName}, I've handpicked ${properties.length} ${properties.length === 1 ? "property" : "properties"} that match what you're looking for.</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 24px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 80px; height: 3px; background: linear-gradient(90deg, transparent, #C9A227, transparent);"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Property Cards -->
          <tr>
            <td style="background: #ffffff; padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${propertyCardsHtml}
              </table>
            </td>
          </tr>
          
          <!-- CTA Section -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 48px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 700; color: #ffffff;">Interested in any of these?</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-size: 15px; color: #94A3B8; line-height: 1.6;">Let's schedule a viewing or discuss your options.</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 28px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background: #C9A227; border-radius: 8px;">
                          <a href="${WEBSITE_BASE_URL}/contact" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                            Schedule a Call
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #ffffff; padding: 40px; border-radius: 0 0 20px 20px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 18px; font-weight: 700; color: #0F172A;">Uzair Muhammad</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 4px;">
                    <span style="font-size: 14px; color: #64748B;">New Construction Specialist</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <span style="font-size: 13px; color: #94A3B8;">Real Broker</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 4px;">
                    <span style="font-size: 12px; color: #94A3B8;">666 Burrard St, Suite 500, Vancouver, BC V6C 3P6</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="${WEBSITE_BASE_URL}" style="font-size: 14px; color: #C9A227; text-decoration: none; font-weight: 600;">presaleproperties.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Disclaimer -->
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
              <span style="font-size: 11px; color: #94A3B8; line-height: 1.5;">You received this email because you're a valued client. We specialize exclusively in new construction: presale projects and move-in ready homes.</span>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
