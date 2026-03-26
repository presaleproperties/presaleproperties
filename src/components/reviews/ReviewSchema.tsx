import { Helmet } from "@/components/seo/Helmet";

export interface Review {
  author: string;
  reviewBody: string;
  reviewRating: number; // 1-5
  datePublished: string;
}

interface ReviewSchemaProps {
  reviews: Review[];
  itemReviewed: {
    type: "RealEstateAgent" | "LocalBusiness" | "Product";
    name: string;
    url?: string;
    image?: string;
  };
}

/**
 * Review and AggregateRating schema for SEO
 * Helps display star ratings in search results
 */
export function ReviewSchema({ reviews, itemReviewed }: ReviewSchemaProps) {
  if (!reviews || reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.reviewRating, 0) / reviews.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": itemReviewed.type,
    "name": itemReviewed.name,
    ...(itemReviewed.url && { "url": itemReviewed.url }),
    ...(itemReviewed.image && { "image": itemReviewed.image }),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": reviews.length,
      "reviewCount": reviews.length
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewBody": review.reviewBody,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.reviewRating,
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": review.datePublished
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

/**
 * Generate review schema data for inline use
 */
export const generateReviewSchema = (
  reviews: Review[],
  businessName: string = "PresaleProperties.com"
) => {
  const avgRating = reviews.reduce((sum, r) => sum + r.reviewRating, 0) / reviews.length;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessName,
    "url": "https://presaleproperties.com",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "bestRating": "5",
      "ratingCount": reviews.length
    }
  };
};
