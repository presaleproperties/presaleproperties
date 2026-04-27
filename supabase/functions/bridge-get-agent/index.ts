// bridge-get-agent — single agent lookup by id, email, or auth_user_id.
// Used by DealsFlow on agent login to hydrate their full Presale profile.
//
// Query: ?id=<uuid>  OR  ?email=<addr>  OR  ?auth_user_id=<uuid>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";
import { renderAgentSignatureHtml } from "../_shared/bridge-email-renderer.ts";

const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const emailParam = (url.searchParams.get("email") || "").trim().toLowerCase();
    const authUserId = url.searchParams.get("auth_user_id");
    if (!id && !emailParam && !authUserId) {
      return bridgeJson({ error: "id, email, or auth_user_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve email if only auth_user_id is provided
    let email = emailParam;
    if (!email && authUserId) {
      const { data } = await (supabase.auth.admin as any).getUserById(authUserId);
      email = data?.user?.email?.toLowerCase() || "";
    }

    let q = supabase.from("team_members")
      .select("id, full_name, title, email, phone, photo_url, bio, linkedin_url, instagram_url, specializations, is_active")
      .eq("is_active", true).limit(1);
    if (id) q = q.eq("id", id);
    else if (email) q = q.ilike("email", email);

    const { data: m, error } = await q.maybeSingle();
    if (error) return bridgeJson({ error: error.message }, 500);
    if (!m) return bridgeJson({ error: "Agent not found" }, 404);

    // Resolve auth_user_id if not provided
    let resolvedAuthUserId = authUserId;
    if (!resolvedAuthUserId && m.email) {
      let page = 1;
      while (true) {
        const { data } = await (supabase.auth.admin as any).listUsers({ page, perPage: 1000 });
        const found = data?.users?.find((u: any) => u.email?.toLowerCase() === m.email!.toLowerCase());
        if (found) { resolvedAuthUserId = found.id; break; }
        if (!data?.users || data.users.length < 1000) break;
        page++;
        if (page > 10) break;
      }
    }

    let profile: any = null;
    if (resolvedAuthUserId) {
      const { data } = await supabase
        .from("agent_profiles")
        .select("license_number, brokerage_name, brokerage_address, verification_status")
        .eq("user_id", resolvedAuthUserId)
        .maybeSingle();
      profile = data;
    }

    const websiteUrl = AGENT_WEBSITE_URLS[(m.full_name || "").split(" ")[0]] ?? null;
    const signature_html = renderAgentSignatureHtml({
      full_name: m.full_name,
      title: m.title,
      photo_url: m.photo_url,
      phone: m.phone,
      email: m.email,
      website_url: websiteUrl,
    });

    return bridgeJson({
      agent: {
        id: m.id,
        auth_user_id: resolvedAuthUserId,
        full_name: m.full_name,
        title: m.title,
        email: m.email,
        phone: m.phone,
        photo_url: m.photo_url,
        bio: m.bio,
        linkedin_url: m.linkedin_url,
        instagram_url: m.instagram_url,
        website_url: websiteUrl,
        specializations: m.specializations ?? [],
        license_number: profile?.license_number ?? null,
        brokerage_name: profile?.brokerage_name ?? null,
        brokerage_address: profile?.brokerage_address ?? null,
        verification_status: profile?.verification_status ?? null,
        signature_html,
        is_active: m.is_active,
      },
    });
  } catch (e) {
    console.error("[bridge-get-agent]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
