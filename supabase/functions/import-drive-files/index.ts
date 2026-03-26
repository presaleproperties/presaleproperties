import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  fileIds: string[];
  fileType: "pdf";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileIds, fileType } = (await req.json()) as Body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "fileIds is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (fileType !== "pdf") {
      return new Response(JSON.stringify({ success: false, error: "Only pdf is supported" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ success: false, error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const uploaded: { id: string; url: string }[] = [];

    for (const id of fileIds.slice(0, 10)) {
      try {
        const driveUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
        console.log("Downloading Drive PDF:", id);

        const resp = await fetch(driveUrl, {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });

        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          console.warn("Drive download failed", id, resp.status, t.slice(0, 120));
          continue;
        }

        const contentType = resp.headers.get("content-type") || "application/pdf";
        if (!contentType.toLowerCase().includes("pdf")) {
          console.warn("Not a PDF, skipping", id, contentType);
          continue;
        }

        const arrayBuffer = await resp.arrayBuffer();
        const filePath = `drive-import/${Date.now()}-${id}.pdf`;

        const { error: uploadErr } = await supabase.storage
          .from("listing-files")
          .upload(filePath, new Uint8Array(arrayBuffer), {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Upload failed", id, uploadErr);
          continue;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/listing-files/${filePath}`;
        uploaded.push({ id, url: publicUrl });
      } catch (e) {
        console.error("import-drive-files error for id", id, e);
      }
    }

    return new Response(JSON.stringify({ success: true, files: uploaded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-drive-files fatal:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
