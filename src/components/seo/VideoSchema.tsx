import { Helmet } from "react-helmet-async";

interface VideoSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl?: string;
  embedUrl?: string;
  uploadDate: string;
  duration?: string; // ISO 8601 format, e.g., "PT2M30S" for 2 min 30 sec
  expires?: string;
  interactionCount?: number;
}

/**
 * VideoObject Schema component for video content
 * Helps videos appear in Google Video Search and enriched results
 */
export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  contentUrl,
  embedUrl,
  uploadDate,
  duration,
  expires,
  interactionCount,
}: VideoSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": name,
    "description": description,
    "thumbnailUrl": thumbnailUrl,
    ...(contentUrl && { "contentUrl": contentUrl }),
    ...(embedUrl && { "embedUrl": embedUrl }),
    "uploadDate": uploadDate,
    ...(duration && { "duration": duration }),
    ...(expires && { "expires": expires }),
    ...(interactionCount && {
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": interactionCount
      }
    }),
    "publisher": {
      "@type": "Organization",
      "name": "PresaleProperties.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://presaleproperties.com/logo.svg"
      }
    }
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
 * Generate VideoObject schema data for inline use
 */
export const generateVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl?: string;
  embedUrl?: string;
  uploadDate: string;
  duration?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": video.name,
  "description": video.description,
  "thumbnailUrl": video.thumbnailUrl,
  ...(video.contentUrl && { "contentUrl": video.contentUrl }),
  ...(video.embedUrl && { "embedUrl": video.embedUrl }),
  "uploadDate": video.uploadDate,
  ...(video.duration && { "duration": video.duration }),
  "publisher": {
    "@type": "Organization",
    "name": "PresaleProperties.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://presaleproperties.com/logo.svg"
    }
  }
});
