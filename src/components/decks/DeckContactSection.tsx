import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import { Phone, Mail, MessageCircle, Star, Award, Globe, Quote, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Review {
  reviewer_name: string;
  reviewer_location: string | null;
  review_text: string;
  rating: number;
}

const AGENTS: Record<string, {
  fullName: string;
  title: string;
  languages: string;
  phone: string;
  email: string;
  photo: string;
  tagline: string;
}> = {
  "Uzair Muhammad": {
    fullName: "Uzair Muhammad",
    title: "Founder & Presale Strategist",
    languages: "English · Punjabi · Hindi · Urdu",
    phone: "778-231-3592",
    email: "info@presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769974057981-u5d1e1f.jpg",
    tagline: "Helping investors build wealth through strategic presale buying.",
  },
  "Sarb Grewal": {
    fullName: "Sarb Grewal",
    title: "Presale Expert",
    languages: "English · Punjabi",
    phone: "+1 (778) 846-7065",
    email: "sarb@presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973843032-qlc6fc.png",
    tagline: "Connecting buyers with the best presale opportunities in Metro Vancouver.",
  },
  "Ravish Passy": {
    fullName: "Ravish Passy",
    title: "Presale Expert",
    languages: "English · Hindi",
    phone: "+1 (604) 349-9399",
    email: "ravish@presaleproperties.com",
    photo: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973742728-csckvf.png",
    tagline: "Dedicated to making your first or next presale purchase seamless.",
  },
};

function resolveAgent(contactName?: string) {
  if (!contactName) return AGENTS["Uzair Muhammad"];
  const lower = contactName.toLowerCase();
  for (const [key, agent] of Object.entries(AGENTS)) {
    if (lower.includes(key.split(" ")[0].toLowerCase())) return agent;
  }
  return AGENTS["Uzair Muhammad"];
}

const REVIEWS_VISIBLE = 4;

interface DeckContactSectionProps {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  projectName: string;
}

export function DeckContactSection({
  contactName,
  contactPhone,
  contactEmail,
  contactWhatsapp,
  projectName,
}: DeckContactSectionProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const agent = resolveAgent(contactName);
  const displayPhone = contactPhone || agent.phone;
  const displayEmail = contactEmail || agent.email;
  const rawNumber = (contactWhatsapp || contactPhone || agent.phone).replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hi ${agent.fullName.split(" ")[0]}! I just viewed the ${projectName} deck — I'm interested. Can we connect?`);

  useEffect(() => {
    supabase
      .from("google_reviews")
      .select("reviewer_name, reviewer_location, review_text, rating")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) setReviews(data as Review[]);
      });
  }, []);

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, REVIEWS_VISIBLE);
  const hasMore = reviews.length > REVIEWS_VISIBLE;

  return (
    <section id="contact" className="relative py-16 sm:py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="mb-10 space-y-2">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.2em]">08 — Your Next Step</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            We Hand-Picked This For You
          </h2>
          <p className="text-muted-foreground text-base max-w-xl">
            This deck was put together specifically for you — pricing and floor plans before anyone else. Message us to hold a unit or ask anything.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">

          {/* LEFT — Agent card */}
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-background shadow-lg">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/8 to-transparent" />

            <div className="relative p-6 flex flex-col">
              {/* Agent photo + info */}
              <div className="flex items-start gap-4 mb-5">
                <div className="relative shrink-0">
                  <img
                    src={agent.photo}
                    alt={agent.fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top border-2 border-primary/30 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" title="Available now" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{agent.fullName}</h3>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Real Broker
                    </span>
                  </div>
                  <p className="text-base text-muted-foreground">{agent.title}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span>{agent.languages}</span>
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mb-4 leading-relaxed">
                "{agent.tagline}"
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
                <span className="text-sm text-muted-foreground ml-2 font-medium">5.0 · Google Reviews</span>
              </div>

              {/* Primary CTA */}
              <a
                href={`https://wa.me/${rawNumber}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white mb-3 touch-manipulation transition-all active:scale-[0.98]"
                style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.30)" }}
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                I'm Interested
              </a>

              {/* Contact links */}
              <div className="space-y-2 mb-4">
                <a
                  href={`tel:${displayPhone}`}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors touch-manipulation"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{displayPhone}</span>
                </a>
                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors touch-manipulation"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="truncate">{displayEmail}</span>
                </a>
              </div>

              {/* Brokerage note */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                <Award className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Presale Properties · Real Broker</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">presaleproperties.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Reviews */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground">5.0</span>
              <span className="text-xs text-muted-foreground">· 40+ Google Reviews</span>
            </div>

            {/* Reviews grid — 2 cols, initially 4 reviews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleReviews.map((review, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-background p-4 shadow-sm flex flex-col gap-2"
                >
                  <Quote className="h-4 w-4 text-primary/40 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4">
                    {review.review_text}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.reviewer_name}</p>
                      {review.reviewer_location && (
                        <p className="text-xs text-muted-foreground">{review.reviewer_location}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / less toggle */}
            {hasMore && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="flex items-center gap-2 self-start text-sm font-medium text-primary hover:text-primary/80 transition-colors touch-manipulation mt-1"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showAllReviews && "rotate-180")} />
                {showAllReviews ? "Show fewer reviews" : `See ${reviews.length - REVIEWS_VISIBLE} more reviews`}
              </button>
            )}
          </div>
        </div>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        projectName={projectName}
        agentEmail={displayEmail}
      />
    </section>
  );
}
