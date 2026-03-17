import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import { Phone, Mail, MessageCircle } from "lucide-react";

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

  const initials = contactName
    ? contactName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PP";

  const whatsappNumber = (contactWhatsapp || contactPhone || "").replace(/\D/g, "");

  return (
    <section id="contact" className="relative py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          06
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-10">
          {/* Label */}
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
              06 — Contact
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Ready to Invest?
            </h2>
            <p className="text-muted-foreground text-lg mt-3">
              Limited units available. Reach out today to secure your suite.
            </p>
          </div>

          {/* Agent card */}
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
              {initials}
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">
                {contactName || "Presale Properties"}
              </p>
              <p className="text-sm text-muted-foreground">Presale Specialist | Real Broker</p>
            </div>

            {/* Contact links */}
            <div className="flex flex-wrap justify-center gap-3">
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-background hover:border-primary/50 text-sm font-medium text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {contactPhone}
                </a>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-background hover:border-primary/50 text-sm font-medium text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  {contactEmail}
                </a>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-8" onClick={() => setBookingOpen(true)}>
              Book a Private Showing
            </Button>
            {whatsappNumber && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8"
                onClick={() => window.open(`https://wa.me/${whatsappNumber}`, "_blank")}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground pb-4">
            Also available: Sarb Grewal & Ravish Passy · English · Punjabi · Hindi · Urdu
          </p>
        </div>
      </div>

      <div className="border-t border-primary/10 mt-8 pt-8 text-center">
        <p className="text-xs text-muted-foreground max-w-3xl mx-auto px-4">
          This presentation is prepared for qualified investors and real estate professionals. All
          projections are estimates based on current market conditions and are not guarantees of
          future performance. Speak with a licensed financial advisor before making investment
          decisions. Presale Properties | Real Broker
        </p>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        projectName={projectName}
        agentEmail={contactEmail}
      />
    </section>
  );
}
