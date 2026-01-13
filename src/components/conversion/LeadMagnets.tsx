import { useState } from "react";
import { Bell, Heart, TrendingUp, FileText, Calculator, Calendar, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { trackFormStart, trackFormSubmit, getVisitorId } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";

interface LeadMagnetProps {
  projectId?: string;
  projectName?: string;
  city?: string;
}

// Tier 1: Low Commitment Lead Magnets
export function SaveProjectButton({ projectId, projectName }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      await supabase.from("newsletter_subscribers").insert({
        email,
        source: "save_project",
        preferred_city: null,
        wants_projects: true,
        wants_assignments: false,
      });

      // Track
      trackFormSubmit({
        form_name: "save_project",
        form_location: "project_detail",
        email,
        project_name: projectName,
      });
      MetaEvents.lead({ content_name: projectName, content_category: "save_project" });

      localStorage.setItem(`saved_${projectId}`, "true");
      setIsSaved(true);
      setOpen(false);
      toast({ title: "Project saved!", description: "We'll notify you of updates." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if already saved
  const alreadySaved = projectId ? localStorage.getItem(`saved_${projectId}`) === "true" : isSaved;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => alreadySaved ? null : setOpen(true)}
        className={`gap-2 ${alreadySaved ? "bg-primary/10 text-primary border-primary/30" : ""}`}
        disabled={alreadySaved}
      >
        <Heart className={`h-4 w-4 ${alreadySaved ? "fill-primary" : ""}`} />
        {alreadySaved ? "Saved" : "Save Project"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>Save Project</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <Heart className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">Save {projectName}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get notified of price changes and new floor plans
            </p>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
            />
            <Button onClick={handleSave} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save & Get Updates"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PriceAlertButton({ projectId, projectName }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      await supabase.from("newsletter_subscribers").insert({
        email,
        source: "price_alert",
        wants_projects: true,
        wants_assignments: false,
      });

      trackFormSubmit({ form_name: "price_alert", form_location: "project_detail", email, project_name: projectName });
      MetaEvents.lead({ content_name: projectName, content_category: "price_alert" });

      setOpen(false);
      toast({ title: "Alert set!", description: "We'll notify you of price changes." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-2 text-muted-foreground">
        <Bell className="h-4 w-4" />
        Price Alert
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>Price Alert</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <Bell className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">Get Price Alerts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to know when prices drop or incentives are added
            </p>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
            />
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Setting up..." : "Set Price Alert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VIPNotifyButton({ projectName }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      await supabase.from("newsletter_subscribers").insert({
        email,
        source: "vip_notify",
        wants_projects: true,
        wants_assignments: false,
      });

      trackFormSubmit({ form_name: "vip_notify", form_location: "project_detail", email, project_name: projectName });
      MetaEvents.lead({ content_name: projectName, content_category: "vip_notify" });

      setOpen(false);
      toast({ title: "You're on the VIP list!", description: "We'll notify you before public sales." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <TrendingUp className="h-4 w-4" />
        Get VIP Access
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>VIP Access</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <TrendingUp className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">VIP Early Access</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get exclusive pricing before public launch
            </p>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
            />
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Joining..." : "Join VIP List"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NeighborhoodGuideButton({ city }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      await supabase.from("newsletter_subscribers").insert({
        email,
        source: "neighborhood_guide",
        preferred_city: city,
        wants_projects: true,
        wants_assignments: false,
      });

      trackFormSubmit({ form_name: "neighborhood_guide", form_location: "project_detail", email });
      MetaEvents.lead({ content_name: `${city} Guide`, content_category: "neighborhood_guide" });

      setOpen(false);
      toast({ title: "Check your email!", description: "Your guide is on its way." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <FileText className="h-4 w-4" />
        {city ? `${city} Guide` : "Neighborhood Guide"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>Neighborhood Guide</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <FileText className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">{city || "Neighborhood"} Buyer's Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get detailed insights on schools, transit, and investment potential
            </p>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
            />
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Download Free Guide"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Tier 2: Medium Commitment - ROI Analysis Request
export function ROIAnalysisButton({ projectId, projectName }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.email || !formData.phone) return;
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      await supabase.from("project_leads").insert({
        id: leadId,
        project_id: projectId,
        name: "ROI Analysis Request",
        email: formData.email,
        phone: formData.phone,
        message: `ROI Analysis Request for ${projectName}`,
        lead_source: "roi_analysis",
        visitor_id: getVisitorId(),
      });

      await supabase.functions.invoke("send-project-lead", { body: { leadId } });

      trackFormSubmit({ form_name: "roi_analysis", form_location: "project_detail", email: formData.email, project_name: projectName });
      MetaEvents.lead({ content_name: projectName, content_category: "roi_analysis" });

      setOpen(false);
      toast({ title: "Request received!", description: "Your ROI analysis will be emailed within 24 hours." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Calculator className="h-4 w-4" />
        Get ROI Analysis
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>ROI Analysis</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <Calculator className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">Free ROI Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get a personalized investment analysis for {projectName}
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Requesting..." : "Get My ROI Analysis"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Tier 3: High Commitment - Consultation Request
export function ConsultationButton({ projectName }: LeadMagnetProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.email || !formData.phone || !formData.name) return;
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      await supabase.from("project_leads").insert({
        id: leadId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: `Consultation request${projectName ? ` for ${projectName}` : ""}`,
        lead_source: "consultation",
        persona: "investor",
        visitor_id: getVisitorId(),
      });

      await supabase.functions.invoke("send-project-lead", { body: { leadId } });

      trackFormSubmit({ form_name: "consultation", form_location: "project_detail", email: formData.email, first_name: formData.name });
      MetaEvents.lead({ content_name: "Consultation", content_category: "high_intent" });

      setOpen(false);
      toast({ title: "Consultation requested!", description: "We'll call you within 24 hours." });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
        <Phone className="h-4 w-4" />
        Book Consultation
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <VisuallyHidden><DialogTitle>Book Consultation</DialogTitle></VisuallyHidden>
          <div className="text-center p-2">
            <Phone className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">Book a Free Consultation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Speak with a presale expert about your investment goals
            </p>
            <div className="space-y-3">
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Scheduling..." : "Book My Consultation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Multi-tier lead capture bar for project pages
export function ProjectLeadMagnetsBar({ projectId, projectName, city }: LeadMagnetProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3 border-y border-border">
      <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">Quick actions:</span>
      <SaveProjectButton projectId={projectId} projectName={projectName} />
      <PriceAlertButton projectId={projectId} projectName={projectName} />
      <ROIAnalysisButton projectId={projectId} projectName={projectName} />
    </div>
  );
}
