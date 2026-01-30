import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting constants
const MAX_ATTEMPTS_PER_HOUR = 5;
const LOCKOUT_DURATION_MINUTES = 30;

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
    
    // Input validation
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate code format (6 digits only)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying code for:", email);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: Count recent failed attempts for this email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptError } = await supabase
      .from("email_verification_codes")
      .select("id, failed_attempts, locked_until")
      .eq("email", normalizedEmail)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if account is locked
    if (recentAttempts?.locked_until) {
      const lockExpiry = new Date(recentAttempts.locked_until);
      if (lockExpiry > new Date()) {
        const minutesRemaining = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
        console.log(`Email ${normalizedEmail} is locked for ${minutesRemaining} more minutes`);
        return new Response(
          JSON.stringify({ 
            error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.` 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Look up the verification code
    const { data: codeRecord, error: lookupError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", code)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up code:", lookupError);
      throw new Error("Failed to verify code");
    }

    if (!codeRecord) {
      console.log("Invalid or expired code for:", normalizedEmail);
      
      // Increment failed attempts counter
      const currentAttempts = (recentAttempts?.failed_attempts || 0) + 1;
      
      // If we have a recent code record, update it
      if (recentAttempts) {
        const updateData: any = { failed_attempts: currentAttempts };
        
        // Lock the account if too many attempts
        if (currentAttempts >= MAX_ATTEMPTS_PER_HOUR) {
          updateData.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
          console.log(`Locking email ${normalizedEmail} due to ${currentAttempts} failed attempts`);
        }
        
        await supabase
          .from("email_verification_codes")
          .update(updateData)
          .eq("id", recentAttempts.id);
      }
      
      const attemptsRemaining = MAX_ATTEMPTS_PER_HOUR - currentAttempts;
      return new Response(
        JSON.stringify({ 
          error: attemptsRemaining > 0 
            ? `Invalid or expired code. ${attemptsRemaining} attempts remaining.`
            : `Too many failed attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified_at: new Date().toISOString(), failed_attempts: 0, locked_until: null })
      .eq("id", codeRecord.id);

    // Create or get user account
    let userId: string | null = null;
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      userId = existingUser.id;
      console.log("Found existing user:", userId);
    } else {
      // Sanitize user data before creating account
      const sanitizedName = userData?.name?.slice(0, 100).replace(/[<>]/g, '') || '';
      const sanitizedPhone = userData?.phone?.slice(0, 20).replace(/[^0-9+\-() ]/g, '') || '';
      
      // Create new user with email confirmed
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          full_name: sanitizedName,
          phone: sanitizedPhone,
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
      // Sanitize all user inputs
      const sanitizedUserData = {
        name: userData.name?.slice(0, 100).replace(/[<>]/g, '') || '',
        phone: userData.phone?.slice(0, 20).replace(/[^0-9+\-() ]/g, '') || '',
        buyerType: ['first-time', 'investor', 'downsizer', 'upsizer', 'relocating'].includes(userData.buyerType) 
          ? userData.buyerType : 'first-time',
        timeline: ['immediately', '3-months', '6-months', '12-months', 'flexible'].includes(userData.timeline)
          ? userData.timeline : 'flexible',
        budget: ['under-500k', '500k-750k', '750k-1m', '1m-1.5m', '1.5m+'].includes(userData.budget)
          ? userData.budget : null,
      };

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
          email: normalizedEmail,
          full_name: sanitizedUserData.name,
          phone: sanitizedUserData.phone,
          phone_verified: false,
          buyer_type: sanitizedUserData.buyerType,
          is_vip: true,
          vip_joined_at: new Date().toISOString(),
          budget_max: sanitizedUserData.budget ? budgetMap[sanitizedUserData.budget] : null,
          timeline: sanitizedUserData.timeline,
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
        name: sanitizedUserData.name,
        email: normalizedEmail,
        phone: sanitizedUserData.phone,
        lead_source: "vip_membership",
        budget: sanitizedUserData.budget,
        persona: sanitizedUserData.buyerType,
        timeline: sanitizedUserData.timeline,
        message: `VIP Membership (Email Verified) | Type: ${sanitizedUserData.buyerType} | Timeline: ${sanitizedUserData.timeline}`,
      });

      // Sync to Zapier/Lofty
      try {
        await supabase.functions.invoke("send-project-lead", { body: { leadId } });
      } catch (syncError) {
        console.error("Failed to sync lead:", syncError);
      }

      // Send welcome email
      try {
        await supabase.functions.invoke("send-buyer-welcome", {
          body: {
            userId,
            email: normalizedEmail,
            fullName: sanitizedUserData.name,
            buyerType: sanitizedUserData.buyerType,
          },
        });
      } catch (welcomeError) {
        console.error("Failed to send welcome email:", welcomeError);
      }
    }

    console.log("Email verified successfully for:", normalizedEmail);

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
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);