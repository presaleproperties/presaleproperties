import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  template_id: string;
  to_email: string;
}

// Sample variables for template preview
const SAMPLE_VARIABLES: Record<string, string> = {
  first_name: "John",
  last_name: "Smith",
  email: "john.smith@example.com",
  project_name: "The Mason",
  project_city: "Langley",
  preferred_city: "Surrey",
  property_type: "Condos",
  property_1_name: "The Heights",
  property_1_city: "Burnaby",
  property_1_price: "$649,900",
  property_1_image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
  property_1_url: "https://presaleproperties.com/burnaby-presale-condos-the-heights",
  property_2_name: "Park Central",
  property_2_city: "Surrey",
  property_2_price: "$529,900",
  property_2_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
  property_2_url: "https://presaleproperties.com/surrey-presale-condos-park-central",
  property_3_name: "Riverside Living",
  property_3_city: "Langley",
  property_3_price: "$599,900",
  property_3_image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
  property_3_url: "https://presaleproperties.com/langley-presale-condos-riverside",
  property_4_name: "Urban Oasis",
  property_4_city: "Richmond",
  property_4_price: "$699,900",
  property_4_image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
  property_4_url: "https://presaleproperties.com/richmond-presale-condos-urban-oasis",
  unsubscribe_url: "https://presaleproperties.com/unsubscribe?token=test",
};

function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { template_id, to_email }: TestEmailRequest = await req.json();

    console.log(`[send-test-email] Sending test for template ${template_id} to ${to_email}`);

    if (!template_id || !to_email) {
      return new Response(
        JSON.stringify({ error: "template_id and to_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", template_id)
      .maybeSingle();

    if (templateError || !template) {
      console.error("[send-test-email] Template not found:", templateError);
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Render subject and content with sample variables
    const subject = `[TEST] ${renderTemplate(template.subject, SAMPLE_VARIABLES)}`;
    const htmlContent = renderTemplate(template.html_content, SAMPLE_VARIABLES);

    // Send via Gmail SMTP
    const smtpUser = Deno.env.get("GMAIL_SMTP_USER");
    const smtpPassword = Deno.env.get("GMAIL_SMTP_PASSWORD");

    if (!smtpUser || !smtpPassword) {
      console.error("[send-test-email] SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: `Uzair Muhammad | Presale Properties <${smtpUser}>`,
      to: to_email,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: htmlContent,
    });

    await client.close();

    console.log(`[send-test-email] Test email sent successfully to ${to_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${to_email}`,
        template_name: template.name 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-test-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
