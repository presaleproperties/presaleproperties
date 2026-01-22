import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  code: string;
  userData?: {
    name: string;
    phone: string;
    buyerType: string;
    timeline: string;
    budget: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userData }: RequestBody = await req.json();
    
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying code for:", email);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the verification code
    const { data: codeRecord, error: lookupError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up code:", lookupError);
      throw new Error("Failed to verify code");
    }

    if (!codeRecord) {
      console.log("Invalid or expired code for:", email);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", codeRecord.id);

    // Create or get user account
    let userId: string | null = null;
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      userId = existingUser.id;
      console.log("Found existing user:", userId);
    } else {
      // Create new user with email confirmed
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          full_name: userData?.name,
          phone: userData?.phone,
        },
      });

      if (createError) {
        console.error("Failed to create user:", createError);
        throw new Error("Failed to create account");
      }

      userId = newUser.user?.id || null;
      console.log("Created new user:", userId);
    }

    // If we have user data, create/update buyer profile and lead
    if (userId && userData) {
      // Check if buyer profile exists
      const { data: existingProfile } = await supabase
        .from("buyer_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const budgetMap: Record<string, number> = {
        "under-500k": 500000,
        "500k-750k": 750000,
        "750k-1m": 1000000,
        "1m-1.5m": 1500000,
        "1.5m+": 2000000,
      };

      if (!existingProfile) {
        // Create buyer profile
        await supabase.from("buyer_profiles").insert({
          user_id: userId,
          email: email.toLowerCase(),
          full_name: userData.name,
          phone: userData.phone,
          phone_verified: false,
          buyer_type: userData.buyerType,
          is_vip: true,
          vip_joined_at: new Date().toISOString(),
          budget_max: budgetMap[userData.budget] || null,
          timeline: userData.timeline,
        });
        console.log("Created buyer profile for:", userId);
      } else {
        // Update to VIP status
        await supabase
          .from("buyer_profiles")
          .update({
            is_vip: true,
            vip_joined_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }

      // Create lead record
      const leadId = crypto.randomUUID();
      await supabase.from("project_leads").insert({
        id: leadId,
        name: userData.name,
        email: email.toLowerCase(),
        phone: userData.phone,
        lead_source: "vip_membership",
        budget: userData.budget,
        persona: userData.buyerType,
        timeline: userData.timeline,
        message: `VIP Membership (Email Verified) | Type: ${userData.buyerType} | Timeline: ${userData.timeline}`,
      });

      // Sync to Zapier/Lofty
      try {
        await supabase.functions.invoke("send-project-lead", { body: { leadId } });
      } catch (syncError) {
        console.error("Failed to sync lead:", syncError);
        // Don't fail the verification for this
      }

      // Send welcome email
      try {
        await supabase.functions.invoke("send-buyer-welcome", {
          body: {
            userId,
            email: email.toLowerCase(),
            fullName: userData.name,
            buyerType: userData.buyerType,
          },
        });
      } catch (welcomeError) {
        console.error("Failed to send welcome email:", welcomeError);
      }
    }

    console.log("Email verified successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully",
        userId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
