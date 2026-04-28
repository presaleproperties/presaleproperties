// bridge-list-tasks — DealsFlow can fetch admin tasks (TODO list visible
// to the website ops team) and DealsFlow can create tasks via the same
// endpoint with POST.
//
// GET query params:
//   status=<todo|in_progress|done>
//   priority=<low|medium|high|urgent>
//   category=<string>
//   limit=<n>  (default 100, max 500)
//
// POST body (creates a task):
//   { title, description?, category?, priority?, due_date?, notes? }
//
// Auth: x-bridge-secret header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (!body?.title || typeof body.title !== "string") {
        return bridgeJson({ error: "title is required" }, 400);
      }
      const insertPayload: Record<string, unknown> = {
        title: String(body.title).slice(0, 300),
        description: body.description ? String(body.description).slice(0, 4000) : null,
        category: body.category ? String(body.category).slice(0, 60) : "crm",
        priority: ["low", "medium", "high", "urgent"].includes(body.priority)
          ? body.priority : "medium",
        status: "todo",
        due_date: body.due_date || null,
        notes: body.notes ? String(body.notes).slice(0, 4000) : null,
      };
      const { data, error } = await supabase
        .from("admin_tasks")
        .insert(insertPayload)
        .select()
        .single();
      if (error) return bridgeJson({ error: error.message }, 500);
      return bridgeJson({ task: data }, 201);
    }

    // GET — list
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const category = url.searchParams.get("category");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10), 1), 500);

    let q = supabase
      .from("admin_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    if (priority) q = q.eq("priority", priority);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) return bridgeJson({ error: error.message }, 500);

    return bridgeJson({ tasks: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error("[bridge-list-tasks]", err);
    return bridgeJson({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
