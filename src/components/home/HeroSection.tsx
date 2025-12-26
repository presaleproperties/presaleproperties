import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const topCities = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Richmond"];


export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/assignments?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/assignments");
    }
  };

  const handleCityClick = (city: string) => {
    navigate(`/assignments?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-fade-in">
            Find Your Next Assignment Here
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Discover presale condo assignments in Metro Vancouver. Browse listings, 
            connect with verified agents, and find your perfect investment.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by project, neighborhood, or developer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 shadow-gold">
              Search
            </Button>
          </form>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Top Cities
              </span>
              {topCities.map((city) => (
                <Button
                  key={city}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCityClick(city)}
                  className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {city}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/assignments")}
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                More Areas
              </Button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}