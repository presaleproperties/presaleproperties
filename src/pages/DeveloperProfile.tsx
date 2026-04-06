import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, MapPin, Calendar, ArrowLeft, ArrowRight } from "lucide-react";

interface Developer {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  founded_year: number | null;
  focus: string[] | null;
  project_count: number;
}

interface PresaleProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  project_type: string | null;
  status: string | null;
  featured_image: string | null;
  starting_price: number | null;
  price_range: string | null;
}

export default function DeveloperProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: developer, isLoading } = useQuery({
    queryKey: ["developer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as Developer;
    },
    enabled: !!slug,
  });

  const { data: projects } = useQuery({
    queryKey: ["developer-projects", developer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, project_type, status, featured_image, starting_price, price_range")
        .eq("developer_id", developer!.id)
        .order("name");
      if (error) throw error;
      return data as PresaleProject[];
    },
    enabled: !!developer?.id,
  });

  if (isLoading) {
    return (
      <>
        <ConversionHeader />
        <main className="min-h-screen bg-background">
          <div className="container px-4 py-12">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!developer) {
    return <Navigate to="/developers" replace />;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developer.name,
    url: developer.website_url || undefined,
    description: developer.description || undefined,
    address: developer.city ? {
      "@type": "PostalAddress",
      addressLocality: developer.city,
    } : undefined,
    ...(developer.founded_year ? { foundingDate: String(developer.founded_year) } : {}),
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <>
      <Helmet>
        <title>{developer.name} Presale Projects | BC Developer Profile</title>
        <meta
          name="description"
          content={developer.description?.slice(0, 155) || `Explore presale condos and townhomes by ${developer.name} in British Columbia.`}
        />
        <link rel="canonical" href={`https://presaleproperties.lovable.app/developers/${developer.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="container px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link to="/developers" className="hover:text-primary transition-colors">Developers</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{developer.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-foreground via-foreground to-foreground/90 py-10 md:py-14">
          <div className="container px-4">
            <Link to="/developers" className="inline-flex items-center gap-1.5 text-sm text-background/50 hover:text-background mb-6 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Developers
            </Link>

            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-background/10 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0 border border-background/10">
                {developer.logo_url ? (
                  <img src={developer.logo_url} alt={developer.name} className="w-full h-full object-contain p-3" />
                ) : (
                  <Building2 className="h-10 w-10 text-background/40" />
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold text-background mb-1.5">
                  {developer.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-background/60">
                  {developer.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {developer.city}
                    </span>
                  )}
                  {developer.founded_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Est. {developer.founded_year}
                    </span>
                  )}
                  {developer.website_url && (
                    <a
                      href={developer.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>

                {/* Focus tags */}
                {developer.focus && developer.focus.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {developer.focus.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-background/10 text-background/70 border-background/20 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        {developer.description && (
          <section className="py-8 md:py-10 border-b border-border/50">
            <div className="container px-4">
              <h2 className="text-lg font-bold text-foreground mb-3">About {developer.name}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                {developer.description}
              </p>
            </div>
          </section>
        )}

        {/* Active Projects */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <h2 className="text-lg font-bold text-foreground mb-5">
              Active Projects on Presale Properties
              {projects && projects.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">({projects.length})</span>
              )}
            </h2>

            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/presale/${project.slug}`}
                    className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      {project.featured_image ? (
                        <img
                          src={project.featured_image}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {project.neighborhood ? `${project.neighborhood}, ${project.city}` : project.city}
                      </div>
                      <div className="flex items-center justify-between">
                        {project.project_type && (
                          <Badge variant="secondary" className="text-xs">{project.project_type}</Badge>
                        )}
                        {project.price_range ? (
                          <span className="text-xs text-muted-foreground">{project.price_range}</span>
                        ) : project.starting_price ? (
                          <span className="text-xs text-muted-foreground">From {formatPrice(project.starting_price)}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl p-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No active projects listed yet.</p>
                <Link to="/presale-projects" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Browse all presale projects →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-8 md:py-10 bg-muted/30 border-t border-border/50">
          <div className="container px-4 text-center">
            <h2 className="text-lg font-bold mb-2">Looking for presales in {developer.city?.split(",")[0] || "BC"}?</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Browse all presale condos and townhomes across British Columbia.
            </p>
            <Link
              to="/presale-projects"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              View All Presales
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
