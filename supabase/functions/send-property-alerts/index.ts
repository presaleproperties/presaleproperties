import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SavedSearch {
  id: string;
  client_id: string;
  name: string;
  cities: string[] | null;
  neighborhoods: string[] | null;
  property_types: string[] | null;
  listing_types: string[] | null;
  price_min: number | null;
  price_max: number | null;
  beds_min: number | null;
  beds_max: number | null;
  alert_frequency: string;
  last_alert_at: string | null;
  last_matched_listings: string[] | null;
  client: {
    email: string;
    first_name: string | null;
    alerts_enabled: boolean;
  };
}

interface MatchedProperty {
  type: "resale" | "presale";
  id: string;
  name: string;
  address: string;
  city: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image: string | null;
  url: string;
  isNew: boolean;
  priceChanged?: boolean;
  previousPrice?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query params
    const url = new URL(req.url);
    const frequency = url.searchParams.get("frequency") || "daily";
    
    console.log(`Processing ${frequency} property alerts...`);

    // Fetch active saved searches for the given frequency
    const { data: searches, error: searchError } = await supabase
      .from("saved_searches")
      .select(`
        *,
        client:clients!inner(email, first_name, alerts_enabled)
      `)
      .eq("is_active", true)
      .eq("alert_frequency", frequency)
      .eq("client.alerts_enabled", true);

    if (searchError) {
      console.error("Error fetching searches:", searchError);
      throw searchError;
    }

