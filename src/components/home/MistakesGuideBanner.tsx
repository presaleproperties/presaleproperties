import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MistakesGuideLeadMagnet } from "@/components/conversion/MistakesGuideLeadMagnet";
import bannerImage from "@/assets/vancouver-skyline-banner.jpg";

interface MistakesGuideBannerProps {
  /** Tracking location label */
  location?: string;
}

export function MistakesGuideBanner({ location = "homepage_banner" }: MistakesGuideBannerProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          <img
            src={bannerImage}
            alt="Metro Vancouver skyline at sunset — presale buyer guide"
            loading="lazy"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Left-to-right dark overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-transparent" />

          <div className="relative px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 max-w-2xl">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-background leading-[1.1] mb-4">
              Avoid the 7 Costly Mistakes Presale Buyers Make
            </h2>
            <p className="text-background/85 text-sm md:text-base leading-relaxed mb-7 max-w-lg">
              Free buyer guide covering hidden contract clauses, deposit traps, GST &amp; PTT surprises, and what the sales centre won&apos;t tell you.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="font-bold gap-2 h-12 px-7 text-base shadow-lg"
              onClick={() => setOpen(true)}
            >
              <Download className="h-4 w-4" />
              Download Free Guide
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="p-2 md:p-4">
            <MistakesGuideLeadMagnet location={location} variant="inline" />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
