import { Button } from "@/components/ui/button";

export const VIPRealValue = () => {
  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28 px-4 bg-foreground text-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            But Here's What Most Buyers Don't Realize...
          </h2>
          <p className="text-primary text-xl font-semibold">
            The $1,500 credit is nice. The exclusive access is priceless.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-white/80 text-lg leading-relaxed mb-12 space-y-6">
            <p className="font-bold text-white text-xl">In 2026-2027, the presale game changed.</p>
            
            <div>
              <p className="font-semibold text-white mb-2">The old model:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>Developer launches project publicly</li>
                <li>Everyone shows up on Day 1</li>
                <li>Best units go to whoever gets there first</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">The new reality:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>Top developers reserve 40-60% of inventory for trusted partners</li>
                <li>Best units never make it to public launch</li>
                <li>By the time it's 'public,' the game is over</li>
              </ul>
            </div>
          </div>

          {/* Callout Box */}
          <div className="bg-white/5 border border-white/20 rounded-xl p-8 mb-12">
            <h3 className="text-xl font-bold text-primary mb-4">Here's what this means for you:</h3>
            <p className="text-white/90 mb-6 text-lg">
              If you're showing up to a public sales event, you're already late.
            </p>
            <div className="space-y-3 text-white/80">
              <p><span className="text-white font-semibold">The best floor plans?</span> Allocated to VIP clients weeks earlier.</p>
              <p><span className="text-white font-semibold">The best views?</span> Already claimed.</p>
              <p><span className="text-white font-semibold">The best pricing?</span> Gone (public pricing is 10-15% higher).</p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white text-lg">
                VIP Elite members don't compete with the crowd.<br />
                <span className="text-primary font-semibold">They get first choice—before there IS a crowd.</span>
              </p>
            </div>
          </div>

          <p className="text-center text-primary text-xl font-bold mb-8">
            This is why working with a presale specialist who has developer relationships isn't just helpful—it's essential.
          </p>

          <div className="text-center">
            <Button onClick={scrollToForm} size="lg" className="bg-primary text-primary-foreground font-semibold">
              Join VIP Elite →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
