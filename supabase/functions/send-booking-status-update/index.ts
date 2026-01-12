import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  email: string;
  name: string;
  project_name: string;
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "cancelled";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: StatusUpdateRequest = await req.json();

    const isConfirmed = data.status === "confirmed";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin-bottom: 5px;">
            Booking ${isConfirmed ? "Confirmed" : "Cancelled"}
          </h1>
        </div>
        
        <p style="font-size: 16px;">Hi ${data.name},</p>
        
        ${isConfirmed ? `
          <p style="font-size: 16px;">
            Great news! Your appointment for <strong>${data.project_name}</strong> has been confirmed.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #166534;">Appointment Details</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Date:</td>
                <td style="padding: 8px 0; font-weight: 500;">${data.appointment_date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Time:</td>
                <td style="padding: 8px 0; font-weight: 500;">${data.appointment_time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Project:</td>
                <td style="padding: 8px 0; font-weight: 500;">${data.project_name}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #666;">
            We look forward to meeting you! If you need to reschedule, please contact us at (672) 258-1100.
          </p>
        ` : `
          <p style="font-size: 16px;">
            We're sorry to inform you that your appointment for <strong>${data.project_name}</strong> has been cancelled.
          </p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Original Appointment:</strong><br>
              ${data.appointment_date} at ${data.appointment_time}
            </p>
          </div>

          <p style="font-size: 14px; color: #666;">
            If you'd like to reschedule, please visit our website or contact us at (672) 258-1100.
          </p>
        `}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #999;">
            PresaleProperties.com<br>
            Your BC Presale Experts
          </p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: data.email,
      subject: isConfirmed 
        ? `Confirmed: ${data.project_name} - ${data.appointment_date}` 
        : `Cancelled: ${data.project_name} Appointment`,
      html,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log(`Booking ${data.status} email sent to ${data.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending status update email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);