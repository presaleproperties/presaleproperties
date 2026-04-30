import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateBody {
  action: "create" | "reset";
  team_member_id: string; // public.team_members.id
  email: string;
  full_name: string;
  phone?: string | null;
  password?: string; // optional, otherwise generated
}

function genPassword(): string {
  // 14 char temp password; mixed
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#$%^&*";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  out += symbols[Math.floor(Math.random() * symbols.length)];
  out += Math.floor(Math.random() * 10).toString();
  return out;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an admin via their JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body: CreateBody = await req.json();
    const { action, team_member_id, email, full_name, phone } = body;
    if (!email || !full_name || !team_member_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const tempPassword = body.password && body.password.length >= 8 ? body.password : genPassword();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (found) userId = found.id;

    if (action === "create") {
      if (!userId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name, must_change_password: true },
        });
        if (createErr) {
          return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        userId = created.user!.id;
      } else {
        // Update password and mark must_change
        await admin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          user_metadata: { ...(found?.user_metadata || {}), full_name, must_change_password: true },
        });
      }
    } else if (action === "reset") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "No auth user found for that email" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
      await admin.auth.admin.updateUserById(userId, {
        password: tempPassword,
        user_metadata: { ...(found?.user_metadata || {}), must_change_password: true },
      });
    }

    // Grant team_member role (idempotent)
    await admin.from("user_roles").upsert({ user_id: userId, role: "team_member" }, { onConflict: "user_id,role" });

    // Upsert approved team_member_profiles row, linked by user_id
    const { data: existingProfile } = await admin.from("team_member_profiles").select("id").eq("user_id", userId!).maybeSingle();
    if (existingProfile) {
      await admin.from("team_member_profiles").update({
        full_name, email: cleanEmail, phone: phone || null, status: "approved", reviewed_by: callerId, reviewed_at: new Date().toISOString(),
      }).eq("id", existingProfile.id);
    } else {
      await admin.from("team_member_profiles").insert({
        user_id: userId, full_name, email: cleanEmail, phone: phone || null, status: "approved", reviewed_by: callerId, reviewed_at: new Date().toISOString(),
      });
    }

    // Link auth user_id back onto public.team_members row
    await admin.from("team_members").update({ user_id: userId, email: cleanEmail }).eq("id", team_member_id);

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email: cleanEmail, temp_password: tempPassword }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    console.error("admin-create-team-login error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
