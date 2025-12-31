import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Bell, Check, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BuyerCTASection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch featured projects for thank you state
  const { data: featuredProjects } = useQuery({
    queryKey: ["featured-projects-cta"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, featured_image, status, starting_price")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: isSubmitted,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("project_leads").insert({
        email: email.trim(),
        name: "Newsletter Signup",
        message: "Signed up for new project alerts from homepage",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("You're on the list!");
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container px-4 relative">
        {isSubmitted ? (
          /* Thank You State with Featured Projects */
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Success Header */}
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/20 mb-4">
                <Bell className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                You're on the List!
              </h2>
              <p className="text-base md:text-lg text-background/70 max-w-lg mx-auto">
                We'll notify you about new presale projects and exclusive deals. In the meantime, check out these featured developments:
              </p>
            </div>

            {/* Featured Projects Grid */}
            {featuredProjects && featuredProjects.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {featuredProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/presale-projects/${project.slug}`}
                    className="group bg-background/5 hover:bg-background/10 border border-background/10 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    {/* Project Image */}
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {project.featured_image ? (
                        <img
                          src={project.featured_image}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-background/10 flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-background/30" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          project.status === "active" 
                            ? "bg-green-500 text-white" 
                            : "bg-primary text-primary-foreground"
                        }`}>
                          {project.status === "active" ? "Now Selling" : "Coming Soon"}
                        </span>
                      </div>
                    </div>
                    {/* Project Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-background/60 mb-1.5">
                        <MapPin className="h-3 w-3" />
                        {project.neighborhood}, {project.city}
                      </div>
                      <h3 className="font-semibold text-background group-hover:text-primary transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      {project.starting_price && (
                        <div className="mt-1">
                          <span className="text-[10px] text-background/50 block">Starting from</span>
                          <p className="text-base font-bold text-background leading-tight">
                            {formatPrice(project.starting_price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Browse All CTA */}
            <div className="text-center">
              <Link to="/presale-projects">
                <Button
                  size="lg"
                  className="text-base px-8"
                >
                  Browse All Projects
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Signup Form State */
          <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Exclusive Access
            </div>

            {/* Heading */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Get Early Access to New Presales
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-background/70 max-w-2xl mx-auto px-4">
                Be the first to know about new developments. Get exclusive pricing, floor plans, and VIP access before the public.
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm md:text-base text-background/80">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>New project alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Exclusive pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>VIP access</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 sm:h-14 text-base bg-background/10 border-background/20 text-background placeholder:text-background/50 focus-visible:ring-primary rounded-xl flex-1"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base font-semibold rounded-xl whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    <>
                      Get Early Access
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-background/50 mt-3">
                Free forever. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
