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
  matchScore?: number;
  matchReasons?: string[];
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
            matchedProperties,
            search.client_id
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

    // Also send AI-powered recommendations for clients without saved searches
    const aiRecommendationsSent = await sendAIRecommendations(supabase, frequency);
    console.log(`Sent ${aiRecommendationsSent} AI-powered recommendations`);

    console.log(`Finished sending ${alertsSent} alerts + ${aiRecommendationsSent} AI recommendations`);

    return new Response(JSON.stringify({ sent: alertsSent, aiRecommendations: aiRecommendationsSent }), {
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

async function sendAIRecommendations(supabase: any, frequency: string): Promise<number> {
  // Find clients with activity but no saved searches, who haven't received AI recs recently
  const lastSentThreshold = frequency === "weekly" 
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get clients with recent activity
  const { data: activeClients, error: clientError } = await supabase
    .from("clients")
    .select("id, email, first_name, alerts_enabled, alert_frequency")
    .eq("alerts_enabled", true)
    .eq("alert_frequency", frequency)
    .gte("intent_score", 10) // Only clients with meaningful activity
    .limit(50);

  if (clientError || !activeClients) {
    console.error("Error fetching clients for AI recs:", clientError);
    return 0;
  }

  // Filter to clients without active saved searches
  const clientIds = activeClients.map((c: any) => c.id);
  const { data: searchingClients } = await supabase
    .from("saved_searches")
    .select("client_id")
    .in("client_id", clientIds)
    .eq("is_active", true);

  const clientsWithSearches = new Set((searchingClients || []).map((s: any) => s.client_id));
  const clientsForAI = activeClients.filter((c: any) => !clientsWithSearches.has(c.id));

  console.log(`Found ${clientsForAI.length} clients eligible for AI recommendations`);

  let sent = 0;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  for (const client of clientsForAI) {
    try {
      // Check if already sent AI recs recently
      const { data: recentAlerts } = await supabase
        .from("property_alerts")
        .select("id")
        .eq("client_id", client.id)
        .eq("alert_type", "ai_recommendation")
        .gte("sent_at", lastSentThreshold)
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) {
        continue; // Skip, already sent
      }

      // Get AI recommendations
      const recommendations = await getAIRecommendationsForClient(supabase, client.id, lovableApiKey);
      
      if (recommendations.length === 0) {
        continue;
      }

      // Convert to MatchedProperty format
      const properties: MatchedProperty[] = recommendations.map((r: any) => ({
        ...r,
        isNew: true,
      }));

      // Generate and send email
      const emailHtml = generateAIRecommendationEmail(
        client.first_name || "there",
        properties,
        client.id
      );

      const result = await sendEmail({
        to: client.email,
        subject: `🎯 ${properties.length} Properties Picked Just for You`,
        html: emailHtml,
      });

      if (result.success) {
        sent++;

        // Log the alerts
        for (const prop of properties) {
          await supabase.from("property_alerts").insert({
            client_id: client.id,
            alert_type: "ai_recommendation",
            listing_key: prop.type === "resale" ? prop.id : null,
            project_id: prop.type === "presale" ? prop.id : null,
            property_name: prop.name,
            property_address: prop.address,
            price: prop.price,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }

        console.log(`Sent AI recommendations to ${client.email}`);
      }
    } catch (err) {
      console.error(`Error sending AI recs to ${client.email}:`, err);
    }
  }

  return sent;
}

async function getAIRecommendationsForClient(supabase: any, clientId: string, apiKey: string | undefined): Promise<any[]> {
  // Fetch client activity
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: activities } = await supabase
    .from("client_activity")
    .select("activity_type, listing_key, project_id, project_name, city, price, property_type")
    .eq("client_id", clientId)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (!activities || activities.length < 3) {
    return [];
  }

  // Build profile from activity
  const cities: Record<string, number> = {};
  const prices: number[] = [];
  const WEIGHTS: Record<string, number> = {
    favorite_add: 10, favorite: 10, floorplan_download: 8, 
    showing_request: 15, property_view: 2, floorplan_view: 5
  };

  for (const act of activities) {
    const w = WEIGHTS[act.activity_type] || 1;
    if (act.city) cities[act.city] = (cities[act.city] || 0) + w;
    if (act.price > 0) prices.push(act.price);
  }

  const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  prices.sort((a, b) => a - b);
  const priceMin = prices[Math.floor(prices.length * 0.1)] || 400000;
  const priceMax = prices[Math.floor(prices.length * 0.9)] || 1500000;

  // Fetch candidates
  const candidates: any[] = [];

  // Resale
  let resaleQ = supabase
    .from("mls_listings")
    .select("listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, bedrooms_total, bathrooms_total, living_area, photos")
    .eq("mls_status", "Active")
    .gte("year_built", 2020);

  if (topCities.length > 0) resaleQ = resaleQ.in("city", topCities);
  resaleQ = resaleQ.gte("listing_price", priceMin * 0.8).lte("listing_price", priceMax * 1.2);
  resaleQ = resaleQ.order("list_date", { ascending: false }).limit(8);

  const { data: resale } = await resaleQ;
  if (resale) {
    for (const l of resale) {
      const photos = l.photos as any[];
      candidates.push({
        type: "resale",
        id: l.listing_key,
        name: `${l.street_number} ${l.street_name} ${l.street_suffix || ""}`.trim(),
        address: `${l.city}, ${l.neighborhood || ""}`.trim(),
        city: l.city,
        price: l.listing_price,
        beds: l.bedrooms_total,
        baths: l.bathrooms_total,
        sqft: l.living_area,
        image: photos?.[0]?.MediaURL || null,
        url: `https://presaleproperties.ca/resale/${l.listing_key}`,
        matchReasons: [`In ${l.city}`, "Matches your price range"],
      });
    }
  }

  // Presale
  let presaleQ = supabase
    .from("presale_projects")
    .select("id, name, slug, city, neighborhood, starting_price, featured_image")
    .eq("is_published", true);

  if (topCities.length > 0) presaleQ = presaleQ.in("city", topCities);
  presaleQ = presaleQ.gte("starting_price", priceMin * 0.7).lte("starting_price", priceMax * 1.3);
  presaleQ = presaleQ.order("published_at", { ascending: false }).limit(6);

  const { data: presale } = await presaleQ;
  if (presale) {
    for (const p of presale) {
      candidates.push({
        type: "presale",
        id: p.id,
        name: p.name,
        address: `${p.city}, ${p.neighborhood || ""}`.trim(),
        city: p.city,
        price: p.starting_price,
        beds: null,
        baths: null,
        sqft: null,
        image: p.featured_image,
        url: `https://presaleproperties.ca/presale-projects/${p.slug}`,
        matchReasons: [`New in ${p.city}`, "Based on your browsing"],
      });
    }
  }

  return candidates.slice(0, 6);
}

function generateAIRecommendationEmail(name: string, properties: MatchedProperty[], clientId: string): string {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

  const trackingPixelUrl = `https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/track-email-open?cid=${clientId}&t=open`;

  const propertyCards = properties.map((prop) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
      ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" style="width: 100%; height: 180px; object-fit: cover;" />` : ""}
      <div style="padding: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #d4af37; text-transform: uppercase; font-weight: 600;">
          ${prop.type === "presale" ? "🏗️ Presale" : "🏠 Move-In Ready"}
        </p>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a2e;">${prop.name}</h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${prop.address}</p>
        <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1a1a2e;">
          ${prop.type === "presale" ? "From " : ""}${formatPrice(prop.price)}
        </p>
        ${prop.matchReasons && prop.matchReasons.length > 0 ? `
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #d4af37;">
            ✨ ${prop.matchReasons.slice(0, 2).join(" • ")}
          </p>
        ` : ""}
        ${prop.beds || prop.baths || prop.sqft ? `
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
            ${prop.beds ? `${prop.beds} bed` : ""} 
            ${prop.baths ? `• ${prop.baths} bath` : ""} 
            ${prop.sqft ? `• ${prop.sqft} sqft` : ""}
          </p>
        ` : ""}
        <a href="${prop.url}?utm_source=email&utm_medium=ai_recs&utm_campaign=property_alert&cid=${clientId}" style="display: inline-block; background-color: #d4af37; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
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
      <style>
        @media only screen and (max-width: 620px) {
          .main-table { width: 100% !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <table class="main-table" width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px 0;">
              🎯 Picked Just for You
            </h1>
            <p style="color: #d4af37; font-size: 14px; margin: 0;">
              Based on your browsing activity
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #ffffff; padding: 24px;">
            <p style="color: #666; font-size: 16px; margin: 0 0 24px 0;">
              Hi ${name}, our AI analyzed your recent activity and found ${properties.length} properties you might love.
            </p>
            
            ${propertyCards}
            
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="https://presaleproperties.ca/map-search?utm_source=email&utm_medium=ai_recs&cid=${clientId}" style="color: #d4af37; text-decoration: none; font-weight: 600;">
                Explore All Properties →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1a1a2e; border-radius: 0 0 12px 12px; padding: 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #fff; font-size: 14px;">PresaleProperties.com</p>
            <p style="margin: 0; color: #888; font-size: 12px;">
              <a href="tel:+16722581100" style="color: #d4af37;">672-258-1100</a> | 
              <a href="mailto:info@presaleproperties.com" style="color: #d4af37;">info@presaleproperties.com</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- Email Open Tracking Pixel -->
      <img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />
    </body>
    </html>
  `;
}

function generateAlertEmail(name: string, searchName: string, properties: MatchedProperty[], clientId: string): string {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

  const trackingPixelUrl = `https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/track-email-open?cid=${clientId}&t=open`;

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
        <a href="${prop.url}?utm_source=email&utm_medium=alert&cid=${clientId}" style="display: inline-block; background-color: #d4af37; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
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
      <style>
        @media only screen and (max-width: 620px) {
          .main-table { width: 100% !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <table class="main-table" width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px 0;">
              🏠 New Properties Match "${searchName}"
            </h1>
            <p style="color: #d4af37; font-size: 14px; margin: 0;">
              ${properties.length} new ${properties.length === 1 ? "listing" : "listings"} found
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #ffffff; padding: 24px;">
            <p style="color: #666; font-size: 16px; margin: 0 0 24px 0;">
              Hi ${name}, we found ${properties.length} new ${properties.length === 1 ? "property" : "properties"} matching your search criteria.
            </p>
            
            ${propertyCards}
            
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="https://presaleproperties.ca/map-search?utm_source=email&utm_medium=alert&cid=${clientId}" style="color: #d4af37; text-decoration: none; font-weight: 600;">
                Browse All Properties →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1a1a2e; border-radius: 0 0 12px 12px; padding: 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #fff; font-size: 14px;">PresaleProperties.com</p>
            <p style="margin: 0; color: #888; font-size: 12px;">
              <a href="tel:+16722581100" style="color: #d4af37;">672-258-1100</a> | 
              <a href="mailto:info@presaleproperties.com" style="color: #d4af37;">info@presaleproperties.com</a>
            </p>
            <p style="margin: 8px 0 0 0; color: #666; font-size: 11px;">
              <a href="https://presaleproperties.ca/unsubscribe?cid=${clientId}" style="color: #666;">Manage Preferences</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- Email Open Tracking Pixel -->
      <img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />
    </body>
    </html>
  `;
}

serve(handler);
