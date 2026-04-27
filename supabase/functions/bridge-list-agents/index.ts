// bridge-list-agents — Presale's team roster for DealsFlow's agent picker
// and "Sending as…" badge. Returns active team_members joined with auth
// metadata (auth_user_id, license, brokerage) and a pre-rendered signature.

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: members, error } = await supabase
      .from("team_members")
      .select("id, full_name, title, email, phone, photo_url, bio, linkedin_url, instagram_url, specializations, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return bridgeJson({ error: error.message }, 500);

    // Hydrate auth_user_id + license/brokerage by joining email → auth.users → agent_profiles
    const emails = (members ?? []).map((m) => m.email).filter(Boolean) as string[];

    const userByEmail = new Map<string, string>(); // email → auth uid
    if (emails.length > 0) {
      // Page through auth users (service role)
      let page = 1;
      while (true) {
        const { data, error: e2 } = await (supabase.auth.admin as any).listUsers({ page, perPage: 1000 });
        if (e2) break;
        for (const u of data?.users ?? []) {
          if (u.email) userByEmail.set(u.email.toLowerCase(), u.id);
        }
        if (!data?.users || data.users.length < 1000) break;
        page++;
        if (page > 10) break;
      }
    }

    const userIds = Array.from(new Set(Array.from(userByEmail.values())));
    const profileByUserId = new Map<string, any>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("agent_profiles")
        .select("user_id, license_number, brokerage_name, brokerage_address, verification_status")
        .in("user_id", userIds);
      for (const p of profiles ?? []) profileByUserId.set(p.user_id, p);
    }

    const agents = (members ?? []).map((m) => {
      const emailLower = m.email?.toLowerCase() || "";
      const authUserId = emailLower ? userByEmail.get(emailLower) ?? null : null;
      const profile = authUserId ? profileByUserId.get(authUserId) : null;
      const websiteUrl = AGENT_WEBSITE_URLS[(m.full_name || "").split(" ")[0]] ?? null;
      const signature_html = renderAgentSignatureHtml({
        full_name: m.full_name,
        title: m.title,
        photo_url: m.photo_url,
        phone: m.phone,
        email: m.email,
        website_url: websiteUrl,
      });
      return {
        id: m.id,
        auth_user_id: authUserId,
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
      };
    });

    return bridgeJson({ agents });
  } catch (e) {
    console.error("[bridge-list-agents]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
