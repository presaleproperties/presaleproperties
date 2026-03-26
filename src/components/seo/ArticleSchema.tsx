import { Helmet } from "react-helmet-async";

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  category?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = "PresaleProperties.com",
  category
}: ArticleSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "image": image || "https://presaleproperties.com/og-image.jpg",
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Organization",
      "name": "Presale Properties",
      "url": "https://presaleproperties.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Presale Properties",
      "url": "https://presaleproperties.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://presaleproperties.com/lovable-uploads/f3790c27-57f0-4837-9047-f9da1e41c793.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    ...(category && { "articleSection": category })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
