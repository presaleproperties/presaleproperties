import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const { name, email, phone, subject, message }: ContactEmailRequest = await req.json();

    console.log("Received contact form submission:", { name, email, subject });

    // Send notification email to the admin
    const adminEmailResponse = await resend.emails.send({
      from: "PresaleProperties <noreply@presaleproperties.com>",
      to: ["info@assignmenthub.ca"],
      subject: `New Contact Form: ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">New Contact Form Submission</h1>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
              </td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="tel:${phone}" style="color: #2563eb;">${phone}</a>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Subject:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${subject}</td>
            </tr>
          </table>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Message</h2>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            This email was sent from the AssignmentHub contact form.
          </p>
        </div>
      `,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: "PresaleProperties <noreply@presaleproperties.com>",
      to: [email],
      subject: "We received your message - PresaleProperties",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Thank you for contacting us, ${name}!</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            We have received your message and will get back to you as soon as possible.
          </p>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Your Message</h2>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px; color: #6a6a6a; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
            Best regards,<br />
            The AssignmentHub Team
          </p>
        </div>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
