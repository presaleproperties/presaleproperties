/**
 * /thank-you — focused post-conversion confirmation page.
 *
 * Query params:
 *   ?type=vip|project|calculator
 *   &project=<slug>
 *
 * Behavior:
 *   - Pushes a `conversion_page_view` dataLayer event on mount
 *   - Minimal UI (no search bars), with header + footer for navigation
 *   - 3 next-step tiles: Book a call, WhatsApp, Browse projects
 */
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, MessageCircle, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useHelmet } from "@/hooks/useHelmet";

type LeadType = "vip" | "project" | "calculator";

const WHATSAPP_NUMBER = "16722581100";

function buildWhatsAppHref(type: LeadType, projectSlug?: string | null) {
  const subject =
    type === "vip"
      ? "VIP early access"
      : type === "calculator"
        ? "my calculator report"
        : projectSlug
          ? `the ${projectSlug.replace(/-/g, " ")} info package`
          : "a project info package";
  const text = `Hi Uzair, I just requested ${subject}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function ThankYou() {
  const [params] = useSearchParams();
  const rawType = (params.get("type") || "").toLowerCase();
  const type: LeadType = (["vip", "project", "calculator"].includes(rawType) ? rawType : "project") as LeadType;
  const projectSlug = params.get("project");

  useHelmet({
    title: "Thank you — Presale Properties",
    description: "Your request has been received. Check your email for next steps.",
    robots: "noindex, nofollow",
  });

  // Push a single conversion_page_view event on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event: "conversion_page_view",
      lead_type: type,
      project_slug: projectSlug || undefined,
    });
  }, [type, projectSlug]);

  const whatsappHref = useMemo(() => buildWhatsAppHref(type, projectSlug), [type, projectSlug]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConversionHeader />

      <main className="flex-1">
        <section className="container max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3">
            Check your email — it's on the way.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            In the meantime, a few things you might find useful.
          </p>
        </section>

        <section className="container max-w-5xl mx-auto px-4 pb-16 md:pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Tile 1 — Book a call */}
            <Link
              to="/book"
              className="group rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Book a 15-min call with Uzair
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized recommendations based on your goals.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Pick a time
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Tile 2 — WhatsApp */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                WhatsApp Uzair directly
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quick questions? Get a reply within minutes.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Open WhatsApp
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>

            {/* Tile 3 — Browse projects */}
            <Link
              to="/presale-projects"
              className="group rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Browse other projects
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore presale opportunities across Metro Vancouver.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                See all projects
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          <div className="mt-10 text-center">
            <Button variant="ghost" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
