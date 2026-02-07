import { Link } from "react-router-dom";
import { slugify } from "@/lib/seoUrls";
import skylineImage from "@/assets/vancouver-skyline-evening.jpg";

const METRO_VANCOUVER_CITIES = [
  "Vancouver", "Burnaby", "Surrey", "Coquitlam",
  "Langley", "Delta", "New Westminster",
  "Port Moody", "Maple Ridge", "Abbotsford",
];

export function AreasOfFocus() {

  const displayCities = METRO_VANCOUVER_CITIES;

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
        {/* Charcoal overlay matching brand foreground */}
        <div className="absolute inset-0 bg-[hsl(220_25%_8%/0.82)]" />
        {/* Gold gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3 block">
          Our Communities
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 md:mb-6">
          Our Areas of Focus
        </h2>
        <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto mb-10 md:mb-14">
          New construction specialists across Metro Vancouver & Fraser Valley
        </p>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {displayCities.map((city) => (
            <Link
              key={city}
              to={`/${slugify(city)}-presale-condos`}
              className="px-5 py-2.5 sm:px-6 sm:py-3 border border-primary/30 text-white/90 text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 rounded-sm backdrop-blur-sm bg-white/[0.04]"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>

      {/* Gold gradient accent at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}
