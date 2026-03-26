import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://presaleproperties.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch MLS listings with photos
    const { data: mlsListings, error: mlsError } = await supabase
      .from("mls_listings")
      .select("listing_key, city, street_name, street_number, photos, updated_at")
      .eq("mls_status", "Active")
      .not("photos", "is", null)
      .limit(10000);

    if (mlsError) {
      console.error("Error fetching MLS listings:", mlsError);
      throw mlsError;
    }

    // Fetch presale projects with images
    const { data: presaleProjects, error: presaleError } = await supabase
      .from("presale_projects")
      .select("slug, name, neighborhood, city, project_type, featured_image, gallery_images, updated_at")
      .eq("is_published", true);

    if (presaleError) {
      console.error("Error fetching presale projects:", presaleError);
      throw presaleError;
    }

    // Helper to extract photo URLs from different formats
    const extractPhotoUrls = (photos: unknown): string[] => {
      if (!photos) return [];
      if (Array.isArray(photos)) {
        return photos.slice(0, 10).map((photo: unknown) => {
          if (typeof photo === 'string') return photo;
          if (photo && typeof photo === 'object') {
            const p = photo as Record<string, unknown>;
            return (p.MediaURL || p.url || p.Uri || '') as string;
          }
          return '';
        }).filter(Boolean);
      }
      return [];
    };

    // Generate image entries for MLS listings
    const mlsImageEntries = (mlsListings || []).flatMap(listing => {
      const photoUrls = extractPhotoUrls(listing.photos);
      if (photoUrls.length === 0) return [];

      const pageUrl = `${SITE_URL}/properties/${listing.listing_key}`;
      const address = listing.street_number && listing.street_name 
        ? `${listing.street_number} ${listing.street_name}` 
        : listing.city;

      return `
  <url>
    <loc>${pageUrl}</loc>
    ${photoUrls.map((url, index) => `
    <image:image>
      <image:loc>${escapeXml(url)}</image:loc>
      <image:title>${escapeXml(`${address} - Photo ${index + 1}`)}</image:title>
      <image:caption>${escapeXml(`Real estate listing photo for ${address}, ${listing.city}, BC`)}</image:caption>
      <image:geo_location>${escapeXml(`${listing.city}, BC, Canada`)}</image:geo_location>
    </image:image>`).join('')}
  </url>`;
    });

    // Generate image entries for presale projects
    const slugify = (text: string) => text.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const getTypeSlug = (type: string) => {
      const map: Record<string, string> = { condo: 'condos', townhome: 'townhomes', mixed: 'homes' };
      return map[type] || 'homes';
    };

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
      <image:caption>${escapeXml(`${project.name} presale ${project.project_type} in ${project.neighborhood}, ${project.city}`)}</image:caption>
      <image:geo_location>${escapeXml(`${project.city}, BC, Canada`)}</image:geo_location>
    </image:image>`).join('')}
  </url>`;
    }).filter(Boolean);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${mlsImageEntries.join('')}
${presaleImageEntries.join('')}
</urlset>`;

    console.log(`Image sitemap generated: ${mlsImageEntries.length} MLS + ${presaleImageEntries.length} presale entries`);

    // Store generation timestamp
    await supabase
      .from("app_settings")
      .upsert({
        key: "image_sitemap_last_generated",
        value: { 
          timestamp: new Date().toISOString(), 
          mls_count: mlsImageEntries.length,
          presale_count: presaleImageEntries.length 
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
