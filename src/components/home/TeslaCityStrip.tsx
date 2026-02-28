import { Link } from "react-router-dom";
import { SearchTab } from "./HeroSection";

const CITIES = [
  { name: "Vancouver", presaleSlug: "vancouver-presale-condos", resaleSlug: "properties/vancouver" },
  { name: "Surrey", presaleSlug: "surrey-presale-condos", resaleSlug: "properties/surrey" },
  { name: "Langley", presaleSlug: "langley-presale-condos", resaleSlug: "properties/langley" },
  { name: "Burnaby", presaleSlug: "burnaby-presale-condos", resaleSlug: "properties/burnaby" },
  { name: "Coquitlam", presaleSlug: "coquitlam-presale-condos", resaleSlug: "properties/coquitlam" },
  { name: "Richmond", presaleSlug: "richmond-presale-condos", resaleSlug: "properties/richmond" },
  { name: "Abbotsford", presaleSlug: "abbotsford-presale-condos", resaleSlug: "properties/abbotsford" },
  { name: "Delta", presaleSlug: "delta-presale-condos", resaleSlug: "properties/delta" },
];

interface TeslaCityStripProps {
  activeTab: SearchTab;
}

export function TeslaCityStrip({ activeTab }: TeslaCityStripProps) {
  return (
    <div className="border-y border-border/50 bg-background">
      <div className="container px-6 sm:px-8">
        <div className="flex items-stretch overflow-x-auto scrollbar-hide divide-x divide-border/40">
          <div className="shrink-0 flex items-center pr-6 py-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap">Browse by City</span>
          </div>
          {CITIES.map((city) => {
            const slug = activeTab === "projects" ? city.presaleSlug : city.resaleSlug;
            return (
              <Link
                key={city.name}
                to={`/${slug}`}
                className="shrink-0 flex items-center px-5 py-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap"
              >
                {city.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
