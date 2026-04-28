/**
 * Prerender Script — Per-Route OG Meta Injection
 *
 * Generates static HTML files at build time so social crawlers
 * (iMessage, WhatsApp, FB, Twitter, LinkedIn, Slack) get the correct
 * og:title / og:description / og:image / canonical for every shareable
 * URL — without needing Cloudflare or any runtime proxy.
 *
 * How it works:
 *   1. After `vite build` produces dist/index.html (the SPA shell)
 *   2. We fetch all publishable resources from Supabase
 *   3. For each route, we clone dist/index.html, rewrite the <head>
 *      meta tags to be page-specific, and write dist/<route>/index.html
 *   4. Lovable's static hosting serves the per-route file to everyone.
 *      Real users hydrate React on top; crawlers read the baked tags.
 *
 * Run after build:  node scripts/prerender.js
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const SITE = "https://presaleproperties.com";
const DEFAULT_OG = `${SITE}/og-image.png`;

// ─── Load .env (Vite-style) into process.env so the script works in any CI ─
async function loadDotenv() {
  try {
    const raw = await fs.readFile(path.resolve(__dirname, "..", ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] == null) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env optional
  }
}
await loadDotenv();

// ─── Supabase client (anon, read-only public data) ─────────────────────────
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://thvlisplwqhtjpzpedhq.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.warn(
    "[prerender] No Supabase anon key in env — skipping dynamic routes. " +
      "Set VITE_SUPABASE_PUBLISHABLE_KEY to enable per-project/listing/blog OG tags.",
  );
}

const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

// ─── Helpers ───────────────────────────────────────────────────────────────
const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clamp = (s, max) => {
  if (!s) return "";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
};

const stripHtml = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const projectTypeSlug = (t) =>
  ({ condo: "condos", townhome: "townhomes", mixed: "homes", duplex: "duplexes", single_family: "homes" })[t] || "homes";

const absoluteImage = (url) => {
  if (!url) return DEFAULT_OG;
  const t = String(url).trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("/")) return `${SITE}${t}`;
  return t;
};

/**
 * Replace (or insert) the per-page OG/Twitter/title/description/canonical tags
 * inside the <head> of the SPA shell HTML.
 */
