import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import { Phone, Mail, MessageCircle, Star, Award, Globe } from "lucide-react";

// Our agent roster with real headshots
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

// Fuzzy match: find the best matching agent by contact name
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

  // Use stored data but allow override from deck settings
  const displayPhone = contactPhone || agent.phone;
  const displayEmail = contactEmail || agent.email;
  const whatsappNumber = (contactWhatsapp || contactPhone || agent.phone).replace(/\D/g, "");

  const allAgents = Object.values(AGENTS);

  return (
    <section id="contact" className="relative py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          06
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">06 — Contact</p>
          <h2 className="text-4xl font-bold text-foreground">Ready to Invest?</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Limited units available. Our specialists are ready to walk you through every detail.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* ── Primary agent card ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-background shadow-lg">
              {/* Background accent */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/8 to-transparent" />

              <div className="relative p-6 sm:p-8">
                {/* Agent photo + info */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="relative shrink-0">
                    <img
                      src={agent.photo}
                      alt={agent.fullName}
                      className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-primary/30 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background" title="Available" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold text-foreground">{agent.fullName}</h3>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        Real Broker
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.title}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {agent.languages}
                    </p>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mb-6">
                  "{agent.tagline}"
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-6">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">5.0 · Google Reviews</span>
                </div>

                {/* Contact links */}
                <div className="space-y-2 mb-6">
                  <a
                    href={`tel:${displayPhone}`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <span>{displayPhone}</span>
                  </a>
                  <a
                    href={`mailto:${displayEmail}`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate">{displayEmail}</span>
                  </a>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="flex-1 h-12 shadow-lg shadow-primary/20" onClick={() => setBookingOpen(true)}>
                    Book a Private Showing
                  </Button>
                  {whatsappNumber && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-5"
                      onClick={() => window.open(`https://wa.me/${whatsappNumber}`, "_blank")}
                    >
                      <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Team panel ── */}
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Our Full Team</h3>
              <p className="text-sm text-muted-foreground">
                All three specialists are available to assist. Reach out via any contact method below.
              </p>
            </div>

            {allAgents.map((a) => (
              <div key={a.fullName} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${a.fullName === agent.fullName ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background hover:border-primary/20'}`}>
                <img
                  src={a.photo}
                  alt={a.fullName}
                  className="w-14 h-14 rounded-xl object-cover object-top border border-border/40 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{a.fullName}</p>
                    {a.fullName === agent.fullName && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full shrink-0">Lead</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1 truncate">
                    <Globe className="h-3 w-3 shrink-0" />
                    {a.languages}
                  </p>
                </div>
                <a
                  href={`tel:${a.phone}`}
                  className="shrink-0 w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary" />
                </a>
              </div>
            ))}

            {/* Brokerage note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Presale Properties · Real Broker</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  presaleproperties.com · info@presaleproperties.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal footer */}
        <div className="mt-16 pt-8 border-t border-primary/10 text-center">
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
