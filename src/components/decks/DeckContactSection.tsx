import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import { Phone, Mail, MessageCircle, Star, Award, Globe, Quote } from "lucide-react";

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

const REVIEWS = [
  {
    name: "Harpreet S.",
    location: "Surrey, BC",
    text: "Uzair and the team helped me secure a presale unit in Langley at pre-launch pricing. The whole process was explained clearly and I felt confident every step of the way.",
    rating: 5,
  },
  {
    name: "Michael T.",
    location: "Burnaby, BC",
    text: "Professional, knowledgeable, and genuinely invested in getting me the best deal. Sarb was available whenever I had questions — even evenings and weekends.",
    rating: 5,
  },
  {
    name: "Priya K.",
    location: "Abbotsford, BC",
    text: "I had no idea how presales worked before working with this team. They walked me through every detail and the investment has already appreciated significantly.",
    rating: 5,
  },
  {
    name: "Navdeep B.",
    location: "Coquitlam, BC",
    text: "Ravish was fantastic — very thorough and always on top of new projects. I've now purchased two presale units through Presale Properties.",
    rating: 5,
  },
  {
    name: "Jennifer L.",
    location: "Richmond, BC",
    text: "Incredibly responsive and transparent. They never pushed me toward anything — just gave honest advice. 100% would recommend to anyone looking at presales.",
    rating: 5,
  },
  {
    name: "Kamran A.",
    location: "North Delta, BC",
    text: "Outstanding service from start to finish. Uzair's market knowledge is unmatched — he spotted value in a project before anyone else was talking about it.",
    rating: 5,
  },
];

function resolveAgent(contactName?: string) {
  if (!contactName) return AGENTS["Uzair Muhammad"];
  const lower = contactName.toLowerCase();
  for (const [key, agent] of Object.entries(AGENTS)) {
    if (lower.includes(key.split(" ")[0].toLowerCase())) return agent;
  }
  return AGENTS["Uzair Muhammad"];
}

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
  const agent = resolveAgent(contactName);

  const displayPhone = contactPhone || agent.phone;
  const displayEmail = contactEmail || agent.email;
  const whatsappNumber = (contactWhatsapp || contactPhone || agent.phone).replace(/\D/g, "");

  return (
    <section id="contact" className="relative py-16 sm:py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          06
        </div>

        <div className="mb-10 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">06 — Contact</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Ready to Invest?</h2>
          <p className="text-muted-foreground text-sm">
            Limited units available. Our specialists are ready to walk you through every detail.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* LEFT — Agent card (full width of column) */}
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-background shadow-lg h-full">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/8 to-transparent" />

            <div className="relative p-6 sm:p-8 flex flex-col h-full">
              {/* Agent photo + info */}
              <div className="flex items-start gap-5 mb-6">
                <div className="relative shrink-0">
                  <img
                    src={agent.photo}
                    alt={agent.fullName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top border-2 border-primary/30 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" title="Available" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{agent.fullName}</h3>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Real Broker
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.title}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span>{agent.languages}</span>
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-4 mb-6 leading-relaxed">
                "{agent.tagline}"
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
                <span className="text-sm text-muted-foreground ml-2 font-medium">5.0 · Google Reviews</span>
              </div>

              {/* Contact links */}
              <div className="space-y-2.5 mb-6">
                <a
                  href={`tel:${displayPhone}`}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors group touch-manipulation"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span>{displayPhone}</span>
                </a>
                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors group touch-manipulation"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="truncate">{displayEmail}</span>
                </a>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  size="lg"
                  className="flex-1 h-12 shadow-lg shadow-primary/20 touch-manipulation"
                  onClick={() => setBookingOpen(true)}
                >
                  Book a Private Showing
                </Button>
                {whatsappNumber && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 sm:px-5 touch-manipulation"
                    style={{ borderColor: "#25D366", color: "#25D366" }}
                    onClick={() => window.open(`https://wa.me/${whatsappNumber}`, "_blank")}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" style={{ color: "#25D366" }} />
                    WhatsApp
                  </Button>
                )}
              </div>

              {/* Brokerage note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/40 mt-auto">
                <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Presale Properties · Real Broker</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    presaleproperties.com · info@presaleproperties.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Google Reviews grid */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground">5.0</span>
              <span className="text-xs text-muted-foreground">· 40+ Google Reviews</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {REVIEWS.map((review, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-background p-4 shadow-sm flex flex-col gap-3"
                >
                  <Quote className="h-4 w-4 text-primary/40 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {review.text}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.location}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Legal footer */}
        <div className="mt-12 pt-8 border-t border-primary/10 text-center">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto px-4">
            This presentation is prepared for qualified investors and real estate professionals. All
            projections are estimates based on current market conditions and are not guarantees of
            future performance. Speak with a licensed financial advisor before making investment
            decisions. Presale Properties | Real Broker
          </p>
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
