/**
 * /lp/:slug — paid-traffic landing page.
 *
 * Same data source as the organic /:cityProductSlug presale page
 * (presale_projects), but stripped of all navigation, blog links,
 * search, and other distractions. Above-the-fold hero + form, then a
 * short below-the-fold info section. Sticky mobile CTA bar at the bottom.
 *
 * Tracking:
 *  - On mount → window.dataLayer.push({ event: 'lp_view', project_slug, lead_source })
 *  - Form submits use lead_type = "project_inquiry_lp" (see LpLeadForm)
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import {
  Loader2,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";
import { LpLeadForm } from "@/components/lp/LpLeadForm";
import { useAppSetting } from "@/hooks/useAppSetting";
import { generateProjectFAQs } from "@/lib/seoFaq";
import { setCurrentPageContext, clearCurrentPageContext } from "@/lib/crm/pageContext";

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  starting_price: number | null;
  completion_year: number | null;
  occupancy_estimate: string | null;
  unit_mix: string | null;
  deposit_structure: string | null;
  strata_fees: string | null;
  short_description: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  faq: { question: string; answer: string }[] | null;
  developer_name: string | null;
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  is_published: boolean;
};

function formatPrice(n: number | null): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function LpProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { data: whatsappSetting } = useAppSetting("whatsapp_number");
  const whatsappNumber = (whatsappSetting as string) || "16722581100";
  const phoneNumber = "+16722581100";
  const phoneDisplay = "(672) 258-1100";
  const emailAddress = "info@presaleproperties.com";

  // ---------- data fetch ----------
  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select(
          "id,name,slug,city,neighborhood,starting_price,completion_year,occupancy_estimate,unit_mix,deposit_structure,strata_fees,short_description,featured_image,gallery_images,faq,developer_name,project_type,is_published"
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProject({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as {
            question: string;
            answer: string;
          }[],
        } as Project);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ---------- lp_view dataLayer event ----------
  useEffect(() => {
    if (!project) return;
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event: "lp_view",
      project_slug: project.slug,
      project_name: project.name,
      lead_source: searchParams.get("utm_source") || "direct",
    });

    // Register page context for CRM presence broadcasts
    setCurrentPageContext({
      project_id: project.id,
      project_name: project.name,
      project_slug: project.slug,
      city: project.city,
      neighborhood: project.neighborhood ?? undefined,
      page_type: "lp_project",
    });
    return () => clearCurrentPageContext();
  }, [project, searchParams]);

  // ---------- derived data ----------
  const startingPrice = useMemo(
    () => (project ? formatPrice(project.starting_price) : null),
    [project]
  );

  const galleryPhotos = useMemo(() => {
    if (!project) return [] as { url: string; alt: string }[];
    const all = [
      project.featured_image,
      ...(Array.isArray(project.gallery_images) ? project.gallery_images : []),
    ].filter((u): u is string => Boolean(u));
    // Dedupe + cap at 5 for the LP carousel
    return Array.from(new Set(all))
      .slice(0, 5)
      .map((url) => ({ url, alt: project.name }));
  }, [project]);

  // Pick the 3 most useful FAQs: prefer custom project FAQ first, fall back
  // to the SEO-generated set used elsewhere on the site.
  const topFaqs = useMemo(() => {
    if (!project) return [] as { question: string; answer: string }[];
    const custom = (project.faq || []).filter(
      (f) => f && f.question && f.answer
    );
    if (custom.length >= 3) return custom.slice(0, 3);
    const generated = generateProjectFAQs({
      projectName: project.name,
      city: project.city,
      neighborhood: project.neighborhood || undefined,
      startingPrice: project.starting_price || undefined,
      completionYear: project.completion_year || undefined,
      depositStructure: project.deposit_structure || undefined,
      projectType: project.project_type,
    } as any);
    const merged = [...custom, ...generated.map((f) => ({ question: f.question, answer: f.answer }))];
    return merged.slice(0, 3);
  }, [project]);

  const whatsappMessage = project
    ? `Hi Uzair, I just requested ${project.name} info — can you send the floor plans?`
    : "Hi Uzair, I'm interested in a presale project.";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // ---------- early returns ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound || !project) {
    return <Navigate to="/presale-projects" replace />;
  }

  const locationLabel = [project.neighborhood, project.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`${project.name} – Floor Plans & Pricing | ${project.city}`}</title>
        <meta
          name="description"
          content={
            project.short_description?.slice(0, 155) ||
            `Get instant access to floor plans and pricing for ${project.name} in ${project.city}. No obligation.`
          }
        />
        {/* Paid-traffic LP — keep out of search index */}
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* ---------------- Minimal header (logo only, centered) ---------------- */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <Logo size="sm" asLink />
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------- Above-the-fold hero ---------------- */}
        <section className="relative">
          {/* Background hero image */}
          <div className="absolute inset-0 z-0">
            {project.featured_image ? (
              <img
                src={project.featured_image}
                alt={project.name}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-foreground/30" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 sm:py-14 lg:py-20 grid lg:grid-cols-[1.1fr_minmax(320px,420px)] gap-8 lg:gap-12 items-start">
            {/* Left — copy */}
            <div className="text-background">
              {project.developer_name && (
                <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-background/70">
                  By {project.developer_name}
                </span>
              )}
              <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                {project.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm sm:text-base text-background/90">
                {locationLabel && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {locationLabel}
                  </span>
                )}
                {startingPrice && (
                  <span className="inline-flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    From {startingPrice}
                  </span>
                )}
                {(project.completion_year || project.occupancy_estimate) && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {project.occupancy_estimate || `Completion ${project.completion_year}`}
                  </span>
                )}
              </div>

              {project.short_description && (
                <p className="mt-5 text-background/85 text-base sm:text-lg max-w-xl leading-relaxed">
                  {project.short_description}
                </p>
              )}
            </div>

            {/* Right — primary form */}
            <div className="lg:sticky lg:top-24">
              <LpLeadForm
                projectId={project.id}
                projectName={project.name}
                projectSlug={project.slug}
                formPosition="hero"
              />

              {/* Social proof strip — directly under the form per spec */}
              <div className="mt-4 rounded-xl bg-background/95 backdrop-blur border border-border/60 px-4 py-3 flex items-center justify-center gap-3 text-[11px] sm:text-xs font-semibold text-foreground">
                <span>400+ Families Helped</span>
                <span className="text-muted-foreground">·</span>
                <span>$200M+ Sold</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Below-the-fold ---------------- */}
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 space-y-12">
          {/* Image carousel — reuse REW gallery component for parity with site */}
          {galleryPhotos.length > 0 && (
            <div>
              <h2 className="sr-only">Project Gallery</h2>
              <REWPhotoGallery photos={galleryPhotos} alt={project.name} />
            </div>
          )}

          {/* Key facts */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Key Facts
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: "Starting Price",
                  value: startingPrice ?? "Contact for pricing",
                },
                {
                  icon: Building2,
                  label: "Unit Mix",
                  value: project.unit_mix || "Contact for details",
                },
                {
                  icon: CheckCircle,
                  label: "Deposit Structure",
                  value: project.deposit_structure || "Contact for details",
                },
                {
                  icon: Calendar,
                  label: "Completion",
                  value:
                    project.occupancy_estimate ||
                    (project.completion_year ? String(project.completion_year) : "TBA"),
                },
                ...(project.strata_fees
                  ? [{ icon: Building2, label: "Strata Fees", value: project.strata_fees }]
                  : []),
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-start gap-4 rounded-xl border border-border/70 bg-card p-5"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      {f.label}
                    </p>
                    <p className="mt-1 text-foreground font-medium leading-snug">
                      {f.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs (top 3) */}
          {topFaqs.length > 0 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Frequently Asked
              </h2>
              <Accordion type="single" collapsible className="rounded-xl border border-border/70 bg-card divide-y divide-border/60">
                {topFaqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-5">
                    <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Second form */}
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
              Ready to see {project.name}?
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Get the full floor plan & pricing package — sent to your inbox in minutes.
            </p>
            <LpLeadForm
              projectId={project.id}
              projectName={project.name}
              projectSlug={project.slug}
              formPosition="bottom"
              ctaLabel="Send Me the Floor Plans"
            />
          </div>
        </section>
      </main>

      {/* ---------------- Minimal footer ---------------- */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-2 sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors font-semibold"
            >
              <Phone className="h-4 w-4 text-primary" />
              {phoneDisplay}
            </a>
            <a
              href={`mailto:${emailAddress}`}
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors font-semibold"
            >
              {emailAddress}
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:justify-end">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <span>© {new Date().getFullYear()} Presale Properties</span>
          </div>
        </div>
      </footer>

      {/* ---------------- Sticky mobile CTA (Call / WhatsApp / Form) ---------------- */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/98 backdrop-blur-lg shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl shrink-0"
            aria-label="Call"
          >
            <a href={`tel:${phoneNumber}`}>
              <Phone className="h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl shrink-0 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#128C7E]"
            aria-label="WhatsApp"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
            </a>
          </Button>
          <Button
            onClick={() => {
              const formEl = document.querySelector(
                "[data-lp-bottom-form]"
              ) as HTMLElement | null;
              // Bottom form lives in the second section — scroll to it
              const target =
                formEl ||
                (document.querySelectorAll("form")[1] as HTMLElement | null) ||
                document.querySelector("form");
              target?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex-1 h-12 rounded-xl font-bold text-sm"
          >
            Send Me Floor Plans
          </Button>
        </div>
      </div>
      {/* Spacer so the sticky bar never overlaps the footer on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
