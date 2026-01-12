import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SENDER = "PresaleProperties <noreply@presaleproperties.com>";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 requests per hour per IP

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Simple in-memory rate limiting (resets on function cold start)
// For production, consider using Redis or database-backed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW * 1000,
    });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

// Input validation
function validateInput(data: ContactEmailRequest): string | null {
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    return "Name is required and must be at least 2 characters";
  }
  if (data.name.length > 100) {
    return "Name must be less than 100 characters";
  }
  
  if (!data.email || typeof data.email !== "string") {
    return "Email is required";
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return "Invalid email format";
  }
  
  if (!data.subject || typeof data.subject !== "string" || data.subject.trim().length < 2) {
    return "Subject is required";
  }
  if (data.subject.length > 200) {
    return "Subject must be less than 200 characters";
  }
  
  if (!data.message || typeof data.message !== "string" || data.message.trim().length < 10) {
    return "Message is required and must be at least 10 characters";
  }
  if (data.message.length > 5000) {
    return "Message must be less than 5000 characters";
  }
  
  if (data.phone && (typeof data.phone !== "string" || data.phone.length > 20)) {
    return "Invalid phone number";
  }
  
  return null;
}

// Sanitize HTML to prevent XSS in emails
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getSenderEmail(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_sender")
    .maybeSingle();
  
  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }
  return DEFAULT_SENDER;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: ContactEmailRequest = await req.json();
    
    // Validate input
    const validationError = validateInput(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, phone, subject, message } = requestData;

    console.log("Received contact form submission:", { name, email: email.substring(0, 5) + "***", subject });

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const senderEmail = await getSenderEmail(supabase);

    // Sanitize all user inputs for email content
    const safeName = sanitizeHtml(name);
    const safeEmail = sanitizeHtml(email);
    const safePhone = phone ? sanitizeHtml(phone) : "";
    const safeSubject = sanitizeHtml(subject);
    const safeMessage = sanitizeHtml(message);

    // Send notification email to the admin
    const adminEmailResponse = await resend.emails.send({
      from: senderEmail,
      to: ["info@presaleproperties.com"],
      subject: `New Contact Form: ${safeSubject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">New Contact Form Submission</h1>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="mailto:${safeEmail}" style="color: #2563eb;">${safeEmail}</a>
              </td>
            </tr>
            ${safePhone ? `
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                <a href="tel:${safePhone}" style="color: #2563eb;">${safePhone}</a>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Subject:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${safeSubject}</td>
            </tr>
          </table>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Message</h2>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            This email was sent from the PresaleProperties.com contact form.
          </p>
        </div>
      `,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: senderEmail,
      to: [email],
      subject: "We received your message - PresaleProperties",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Thank you for contacting us, ${safeName}!</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            We have received your message and will get back to you as soon as possible.
          </p>
          
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 24px 0 12px;">Your Message</h2>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px; color: #6a6a6a; font-size: 14px;"><strong>Subject:</strong> ${safeSubject}</p>
            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
            Best regards,<br />
            The PresaleProperties Team
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
