import { Link } from "react-router-dom";
import { slugify } from "@/lib/seoUrls";
import skylineImage from "@/assets/vancouver-skyline-evening.jpg";

const METRO_VANCOUVER_CITIES = [
  "Vancouver", "Burnaby", "Surrey", "Coquitlam",
  "Langley", "Delta", "New Westminster",
  "Port Moody", "Maple Ridge", "Abbotsford",
];

export function AreasOfFocus() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={skylineImage}
          alt="Vancouver skyline at dusk"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[hsl(220_25%_8%/0.82)]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      </div>

      <div className="relative z-10 container px-4 text-center">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3 block">
          Where We Work
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-on-dark tracking-tight mb-4 md:mb-6">
          New homes near you
        </h2>
        <p className="text-on-dark/60 text-sm sm:text-base max-w-lg mx-auto mb-10 md:mb-14">
          We cover the communities where families are building their futures — from Vancouver to the Fraser Valley.
        </p>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {METRO_VANCOUVER_CITIES.map((city) => (
            <Link
              key={city}
              to={`/${slugify(city)}-presale-condos`}
              className="px-5 py-2.5 sm:px-6 sm:py-3 border border-primary/30 text-on-dark/90 text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 rounded-sm backdrop-blur-sm bg-card/[0.04]"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}
