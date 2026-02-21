import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Home, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { getCityPropertiesUrl } from "@/lib/propertiesUrls";

const PRESALE_TYPES = [
  { label: "Condos", slug: "presale-condos", icon: Building2 },
  { label: "Townhomes", slug: "presale-townhomes", icon: Home },
];

const PRESALE_YEARS = [
  { label: "2025", slug: "presale-projects-completing-2025" },
  { label: "2026", slug: "presale-projects-completing-2026" },
  { label: "2027", slug: "presale-projects-completing-2027" },
  { label: "2028", slug: "presale-projects-completing-2028" },
];

const PRESALE_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "Abbotsford",
];

export function FeaturedProjects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["most-viewed-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, view_count")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="pt-6 sm:pt-8 pb-10 sm:pb-14 md:pb-16 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        {/* Quick Search Links — compact inline */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {PRESALE_TYPES.map(({ label, slug, icon: Icon }) => (
            <Link
              key={slug}
              to={`/vancouver-${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/30"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
          {PRESALE_YEARS.map(({ label, slug }) => (
            <Link
              key={slug}
              to={`/${slug}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/80 transition-colors border border-border"
            >
              <Calendar className="h-3 w-3" />
              {label}
            </Link>
          ))}
          <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
          {PRESALE_CITIES.map((city) => {
            const citySlug = city.toLowerCase().replace(/\s+/g, "-");
            return (
              <Link
                key={city}
                to={`/${citySlug}-presale-condos`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MapPin className="h-3 w-3 text-primary/60" />
                {city}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Hottest Presale Projects
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              The most in-demand new developments across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="hidden sm:flex w-fit group">
            <Link to="/presale-projects">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <div className="p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {projects.map((project) => (
              <PresaleProjectCard
                key={project.id}
                id={project.id}
                slug={project.slug}
                name={project.name}
                city={project.city}
                neighborhood={project.neighborhood}
                projectType={project.project_type}
                status={project.status}
                completionYear={project.completion_year}
                startingPrice={project.starting_price}
                featuredImage={project.featured_image}
                galleryImages={project.gallery_images}
                size="featured"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-card rounded-xl border">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              Featured Projects Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              We're curating the best presale developments for you.
            </p>
            <Button asChild>
              <Link to="/presale-projects">Browse All Projects</Link>
            </Button>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link to="/presale-projects">
            <Button variant="outline" className="w-full">
              View All Projects
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
