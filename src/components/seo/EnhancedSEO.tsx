import { Helmet } from "@/components/seo/Helmet";

interface EnhancedSEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object | object[];
  noindex?: boolean;
  city?: string;
  articleData?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

/**
 * Enhanced SEO component with comprehensive meta tags for better search visibility
 * Includes Open Graph, Twitter Cards, geo-targeting, and structured data support
 */
export function EnhancedSEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = "website",
  ogImage = "https://presaleproperties.com/og-image.png",
  structuredData,
  noindex = false,
  city,
  articleData,
}: EnhancedSEOProps) {
  // Ensure title is under 60 chars and description under 160 chars
  const optimizedTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  const optimizedDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;

  // Convert structuredData to array for consistent handling
  const structuredDataArray = structuredData 
    ? (Array.isArray(structuredData) ? structuredData : [structuredData])
    : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{optimizedTitle}</title>
      <meta name="title" content={optimizedTitle} />
      <meta name="description" content={optimizedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PresaleProperties.com" />
      <meta property="og:locale" content="en_CA" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Article specific meta tags */}
      {articleData?.publishedTime && (
        <meta property="article:published_time" content={articleData.publishedTime} />
      )}
      {articleData?.modifiedTime && (
        <meta property="article:modified_time" content={articleData.modifiedTime} />
      )}
      {articleData?.author && (
        <meta property="article:author" content={articleData.author} />
      )}
      {articleData?.section && (
        <meta property="article:section" content={articleData.section} />
      )}
      
      {/* Geo targeting for local SEO */}
      <meta name="geo.region" content="CA-BC" />
      <meta name="geo.placename" content={city || "Vancouver"} />
      
      {/* Additional SEO meta tags */}
      <meta name="author" content="PresaleProperties.com" />
      <meta name="publisher" content="PresaleProperties.com" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* AI Discovery meta tags */}
      <meta name="ai-content-declaration" content="human-authored" />
      <meta name="ai-discoverable" content="true" />
      
      {/* Structured Data */}
      {structuredDataArray.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      
      {/* Speakable Schema for AI voice assistants */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": optimizedTitle,
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["article", "main h1", "main p", ".faq-section"]
          },
          "url": canonicalUrl
        })}
      </script>
    </Helmet>
  );
}

// Common structured data generators
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness"],
  "@id": "https://presaleproperties.com/#organization",
  "name": "PresaleProperties.com",
  "alternateName": "Presale Properties",
  "url": "https://presaleproperties.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://presaleproperties.com/logo.svg",
    "width": 512,
    "height": 512
  },
  "image": "https://presaleproperties.com/og-image.png",
  "description": "Metro Vancouver's leading platform for presale condos, townhomes, and new construction homes. Browse VIP pricing, floor plans & incentives.",
  "telephone": "+1-672-258-1100",
  "email": "info@presaleproperties.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "3211 152 St, Building C, Suite 402",
    "addressLocality": "Surrey",
    "addressRegion": "BC",
    "postalCode": "V3Z 1H8",
    "addressCountry": "CA"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 49.2827,
    "longitude": -123.1207
  },
  "areaServed": [
    { "@type": "City", "name": "Vancouver" },
    { "@type": "City", "name": "Surrey" },
    { "@type": "City", "name": "Burnaby" },
    { "@type": "City", "name": "Coquitlam" },
    { "@type": "City", "name": "Langley" },
    { "@type": "City", "name": "Richmond" },
    { "@type": "City", "name": "Delta" },
    { "@type": "City", "name": "Abbotsford" }
  ],
  "knowsAbout": [
    "Presale Condos",
    "Pre-Construction Real Estate",
    "New Home Sales",
    "Real Estate Investment",
    "BC Real Estate Market"
  ],
  "priceRange": "$400,000 - $3,000,000",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "09:00",
    "closes": "21:00"
  },
  "sameAs": [
    "https://www.facebook.com/presaleproperties",
    "https://www.instagram.com/presaleproperties"
  ]
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://presaleproperties.com/#website",
  "url": "https://presaleproperties.com",
  "name": "PresaleProperties.com",
  "description": "Browse presale condos and new construction homes in Metro Vancouver",
  "publisher": {
    "@id": "https://presaleproperties.com/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://presaleproperties.com/presale-projects?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "en-CA"
});

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateRealEstateListingSchema = (listing: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price?: number;
  city: string;
  address?: string;
  propertyType: string;
  datePosted?: string;
  lat?: number;
  lng?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": listing.name,
  "description": listing.description,
  "url": listing.url,
  "image": listing.image,
  "datePosted": listing.datePosted,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": listing.city,
    "addressRegion": "BC",
    "addressCountry": "CA",
    "streetAddress": listing.address
  },
  ...(listing.lat && listing.lng ? {
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": listing.lat,
      "longitude": listing.lng
    }
  } : {}),
  ...(listing.price ? {
    "offers": {
      "@type": "Offer",
      "priceCurrency": "CAD",
      "price": listing.price,
      "availability": "https://schema.org/InStock"
    }
  } : {}),
  "additionalType": listing.propertyType === "condo" ? "https://schema.org/Apartment" :
                    listing.propertyType === "townhome" ? "https://schema.org/House" : 
                    "https://schema.org/Residence"
});

export const generateLocalBusinessSchema = (city: string) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": `PresaleProperties.com - ${city}`,
  "description": `Find presale condos and new construction homes in ${city}, BC`,
  "url": `https://presaleproperties.com/${city.toLowerCase()}-presale-condos`,
  "telephone": "+1-672-258-1100",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": city,
    "addressRegion": "BC",
    "addressCountry": "CA"
  },
  "areaServed": {
    "@type": "City",
    "name": city
  }
});
