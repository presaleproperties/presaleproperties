/**
 * Send Blog Draft Notification
 * Notifies admin when new blog drafts are generated from market data uploads
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlogDraft {
  city: string;
  title: string;
  slug: string;
}

interface NotificationRequest {
  drafts: BlogDraft[];
  reportMonth: number;
  reportYear: number;
  board: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drafts, reportMonth, reportYear, board }: NotificationRequest = await req.json();

    if (!drafts || drafts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No drafts to notify about" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const monthName = new Date(reportYear, reportMonth - 1).toLocaleString('en', { month: 'long' });
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "info@presaleproperties.com";

    // Build the email content
    const draftList = drafts.map(draft => 
      `<li style="margin-bottom: 8px;">
        <strong>${draft.title}</strong><br/>
        <span style="color: #666; font-size: 14px;">${draft.city}</span>
      </li>`
    ).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
      <h1 style="color: #f5c542; margin: 0; font-size: 24px; font-weight: 700;">
        📝 New Blog Drafts Ready
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0; font-size: 16px;">
        ${monthName} ${reportYear} Market Updates
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Great news! <strong>${drafts.length} market update blog posts</strong> have been auto-generated from the ${board} ${monthName} ${reportYear} stats upload.
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        These drafts are ready for your review before publishing:
      </p>

      <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
        ${draftList}
      </ul>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://presaleproperties.com/admin/blogs" 
           style="display: inline-block; background: linear-gradient(135deg, #f5c542 0%, #e6b730 100%); color: #1a1a2e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245,197,66,0.3);">
          Review & Publish Drafts →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        Presale Properties Admin Notification
      </p>
      <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">
        You're receiving this because you uploaded new market data.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject: `📝 ${drafts.length} Blog Drafts Ready: ${monthName} ${reportYear} Market Updates`,
      html: emailHtml,
    });

    if (!result.success) {
      console.error("Failed to send notification:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sent blog draft notification for ${drafts.length} drafts to ${adminEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: `Notification sent to ${adminEmail}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
