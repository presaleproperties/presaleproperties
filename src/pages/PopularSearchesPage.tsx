import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Home, Building2, Warehouse, HomeIcon } from "lucide-react";

// All BC cities with new construction inventory
const CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", "Coquitlam",
  "Delta", "Abbotsford", "New Westminster", "Port Coquitlam", "Port Moody",
  "Maple Ridge", "White Rock", "North Vancouver", "West Vancouver", "Chilliwack"
];

// Top neighborhoods per city
const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  Vancouver: ["Downtown", "Yaletown", "Kitsilano", "Mount Pleasant", "Fairview", "Coal Harbour", "West End"],
  Surrey: ["City Centre", "Fleetwood", "Guildford", "South Surrey", "Clayton", "Cloverdale", "Newton"],
  Burnaby: ["Metrotown", "Brentwood", "Highgate", "Edmonds", "Deer Lake", "Capitol Hill"],
  Richmond: ["City Centre", "Steveston", "Brighouse", "West Cambie", "Hamilton", "Seafair"],
  Langley: ["Willoughby", "Walnut Grove", "Murrayville", "Langley City", "Yorkson", "Brookswood"],
  Coquitlam: ["Burke Mountain", "Burquitlam", "Westwood Plateau", "Austin Heights", "Maillardville"],
  Delta: ["Ladner", "Tsawwassen", "North Delta", "Sunshine Hills"],
  Abbotsford: ["Downtown", "Clearbrook", "Mill Lake", "Auguston", "Sumas Mountain"],
  "New Westminster": ["Downtown", "Sapperton", "Queensborough", "Uptown", "Quay"],
  "Port Coquitlam": ["Citadel Heights", "Downtown", "Oxford Heights", "Mary Hill"],
  "Port Moody": ["Suter Brook", "Heritage Woods", "Moody Centre", "Klahanie", "Newport Village"],
  "Maple Ridge": ["Downtown", "Albion", "Cottonwood", "Silver Valley", "Hammond"],
  "White Rock": ["East Beach", "West Beach", "Town Centre", "Hillside"],
  "North Vancouver": ["Lower Lonsdale", "Central Lonsdale", "Lynn Valley", "Deep Cove"],
  "West Vancouver": ["Ambleside", "Dundarave", "Park Royal", "British Properties"],
  "Chilliwack": ["Downtown", "Sardis", "Promontory", "Vedder"],
};

// Property types
const PROPERTY_TYPES = [
  { slug: "condos", label: "Condos", icon: Building2 },
  { slug: "townhomes", label: "Townhomes", icon: Warehouse },
  { slug: "homes", label: "Homes", icon: HomeIcon },
];

// Helper to generate URL — always use /properties/ (canonical), never /resale/
const getCitySlug = (city: string) => city.toLowerCase().replace(/\s+/g, "-");
const getNeighborhoodSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");

export default function PopularSearchesPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "New Construction", href: "/properties" },
    { label: "Popular Searches" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>New Construction Homes for Sale in BC | 2024-2026 Built | PresaleProperties</title>
        <meta 
          name="description" 
          content="Browse all new construction homes, condos, and townhomes for sale in Metro Vancouver & Fraser Valley. Built 2024 or later. Find new condos in Vancouver, Surrey, Burnaby, Richmond & more." 
        />
        <link rel="canonical" href="https://presaleproperties.com/properties/popular-searches" />
      </Helmet>

      <ConversionHeader />

      <main className="container py-8 md:py-12">
        <Breadcrumbs items={breadcrumbs} />

        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              New Construction Homes for Sale in BC
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore brand new homes built in 2024 or later across Metro Vancouver and Fraser Valley. 
              Browse by city, property type, or neighborhood to find your perfect new construction home.
            </p>
          </div>

          {/* Property Type Quick Links */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-6">Browse by Property Type</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PROPERTY_TYPES.map(({ slug, label, icon: Icon }) => (
                <div key={slug} className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">New {label}</h3>
                  </div>
                  <ul className="space-y-2">
                   {CITIES.slice(0, 8).map((city) => (
                      <li key={city}>
                        <Link
                          to={`/properties/${getCitySlug(city)}/${slug}`}
                          className="text-primary hover:underline text-sm"
                        >
                          New {label} in {city}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* City-by-City Breakdown */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-6">Browse by City</h2>
            <div className="space-y-8">
              {CITIES.map((city) => {
                const citySlug = getCitySlug(city);
                const neighborhoods = CITY_NEIGHBORHOODS[city] || [];
                
                return (
                  <div key={city} className="border-b pb-8">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      New Construction in {city}
                    </h3>
                    
                    <div className="grid md:grid-cols-4 gap-6">
                      {/* All Properties */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          All Properties
                        </h4>
                        <ul className="space-y-2">
                          <li>
                          <Link to={`/properties/${citySlug}`} className="text-primary hover:underline text-sm">
                              All New Homes in {city}
                            </Link>
                          </li>
                          {PROPERTY_TYPES.map(({ slug, label }) => (
                            <li key={slug}>
                              <Link 
                                to={`/properties/${citySlug}/${slug}`} 
                                className="text-primary hover:underline text-sm"
                              >
                                New {label} in {city}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* By Neighborhood - Condos */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          New Condos by Area
                        </h4>
                        <ul className="space-y-2">
                          {neighborhoods.slice(0, 5).map((neighborhood) => (
                            <li key={neighborhood}>
                              <Link 
                                to={`/resale/${citySlug}/${getNeighborhoodSlug(neighborhood)}/condos`}
                                className="text-primary hover:underline text-sm"
                              >
                                New Condos in {neighborhood}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* By Neighborhood - Townhomes */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          New Townhomes by Area
                        </h4>
                        <ul className="space-y-2">
                          {neighborhoods.slice(0, 5).map((neighborhood) => (
                            <li key={neighborhood}>
                              <Link 
                                to={`/resale/${citySlug}/${getNeighborhoodSlug(neighborhood)}/townhomes`}
                                className="text-primary hover:underline text-sm"
                              >
                                New Townhomes in {neighborhood}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* By Bedroom */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          By Bedroom
                        </h4>
                        <ul className="space-y-2">
                          {[1, 2, 3, 4].map((bed) => (
                            <li key={bed}>
                              <Link 
                                to={`/resale/${citySlug}/${bed}-bedroom`}
                                className="text-primary hover:underline text-sm"
                              >
                                {bed}+ Bedroom Homes in {city}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* JSON-LD Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "New Construction Homes for Sale in BC",
              "description": "Browse all new construction homes, condos, and townhomes for sale in Metro Vancouver & Fraser Valley.",
              "url": "https://presaleproperties.com/properties/popular-searches",
              "isPartOf": {
                "@type": "WebSite",
                "name": "PresaleProperties",
                "url": "https://presaleproperties.com"
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
                  { "@type": "ListItem", "position": 2, "name": "New Construction", "item": "https://presaleproperties.com/properties" },
                  { "@type": "ListItem", "position": 3, "name": "Popular Searches" }
                ]
              }
            })}
          </script>
        </div>
      </main>

      <Footer />
    </div>
  );
}