function injectMeta(html, meta) {
  const { title, description, image, url, type = "website" } = meta;
  const t = escape(clamp(title, 60));
  const d = escape(clamp(description, 160));
  const img = escape(absoluteImage(image));
  const u = escape(url);

  // Strip existing instances of any tag we're about to set
  const stripPatterns = [
    /<title>[\s\S]*?<\/title>/gi,
    /<meta[^>]+name=["']description["'][^>]*>/gi,
    /<link[^>]+rel=["']canonical["'][^>]*>/gi,
    /<meta[^>]+property=["']og:(title|description|image|url|type|site_name|locale|image:width|image:height)["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:(card|title|description|image|url)["'][^>]*>/gi,
  ];
  let cleaned = html;
  for (const p of stripPatterns) cleaned = cleaned.replace(p, "");

  const tags = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="PresaleProperties.com" />
    <meta property="og:locale" content="en_CA" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="twitter:url" content="${u}" />
  `;

  return cleaned.replace(/<\/head>/i, `${tags}\n  </head>`);
}

async function writeRoute(routePath, html) {
  // routePath like "/presale-projects/foo" → dist/presale-projects/foo/index.html
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  const targetDir = clean ? path.join(DIST_DIR, clean) : DIST_DIR;
  if (clean) await fs.mkdir(targetDir, { recursive: true });
  const target = path.join(targetDir, "index.html");
  // For the homepage we already have dist/index.html — overwrite with injected version
  await fs.writeFile(target, html, "utf8");
}

// ─── Resource fetchers ─────────────────────────────────────────────────────
async function fetchProjects() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("presale_projects")
    .select(
      "slug,name,city,neighborhood,project_type,short_description,seo_title,seo_description,featured_image,og_image,updated_at",
    )
    .eq("is_published", true);
  if (error) {
    console.error("[prerender] presale_projects:", error.message);
    return [];
  }
  return data || [];
}

async function fetchAssignments() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("id,title,project_name,city,neighborhood,description,featured_image,photos,updated_at")
    .eq("listing_type", "assignment")
    .in("status", ["published", "active"]);
  if (error) {
    console.error("[prerender] listings(assignments):", error.message);
    return [];
  }
  return data || [];
}

async function fetchBlogPosts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,seo_title,seo_description,featured_image,publish_date,updated_at")
    .eq("is_published", true);
  if (error) {
    console.error("[prerender] blog_posts:", error.message);
    return [];
  }
  return data || [];
}

async function fetchDevelopers() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("developer_profiles")
    .select("slug,name,tagline,description,logo_url,hero_image_url");
  if (error) {
    // Not fatal — table columns may differ
    return [];
  }
  return data || [];
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  let shell;
  try {
    shell = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf8");
  } catch (err) {
    console.error(`[prerender] Cannot read ${DIST_DIR}/index.html — did vite build run? ${err.message}`);
    process.exit(0); // Don't fail the build
  }

  const stats = { projects: 0, assignments: 0, blog: 0, developers: 0, static: 0, errors: 0 };

  // 1. Static routes — re-emit shell (homepage + key pages keep their default tags)
  // Homepage gets re-written with cleaned defaults so the structure is consistent.
  const homepageMeta = {
    title: "Presale Condos BC | VIP Pricing & Floor Plans | PresaleProperties.com",
    description:
      "Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access in Surrey, Langley, Burnaby, Coquitlam & Vancouver.",
    image: DEFAULT_OG,
    url: `${SITE}/`,
  };
  await writeRoute("/", injectMeta(shell, homepageMeta));
  stats.static++;

  // 2. Presale projects — both legacy and SEO-friendly URL
  const projects = await fetchProjects();
  for (const p of projects) {
    if (!p.slug) continue;
    const title = p.seo_title || `${p.name} — ${p.city || "BC"} Presale`;
    const description =
      p.seo_description ||
      stripHtml(p.short_description) ||
      `${p.name} in ${p.neighborhood || p.city || "BC"}. View pricing, floor plans, and incentives.`;
    const image = p.og_image || p.featured_image;

    // Legacy: /presale-projects/:slug
    const legacyUrl = `${SITE}/presale-projects/${p.slug}`;
    try {
      await writeRoute(`/presale-projects/${p.slug}`, injectMeta(shell, { title, description, image, url: legacyUrl }));
      stats.projects++;
    } catch (e) {
      stats.errors++;
      console.error(`[prerender] project ${p.slug}:`, e.message);
    }

    // SEO-friendly: /{neighborhood}-presale-{type}-{slug}
    if (p.neighborhood && p.project_type) {
      const seoPath = `/${slugify(p.neighborhood)}-presale-${projectTypeSlug(p.project_type)}-${p.slug}`;
      const seoUrl = `${SITE}${seoPath}`;
      try {
        await writeRoute(seoPath, injectMeta(shell, { title, description, image, url: seoUrl }));
        stats.projects++;
      } catch (e) {
        stats.errors++;
      }
    }
  }

  // 3. Assignments — /assignments/:id
  const assignments = await fetchAssignments();
  for (const a of assignments) {
    if (!a.id) continue;
    const title =
      a.title || `${a.project_name || "Assignment"} in ${a.city || "BC"} | Assignment Sale`;
    const description =
      stripHtml(a.description) ||
      `Assignment opportunity at ${a.project_name || "this project"} in ${a.neighborhood || a.city || "BC"}.`;
    const photos = Array.isArray(a.photos) ? a.photos : [];
    const image = a.featured_image || photos[0];
    const url = `${SITE}/assignments/${a.id}`;
    try {
      await writeRoute(`/assignments/${a.id}`, injectMeta(shell, { title, description, image, url }));
      stats.assignments++;
    } catch (e) {
      stats.errors++;
    }
  }

  // 4. Blog posts — /blog/:slug
  const posts = await fetchBlogPosts();
  for (const post of posts) {
    if (!post.slug) continue;
    const title = post.seo_title || post.title;
    const description = post.seo_description || stripHtml(post.excerpt);
    const image = post.featured_image;
    const url = `${SITE}/blog/${post.slug}`;
    try {
      await writeRoute(`/blog/${post.slug}`, injectMeta(shell, { title, description, image, url, type: "article" }));
      stats.blog++;
    } catch (e) {
      stats.errors++;
    }
  }

  // 5. Developers — /developers/:slug
  const developers = await fetchDevelopers();
  for (const d of developers) {
    if (!d.slug) continue;
    const title = `${d.name} — Developer Profile | PresaleProperties.com`;
    const description =
      stripHtml(d.tagline) ||
      stripHtml(d.description) ||
      `Explore presale projects from ${d.name} in Metro Vancouver.`;
    const image = d.hero_image_url || d.logo_url;
    const url = `${SITE}/developers/${d.slug}`;
    try {
      await writeRoute(`/developers/${d.slug}`, injectMeta(shell, { title, description, image, url }));
      stats.developers++;
    } catch (e) {
      stats.errors++;
    }
  }

  console.log(`
[prerender] Done.
  Static pages:   ${stats.static}
  Projects:       ${stats.projects}  (legacy + SEO URLs)
  Assignments:    ${stats.assignments}
  Blog posts:     ${stats.blog}
  Developers:     ${stats.developers}
  Errors:         ${stats.errors}
`);
}

main().catch((err) => {
  console.error("[prerender] Fatal:", err);
  // Do not fail the build — SPA still works without per-route OG
  process.exit(0);
});
