import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  appointment_type: "preview" | "showing";
  appointment_date: string;
  formattedDate: string;
  formattedTime: string;
  project_name: string;
  project_url: string;
  project_city?: string;
  project_neighborhood?: string;
  name: string;
  email: string;
  phone: string;
  buyer_type: string;
  timeline: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();

    const appointmentTypeLabel = data.appointment_type === "preview" 
      ? "Preview Presentation" 
      : "On-site Showing";

    const buyerTypeLabels: Record<string, string> = {
      first_time: "First-time Buyer",
      investor: "Investor",
      upgrader: "Upgrading",
      other: "Other",
    };

    const timelineLabels: Record<string, string> = {
      "0_3_months": "0-3 months",
      "3_6_months": "3-6 months",
      "6_12_months": "6-12 months",
      "12_plus_months": "12+ months",
    };

    // Send confirmation to user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin-bottom: 5px;">Booking Request Received</h1>
          <p style="color: #666; font-size: 14px;">We'll confirm your appointment shortly</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin-top: 0; font-size: 18px; color: #1a1a1a;">${data.project_name}</h2>
          <p style="margin: 0; color: #666; font-size: 14px;">
            ${data.project_neighborhood ? `${data.project_neighborhood}, ` : ''}${data.project_city || ''}
          </p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; font-size: 16px; color: #1a1a1a; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
            Appointment Details
          </h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Type:</td>
              <td style="padding: 8px 0; font-weight: 500;">${appointmentTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Time:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.formattedTime}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Status: Pending Confirmation</strong><br>
            We'll send you another email once your appointment is confirmed.
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          If you have any questions, reply to this email or call us at (672) 258-1100.
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #999;">
            PresaleProperties.com<br>
            Your BC Presale Experts
          </p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "PresaleProperties <noreply@presaleproperties.com>",
      to: [data.email],
      subject: `Booking Request: ${data.project_name} - ${data.formattedDate}`,
      html: userEmailHtml,
    });

    // Send notification to admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">New Booking Request</h1>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <h2 style="margin-top: 0; font-size: 18px; color: #1a1a1a;">${data.project_name}</h2>
          
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px;">Type:</td>
              <td style="padding: 8px 0; font-weight: 500;">${appointmentTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Time:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.formattedTime}</td>
            </tr>
          </table>

          <h3 style="font-size: 16px; color: #1a1a1a; border-top: 1px solid #e5e7eb; padding-top: 16px;">Contact Information</h3>
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px;">Name:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone:</td>
              <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #3b82f6;">${data.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Buyer Type:</td>
              <td style="padding: 8px 0;">${buyerTypeLabels[data.buyer_type] || data.buyer_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Timeline:</td>
              <td style="padding: 8px 0;">${timelineLabels[data.timeline] || data.timeline}</td>
            </tr>
          </table>

          ${data.notes ? `
            <h3 style="font-size: 16px; color: #1a1a1a; border-top: 1px solid #e5e7eb; padding-top: 16px;">Notes</h3>
            <p style="font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 8px;">${data.notes}</p>
          ` : ''}

          <div style="margin-top: 24px; text-align: center;">
            <a href="${data.project_url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Project</a>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "PresaleProperties <noreply@presaleproperties.com>",
      to: ["leads@presaleproperties.com"],
      subject: `[New Booking] ${data.project_name} - ${appointmentTypeLabel} - ${data.formattedDate}`,
      html: adminEmailHtml,
      reply_to: data.email,
    });

    console.log("Booking notification emails sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking notification:", error);
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
