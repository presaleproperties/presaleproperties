// Pings the seed-crm-templates edge function once per browser session.
// The edge function itself is idempotent (guarded by a system_flags row),
// so this is just an opportunistic trigger to ensure the first visitor
// after a deployment causes the CRM template seed to run.

import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "__crm_template_seed_pinged__";

export function bootstrapCrmTemplateSeed() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage may be blocked; still attempt once
  }

  // Defer so it never blocks initial paint
  const fire = () => {
    supabase.functions
      .invoke("seed-crm-templates", { body: {} })
      .catch((err) => {
        // Silent — this is best-effort and the cron/manual trigger covers retries
        console.debug("[seed-crm-templates] ping failed", err);
      });
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(fire, { timeout: 5000 });
  } else {
    setTimeout(fire, 3000);
  }
}
