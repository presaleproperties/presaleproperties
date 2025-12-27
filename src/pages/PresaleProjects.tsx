import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search,
  MapPin,
  Calendar,
  Building2,
  Star,
  Loader2,
  ArrowRight
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  completion_year: number | null;
  starting_price: number | null;
  short_description: string | null;
  featured_image: string | null;
  is_featured: boolean;
};

export default function PresaleProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, short_description, featured_image, is_featured")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const cities = [...new Set(projects.map(p => p.city))].sort();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || project.city === cityFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesType = typeFilter === "all" || project.project_type === typeFilter;
    return matchesSearch && matchesCity && matchesStatus && matchesType;
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Coming Soon</Badge>;
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Selling Now</Badge>;
      case "sold_out":
        return <Badge variant="secondary">Sold Out</Badge>;
      default:
        return null;
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };

  return (
    <>
      <Helmet>
        <title>Presale Projects | PresaleProperties.com</title>
        <meta name="description" content="Discover new presale projects in Greater Vancouver. Browse condos, townhomes, and mixed developments with VIP pricing and floor plans." />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section - Clean & Minimal */}
        <section className="bg-background border-b border-border py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                New & Pre Construction Homes
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Whether you're looking for a new condo, townhome, or development, we're here to guide you. 
                Search {projects.length} developments in Greater Vancouver. View details, floor plans, and pricing.
              </p>
              <p className="text-sm text-muted-foreground">
                View a list of{" "}
                <button 
                  onClick={() => { setCityFilter("all"); setStatusFilter("all"); setTypeFilter("all"); }}
                  className="text-primary hover:underline"
                >
                  all developments
                </button>
                {" "}or filter by city below.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b py-3 md:py-4">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    <SelectItem value="active">Selling Now</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="condo">Condos</SelectItem>
                    <SelectItem value="townhome">Townhomes</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-6 md:py-12">
          <div className="container px-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 md:py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16 md:py-20">
                <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2">No projects found</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setCityFilter("all");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                  Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProjects.map((project) => (
                    <Link key={project.id} to={`/presale-projects/${project.slug}`}>
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {project.featured_image ? (
                            <img
                              src={project.featured_image}
                              alt={project.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            {getStatusBadge(project.status)}
                            {project.is_featured && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                            <h3 className="font-semibold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                            <span className="truncate">{project.city}, {project.neighborhood}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs md:text-sm mb-2 md:mb-3">
                            <span className="text-muted-foreground">{formatType(project.project_type)}</span>
                            {project.completion_year && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {project.completion_year}
                              </span>
                            )}
                          </div>
                          {project.short_description && (
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3 hidden sm:block">
                              {project.short_description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {project.starting_price ? (
                              <span className="text-base md:text-lg font-bold text-primary">
                                From {formatPrice(project.starting_price)}
                              </span>
                            ) : (
                              <span className="text-xs md:text-sm text-muted-foreground">Contact for pricing</span>
                            )}
                            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}