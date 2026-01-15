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

const WEBSITE_BASE_URL = "https://presaleproperties.ca";

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
        // For presale, use the slug-based URL
        return `${WEBSITE_BASE_URL}/presale-projects/${prop.id}`;
      } else {
        // For resale/move-in ready, use listing key
        return `${WEBSITE_BASE_URL}/resale/${prop.id}`;
      }
    };

    // Generate property cards HTML with proper styling
    const propertyCardsHtml = properties.map((prop) => {
      const propertyUrl = getPropertyUrl(prop);
      const specs: string[] = [];
      if (prop.beds) specs.push(`${prop.beds} Bed`);
      if (prop.baths) specs.push(`${prop.baths} Bath`);
      if (prop.sqft) specs.push(`${prop.sqft.toLocaleString()} sqft`);
      
      return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <!-- Property Image -->
            ${prop.image ? `
            <a href="${propertyUrl}" style="text-decoration: none;">
              <img src="${prop.image}" alt="${prop.name}" width="100%" height="200" style="display: block; width: 100%; height: 200px; object-fit: cover; border-radius: 16px 16px 0 0;" />
            </a>
            ` : `
            <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #1a2234 0%, #2d3a4f 100%); border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center;">
              <span style="color: #c9a227; font-size: 16px; font-weight: 600;">${prop.type === "presale" ? "Presale Project" : "Move-In Ready Home"}</span>
            </div>
            `}
            
            <!-- Property Details -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 20px;">
                  <!-- Type Badge -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background: ${prop.type === "presale" ? "#c9a227" : "#10b981"}; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${prop.type === "presale" ? "Presale" : "Move-In Ready"}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Property Name -->
                  <h3 style="margin: 12px 0 6px 0; font-size: 20px; font-weight: 700; color: #1a2234; line-height: 1.3;">
                    <a href="${propertyUrl}" style="color: #1a2234; text-decoration: none;">${prop.name}</a>
                  </h3>
                  
                  <!-- Location -->
                  <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                    📍 ${prop.address}${prop.address && prop.city ? ', ' : ''}${prop.city}
                  </p>
                  
                  <!-- Price -->
                  <p style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #c9a227;">
                    ${formatPrice(prop.price)}
                  </p>
                  
                  <!-- Specs -->
                  ${specs.length > 0 ? `
                  <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                    ${specs.join(' • ')}
                  </p>
                  ` : '<div style="margin-bottom: 20px;"></div>'}
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #c9a227 0%, #b8912a 100%); border-radius: 8px;">
                        <a href="${propertyUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                          View Property Details →
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
    `;
    }).join("");

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Properties Selected For You</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; -webkit-font-smoothing: antialiased;">
  
  <!-- Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          
          <!-- Header with Gold Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a2234 0%, #2d3a4f 100%); padding: 40px 32px; border-radius: 20px 20px 0 0; text-align: center;">
              <!-- Logo Text -->
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                PRESALE<span style="color: #c9a227;">PROPERTIES</span>
              </h1>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                New Construction Specialists
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: #ffffff; padding: 40px 32px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1a2234; text-align: center;">
                Properties Selected For You
              </h2>
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #6b7280; text-align: center; line-height: 1.6;">
                Hi ${clientName}, I've handpicked ${properties.length} ${properties.length === 1 ? "property" : "properties"} that match what you're looking for.
              </p>
              
              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 0 32px 0;">
                    <div style="height: 2px; background: linear-gradient(90deg, transparent, #c9a227, transparent);"></div>
                  </td>
                </tr>
              </table>
              
              <!-- Property Cards -->
              ${propertyCardsHtml}
              
            </td>
          </tr>
          
          <!-- CTA Section -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a2234 0%, #2d3a4f 100%); padding: 40px 32px; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                Have Questions About These Properties?
              </h3>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                I'm here to help you find your perfect home. Let's connect!
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="background: #c9a227; border-radius: 8px; margin-right: 12px;">
                    <a href="${WEBSITE_BASE_URL}/contact" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      📞 Schedule a Call
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #ffffff; padding: 32px; border-radius: 0 0 20px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              
              <!-- Agent Info -->
              <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #1a2234;">
                Uzair Muhammad
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
                New Construction Specialist
              </p>
              
              <!-- Brokerage -->
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Real Broker
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af;">
                666 Burrard St, Suite 500, Vancouver, BC V6C 3P6
              </p>
              
              <!-- Website Link -->
              <p style="margin: 0;">
                <a href="${WEBSITE_BASE_URL}" style="color: #c9a227; font-size: 13px; text-decoration: none; font-weight: 600;">
                  presaleproperties.ca
                </a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Unsubscribe -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                You received this email because you're a valued client of Presale Properties.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `;

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