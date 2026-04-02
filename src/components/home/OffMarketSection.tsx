import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{count}+</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function OffMarketSection() {
  const [projectCount, setProjectCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: listings } = await supabase
        .from("off_market_listings")
        .select("id, available_units")
        .eq("status", "published");

      if (listings && listings.length > 0) {
        setProjectCount(listings.length);
        setUnitCount(listings.reduce((sum, l) => sum + (l.available_units || 0), 0));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading || projectCount === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent p-8 md:p-12 text-center overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">
              <Lock className="h-3 w-3 mr-1" /> EXCLUSIVE
            </Badge>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Off-Market Inventory</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Access exclusive developer pricing, floor plans &amp; incentives before they hit the market
            </p>

            <div className="flex items-center justify-center gap-12 md:gap-16 py-4">
              <AnimatedCounter target={unitCount} label="VIP Units" />
              <div className="h-10 w-px bg-border" />
              <AnimatedCounter target={projectCount} label="Projects" />
            </div>

            <Button asChild size="lg" className="shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
              <Link to="/off-market">
                Unlock VIP Access <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
