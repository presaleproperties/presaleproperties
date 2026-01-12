import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  lead_id: string;
  project_id: string;
  lead_name: string;
  lead_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Send email via Gmail SMTP
    const emailResult = await sendEmail({
      to: lead_email,
      subject,
      html: htmlContent,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    // Log the email
    await supabase.from("email_logs").insert({
      lead_id,
      email_to: lead_email,
      subject,
      template_type: "welcome",
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);
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