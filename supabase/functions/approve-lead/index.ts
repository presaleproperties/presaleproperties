/**
 * approve-lead
 * ─────────────────────────────────────────────────────────────
 * Admin-only endpoint that finalizes a project lead's approval state.
 *
 *   POST { leadId, action: "approve" | "reject", reason?: string }
 *
 *   - "approve" → marks the lead approved AND fires send-lead-autoresponse
 *                 (the auto-response edge function checks for this approval
 *                 flag before sending).
 *   - "reject"  → marks the lead rejected with optional reason. No email.
 *
 * Caller must have role = 'admin'.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  leadId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { leadId, action, reason } = parsed.data;

    const { data: lead, error: leadErr } = await admin
      .from("project_leads")
      .select("id, project_id, approval_status, email, name, phone, visitor_id, presale_projects(name)")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateErr } = await admin
      .from("project_leads")
      .update({
        approval_status: newStatus,
        approved_by: userData.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: action === "reject" ? (reason ?? null) : null,
      })
      .eq("id", leadId);
    if (updateErr) throw updateErr;

    let autoResponseFired = false;
    if (action === "approve") {
      try {
        // Fire the auto-response. Pass _approved flag so the (paused) function
        // recognizes this as a manually approved send and bypasses the kill switch.
        const res = await fetch(
          `${supabaseUrl}/functions/v1/send-lead-autoresponse`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              leadId,
              projectId: lead.project_id,
              _approvedByAdmin: true,
            }),
          },
        );
        autoResponseFired = res.ok;
        if (res.ok) {
          await admin
            .from("project_leads")
            .update({ auto_response_sent_at: new Date().toISOString() })
            .eq("id", leadId);
        }
      } catch (err) {
        console.error("[approve-lead] auto-response invoke failed:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        status: newStatus,
        autoResponseFired,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[approve-lead] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
