import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Download,
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  CheckCircle,
  Home,
  Layers,
  Star
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: "coming_soon" | "active" | "sold_out";
  city: string;
  neighborhood: string;
  address: string | null;
  developer_name: string | null;
  project_type: "condo" | "townhome" | "mixed";
  unit_mix: string | null;
  starting_price: number | null;
  price_range: string | null;
  deposit_structure: string | null;
  incentives: string | null;
  completion_month: number | null;
  completion_year: number | null;
  occupancy_estimate: string | null;
  short_description: string | null;
  full_description: string | null;
  highlights: string[] | null;
  amenities: string[] | null;
  faq: { question: string; answer: string }[] | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  floorplan_files: string[] | null;
  brochure_files: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean;
};

export default function PresaleProjectDetail() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProject({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as { question: string; answer: string }[]
        });
        setSelectedImage(data.featured_image);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("project_leads")
        .insert({
          project_id: project.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || null,
        });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "We'll get back to you with more details shortly.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "coming_soon":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-base px-4 py-1">Coming Soon</Badge>;
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600 text-base px-4 py-1">Selling Now</Badge>;
      case "sold_out":
        return <Badge variant="secondary" className="text-base px-4 py-1">Sold Out</Badge>;
      default:
        return null;
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", { month: "long" });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/presale-projects">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const allImages = [
    project.featured_image,
    ...(project.gallery_images || [])
  ].filter(Boolean) as string[];

  return (
    <>
      <Helmet>
        <title>{project.seo_title || `${project.name} | PresaleProperties.com`}</title>
        <meta name="description" content={project.seo_description || project.short_description || `${project.name} - ${project.project_type} in ${project.city}, ${project.neighborhood}`} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b">
          <div className="container py-3">
            <Link to="/presale-projects" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-muted/50 to-background">
          <div className="container py-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Gallery */}
              <div className="space-y-4">
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(img)}
                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === img ? "border-primary" : "border-transparent hover:border-muted-foreground"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {getStatusBadge(project.status)}
                  {project.is_featured && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.name}</h1>
                <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                  <span>{project.city}, {project.neighborhood}</span>
                </div>
                {project.address && (
                  <p className="text-muted-foreground mb-4">{project.address}</p>
                )}

                {/* Quick Facts */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Home className="h-4 w-4" />
                      Property Type
                    </div>
                    <div className="font-semibold capitalize">{project.project_type}</div>
                  </div>
                  {project.completion_year && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Completion
                      </div>
                      <div className="font-semibold">
                        {project.completion_month && getMonthName(project.completion_month)} {project.completion_year}
                      </div>
                    </div>
                  )}
                  {project.developer_name && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Building2 className="h-4 w-4" />
                        Developer
                      </div>
                      <div className="font-semibold">{project.developer_name}</div>
                    </div>
                  )}
                  {project.unit_mix && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Layers className="h-4 w-4" />
                        Unit Mix
                      </div>
                      <div className="font-semibold">{project.unit_mix}</div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                {(project.starting_price || project.price_range) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </div>
                    {project.starting_price && (
                      <div className="text-2xl font-bold text-primary">
                        From {formatPrice(project.starting_price)}
                      </div>
                    )}
                    {project.price_range && (
                      <div className="text-muted-foreground">{project.price_range}</div>
                    )}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="flex-1" asChild>
                    <a href="#contact-form">
                      <Mail className="h-4 w-4 mr-2" />
                      Get VIP Access
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1" asChild>
                    <a href="tel:+16722581100">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {project.full_description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        {project.full_description.split("\n").map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Highlights */}
                {project.highlights && project.highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Highlights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {project.amenities.map((a, i) => (
                          <Badge key={i} variant="secondary" className="px-3 py-1">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Deposit & Incentives */}
                {(project.deposit_structure || project.incentives) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Deposit & Incentives</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {project.deposit_structure && (
                        <div>
                          <h4 className="font-medium mb-2">Deposit Structure</h4>
                          <p className="text-muted-foreground">{project.deposit_structure}</p>
                        </div>
                      )}
                      {project.incentives && (
                        <div>
                          <h4 className="font-medium mb-2">Current Incentives</h4>
                          <p className="text-muted-foreground">{project.incentives}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Downloads */}
                {((project.floorplan_files && project.floorplan_files.length > 0) || 
                  (project.brochure_files && project.brochure_files.length > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Downloads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {project.floorplan_files?.map((file, i) => (
                          <Button key={i} variant="outline" asChild>
                            <a href={file} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Floor Plan {i + 1}
                            </a>
                          </Button>
                        ))}
                        {project.brochure_files?.map((file, i) => (
                          <Button key={i} variant="outline" asChild>
                            <a href={file} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Brochure {i + 1}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* FAQ */}
                {project.faq && project.faq.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {project.faq.map((item, i) => (
                          <AccordionItem key={i} value={`faq-${i}`}>
                            <AccordionTrigger className="text-left">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent>
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Contact Form */}
              <div>
                <Card id="contact-form" className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Get VIP Access</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Receive floor plans, pricing, and exclusive updates
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="I'm interested in learning more..."
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Send Request
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}