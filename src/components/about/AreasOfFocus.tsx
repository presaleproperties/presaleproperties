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
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-foreground/75" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3 block">
          Our Communities
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-10 md:mb-14">
          Our Areas of Focus
        </h2>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {displayCities.map((city) => (
            <Link
              key={city}
              to={`/${slugify(city)}-presale-condos`}
              className="px-5 py-2.5 sm:px-6 sm:py-3 border border-white/40 text-white text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
