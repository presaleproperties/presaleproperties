import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://presaleproperties.com";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * IMAGE SITEMAP — v2
 * 
 * Only includes images for PERMANENT content:
 * ✅ Presale project featured images and galleries
 * ✅ Blog post featured images
 * ❌ NO MLS listing photos (volatile, causes soft 404s)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const slugify = (text: string) => text.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const getTypeSlug = (type: string) => {
      const map: Record<string, string> = { condo: 'condos', townhome: 'townhomes', mixed: 'homes' };
      return map[type] || 'homes';
    };

    // Fetch presale projects with images
    const { data: presaleProjects, error: presaleError } = await supabase
      .from("presale_projects")
      .select("slug, name, neighborhood, city, project_type, featured_image, gallery_images, updated_at")
      .eq("is_published", true);

    if (presaleError) throw presaleError;

    // Fetch blog posts with featured images
    const { data: blogPosts, error: blogError } = await supabase
      .from("blog_posts")
      .select("slug, title, featured_image, updated_at")
      .eq("is_published", true)
      .not("featured_image", "is", null);

    if (blogError) throw blogError;

    // Generate image entries for presale projects
    const presaleImageEntries = (presaleProjects || []).map(project => {
      const neighborhoodSlug = slugify(project.neighborhood || project.city);
      const typeSlug = getTypeSlug(project.project_type);
      const pageUrl = `${SITE_URL}/${neighborhoodSlug}-presale-${typeSlug}-${project.slug}`;

      const allImages: string[] = [];
      if (project.featured_image) allImages.push(project.featured_image);
      if (project.gallery_images && Array.isArray(project.gallery_images)) {
        allImages.push(...project.gallery_images.slice(0, 9));
      }

      if (allImages.length === 0) return '';

      return `
  <url>
    <loc>${pageUrl}</loc>
    ${allImages.map((url, index) => `
    <image:image>
      <image:loc>${escapeXml(url)}</image:loc>
      <image:title>${escapeXml(`${project.name} - ${index === 0 ? 'Featured Image' : `Gallery ${index}`}`)}</image:title>
      <image:caption>${escapeXml(`${project.name} presale ${project.project_type} in ${project.neighborhood || ''}, ${project.city}`)}</image:caption>
      <image:geo_location>${escapeXml(`${project.city}, BC, Canada`)}</image:geo_location>
    </image:image>`).join('')}
  </url>`;
    }).filter(Boolean);

    // Generate image entries for blog posts
    const blogImageEntries = (blogPosts || []).map(post => {
      if (!post.featured_image) return '';
      return `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <image:image>
      <image:loc>${escapeXml(post.featured_image)}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>
  </url>`;
    }).filter(Boolean);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${presaleImageEntries.join('')}
${blogImageEntries.join('')}
</urlset>`;

    console.log(`Image sitemap generated: ${presaleImageEntries.length} presale + ${blogImageEntries.length} blog entries (0 MLS — removed)`);

    await supabase
      .from("app_settings")
      .upsert({
        key: "image_sitemap_last_generated",
        value: {
          timestamp: new Date().toISOString(),
          presale_count: presaleImageEntries.length,
          blog_count: blogImageEntries.length,
          mls_count: 0,
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    return new Response(sitemap, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error("Image sitemap generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error generating image sitemap: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
