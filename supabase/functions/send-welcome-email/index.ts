import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SENDER = "PresaleProperties <onboarding@resend.dev>";

interface WelcomeEmailRequest {
  lead_id: string;
  project_id: string;
  lead_name: string;
  lead_email: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("Email service not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const { lead_id, project_id, lead_name, lead_email }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${lead_email} for project ${project_id}`);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("presale_projects")
      .select("name, city, neighborhood, floorplan_files, brochure_files, price_range, featured_image")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      throw new Error("Project not found");
    }

    // Get active welcome template
    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, html_content")
      .eq("template_type", "welcome")
      .eq("is_active", true)
      .maybeSingle();

    // Use default template if none found
    const subject = (template?.subject || "Welcome! Here's Your {{project_name}} Information")
      .replace(/\{\{project_name\}\}/g, project.name);

    let htmlContent = (template?.html_content || `
      <h1>Thank you for your interest in {{project_name}}</h1>
      <p>Hi {{lead_name}},</p>
      <p>We're excited that you're interested in {{project_name}} located in {{project_city}}.</p>
      <p>A member of our team will reach out shortly to answer any questions.</p>
      <p>Best regards,<br>PresaleProperties.com</p>
    `)
      .replace(/\{\{project_name\}\}/g, project.name)
      .replace(/\{\{lead_name\}\}/g, lead_name)
      .replace(/\{\{project_city\}\}/g, `${project.neighborhood}, ${project.city}`);

    // Add project details section
    htmlContent += `
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <h2 style="color: #333;">Project Details</h2>
      <p><strong>Location:</strong> ${project.neighborhood}, ${project.city}</p>
      ${project.price_range ? `<p><strong>Starting From:</strong> ${project.price_range}</p>` : ''}
    `;

    // Add links to floorplans and brochures if available
    if (project.floorplan_files?.length > 0 || project.brochure_files?.length > 0) {
      htmlContent += `<h3 style="color: #333; margin-top: 20px;">Downloads</h3><ul>`;
      
      if (project.floorplan_files?.length > 0) {
        project.floorplan_files.forEach((url: string, index: number) => {
          htmlContent += `<li><a href="${url}" style="color: #d4af37;">Floor Plan ${index + 1}</a></li>`;
        });
      }
      
      if (project.brochure_files?.length > 0) {
        project.brochure_files.forEach((url: string, index: number) => {
          htmlContent += `<li><a href="${url}" style="color: #d4af37;">Brochure ${index + 1}</a></li>`;
        });
      }
      
      htmlContent += `</ul>`;
    }

    const senderEmail = await getSenderEmail(supabase);

    // Send email
    const emailResponse = await resend.emails.send({
      from: senderEmail,
      to: [lead_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      lead_id,
      email_to: lead_email,
      subject,
      template_type: "welcome",
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);

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