    if (!searches || searches.length === 0) {
      console.log("No active searches for this frequency");
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${searches.length} active searches to process`);

    let alertsSent = 0;

    for (const search of searches as SavedSearch[]) {
      try {
        const matchedProperties: MatchedProperty[] = [];
        const previouslyMatched = new Set(search.last_matched_listings || []);
        const newMatchedIds: string[] = [];

        // Check for matching resale listings
        if (!search.listing_types || search.listing_types.includes("resale")) {
          let resaleQuery = supabase
            .from("mls_listings")
            .select("listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, property_type, bedrooms_total, bathrooms_total, living_area, photos, list_date")
            .eq("mls_status", "Active")
            .gte("year_built", 2024);

          // Apply city filter
          if (search.cities?.length) {
            resaleQuery = resaleQuery.in("city", search.cities);
          }

          // Apply price filter
          if (search.price_min) {
            resaleQuery = resaleQuery.gte("listing_price", search.price_min);
          }
          if (search.price_max) {
            resaleQuery = resaleQuery.lte("listing_price", search.price_max);
          }

          // Apply bedroom filter
          if (search.beds_min) {
            resaleQuery = resaleQuery.gte("bedrooms_total", search.beds_min);
          }

          // Only get listings from after last alert
          if (search.last_alert_at) {
            resaleQuery = resaleQuery.gte("list_date", search.last_alert_at.split("T")[0]);
          }

          resaleQuery = resaleQuery.order("list_date", { ascending: false }).limit(20);

          const { data: resaleListings, error: resaleError } = await resaleQuery;

          if (!resaleError && resaleListings) {
            for (const listing of resaleListings) {
              const listingKey = listing.listing_key;
              if (!previouslyMatched.has(listingKey)) {
                const photos = listing.photos as any[];
                matchedProperties.push({
                  type: "resale",
                  id: listingKey,
                  name: `${listing.street_number} ${listing.street_name} ${listing.street_suffix || ""}`.trim(),
                  address: `${listing.city}, ${listing.neighborhood || ""}`.trim(),
                  city: listing.city,
                  price: listing.listing_price,
                  beds: listing.bedrooms_total,
                  baths: listing.bathrooms_total,
                  sqft: listing.living_area,
                  image: photos?.[0]?.MediaURL || null,
                  url: `https://presaleproperties.ca/resale/${listingKey}`,
                  isNew: true,
                });
                newMatchedIds.push(listingKey);
              }
            }
          }
        }

        // Check for matching presale projects
        if (!search.listing_types || search.listing_types.includes("presale")) {
          let presaleQuery = supabase
            .from("presale_projects")
            .select("id, name, slug, city, neighborhood, starting_price, project_type, featured_image, published_at")
            .eq("is_published", true);

          // Apply city filter
          if (search.cities?.length) {
            presaleQuery = presaleQuery.in("city", search.cities);
          }

          // Apply price filter
          if (search.price_min) {
            presaleQuery = presaleQuery.gte("starting_price", search.price_min);
          }
          if (search.price_max) {
            presaleQuery = presaleQuery.lte("starting_price", search.price_max);
          }

          // Only get projects from after last alert
          if (search.last_alert_at) {
            presaleQuery = presaleQuery.gte("published_at", search.last_alert_at);
          }

          presaleQuery = presaleQuery.order("published_at", { ascending: false }).limit(10);

          const { data: presaleProjects, error: presaleError } = await presaleQuery;

          if (!presaleError && presaleProjects) {
            for (const project of presaleProjects) {
              const projectId = project.id;
              if (!previouslyMatched.has(projectId)) {
                matchedProperties.push({
                  type: "presale",
                  id: projectId,
                  name: project.name,
                  address: `${project.city}, ${project.neighborhood || ""}`.trim(),
                  city: project.city,
                  price: project.starting_price,
                  beds: null,
                  baths: null,
                  sqft: null,
                  image: project.featured_image,
                  url: `https://presaleproperties.ca/presale-projects/${project.slug}`,
                  isNew: true,
                });
                newMatchedIds.push(projectId);
              }
            }
          }
        }

        // Send email if there are new matches
        if (matchedProperties.length > 0) {
          const emailHtml = generateAlertEmail(
            search.client.first_name || "there",
            search.name,
            matchedProperties
          );

          const result = await sendEmail({
            to: search.client.email,
            subject: `🏠 ${matchedProperties.length} New ${matchedProperties.length === 1 ? "Property" : "Properties"} Match Your Search`,
            html: emailHtml,
          });

          if (result.success) {
            alertsSent++;
            
            // Update the saved search with new matched listings
            const allMatchedIds = [...(search.last_matched_listings || []), ...newMatchedIds];
            await supabase
              .from("saved_searches")
              .update({
                last_alert_at: new Date().toISOString(),
                last_matched_listings: allMatchedIds.slice(-100), // Keep last 100
              })
              .eq("id", search.id);

          // Log alerts sent
          for (const prop of matchedProperties) {
            await supabase.from("property_alerts").insert({
              client_id: search.client_id,
              saved_search_id: search.id,
              alert_type: "new_listing",
              listing_key: prop.type === "resale" ? prop.id : null,
              project_id: prop.type === "presale" ? prop.id : null,
              property_name: prop.name,
              property_address: prop.address,
              price: prop.price,
              status: "sent",
              sent_at: new Date().toISOString(),
            });
          }

          // Also notify admin about the alert sent
          const { data: adminEmailSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "admin_notification_email")
            .maybeSingle();

          const adminEmail = typeof adminEmailSetting?.value === "string" ? adminEmailSetting.value : null;
          
          if (adminEmail) {
            await sendEmail({
              to: adminEmail,
              subject: `[Alert Sent] ${matchedProperties.length} properties sent to ${search.client.first_name || search.client.email}`,
              html: `
                <p>Property alert sent to: <strong>${search.client.email}</strong></p>
                <p>Search: ${search.name}</p>
                <p>Properties matched: ${matchedProperties.length}</p>
                <ul>
                  ${matchedProperties.map(p => `<li>${p.name} - ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(p.price)}</li>`).join("")}
                </ul>
              `,
            });
          }

          console.log(`Sent alert to ${search.client.email} with ${matchedProperties.length} properties`);
          }
        }
      } catch (err) {
        console.error(`Error processing search ${search.id}:`, err);
      }
    }

    console.log(`Finished sending ${alertsSent} alerts`);

    return new Response(JSON.stringify({ sent: alertsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-property-alerts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function generateAlertEmail(name: string, searchName: string, properties: MatchedProperty[]): string {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

  const propertyCards = properties.map(prop => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
      ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="width: 100%; height: 180px; object-fit: cover;" />` : ""}
      <div style="padding: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase;">
          ${prop.type === "presale" ? "🏗️ Presale" : "🏠 Move-In Ready"}
        </p>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a;">${prop.name}</h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${prop.address}</p>
        <p style="margin: 0 0 12px 0; font-size: 20px; font-weight: bold; color: #1a1a1a;">
          ${prop.type === "presale" ? "From " : ""}${formatPrice(prop.price)}
        </p>
        ${prop.beds || prop.baths || prop.sqft ? `
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
            ${prop.beds ? `${prop.beds} bed` : ""} 
            ${prop.baths ? `• ${prop.baths} bath` : ""} 
            ${prop.sqft ? `• ${prop.sqft} sqft` : ""}
          </p>
        ` : ""}
        <a href="${prop.url}" style="display: inline-block; background-color: #d4af37; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Details →
        </a>
      </div>
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 8px 0;">
          New Properties Match "${searchName}"
        </h1>
        <p style="color: #666; font-size: 16px; margin: 0 0 24px 0;">
          Hi ${name}, we found ${properties.length} new ${properties.length === 1 ? "property" : "properties"} matching your search criteria.
        </p>
        
        ${propertyCards}
        
        <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <a href="https://presaleproperties.ca/map-search" style="color: #d4af37; text-decoration: none; font-weight: 600;">
            Browse All Properties →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0 0 8px 0;">PresaleProperties.ca | Vancouver New Construction Specialists</p>
        <p style="margin: 0;">
          <a href="https://presaleproperties.ca/unsubscribe" style="color: #999;">Manage Preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
