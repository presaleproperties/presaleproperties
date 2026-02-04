import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  project_type: string | null;
  starting_price: number | null;
  price_range: string | null;
  completion_year: number | null;
  completion_month: number | null;
  developer_name: string | null;
  featured_image: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
  bio: string | null;
  specializations: string[];
}

// Premium brand colors
const COLORS = {
  gold: [218, 165, 32] as [number, number, number], // Premium gold
  goldLight: [255, 215, 100] as [number, number, number],
  dark: [20, 20, 20] as [number, number, number],
  charcoal: [40, 40, 40] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  offWhite: [250, 250, 248] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
};

const formatPrice = (price: number | null): string => {
  if (!price) return "Contact Us";
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
};

const formatCompletion = (year: number | null, month: number | null): string => {
  if (!year) return "TBD";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return month ? `${months[month - 1]} ${year}` : String(year);
};

// Load image as base64 for PDF embedding
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export function PresentationDeckGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // Fetch team members and projects in parallel
      const [teamResult, projectsResult] = await Promise.all([
        supabase
          .from("team_members")
          .select("id, full_name, title, photo_url, bio, specializations")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(3),
        supabase
          .from("presale_projects")
          .select("id, name, city, neighborhood, project_type, starting_price, price_range, completion_year, completion_month, developer_name, featured_image")
          .eq("is_published", true)
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const teamMembers: TeamMember[] = teamResult.data || [];
      let projects: Project[] = projectsResult.data || [];

      // Get more projects if needed
      if (projects.length < 3) {
        const { data: moreProjects } = await supabase
          .from("presale_projects")
          .select("id, name, city, neighborhood, project_type, starting_price, price_range, completion_year, completion_month, developer_name, featured_image")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3 - projects.length);
        if (moreProjects) projects = [...projects, ...moreProjects];
      }

      // Preload team member photos
      const teamPhotos: (string | null)[] = await Promise.all(
        teamMembers.map((m) => (m.photo_url ? loadImageAsBase64(m.photo_url) : Promise.resolve(null)))
      );

      // Create PDF (landscape A4)
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();

      // ============ SLIDE 1: COVER ============
      pdf.setFillColor(...COLORS.dark);
      pdf.rect(0, 0, W, H, "F");

      // Gold accent bar top
      pdf.setFillColor(...COLORS.gold);
      pdf.rect(0, 0, W, 3, "F");

      // Brand name
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("PRESALE PROPERTIES GROUP", 20, 25);

      // Main title
      pdf.setFontSize(52);
      pdf.setTextColor(...COLORS.white);
      pdf.text("THE GUIDE TO", 20, 70);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("PRESALE HOMES", 20, 95);

      // Subtitle
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.lightGray);
      pdf.text("Metro Vancouver's New Construction Specialists", 20, 115);

      // Stats row
      const statsY = 155;
      const stats = [
        { num: "400+", label: "Homes Sold" },
        { num: "$200M+", label: "In Transactions" },
        { num: "100%", label: "New Construction" },
      ];
      stats.forEach((stat, i) => {
        const x = 20 + i * 90;
        pdf.setFontSize(36);
        pdf.setTextColor(...COLORS.gold);
        pdf.text(stat.num, x, statsY);
        pdf.setFontSize(11);
        pdf.setTextColor(...COLORS.lightGray);
        pdf.text(stat.label, x, statsY + 10);
      });

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.gray);
      pdf.text("presaleproperties.com", W - 20, H - 10, { align: "right" });

      // ============ SLIDE 2: WHY PRESALE ============
      pdf.addPage();
      pdf.setFillColor(...COLORS.offWhite);
      pdf.rect(0, 0, W, H, "F");

      // Header
      pdf.setFontSize(42);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("WHY", 20, 40);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("PRESALE?", 65, 40);

      // Benefits - visual cards
      const benefits = [
        { title: "First Access", desc: "VIP pricing before public" },
        { title: "Customize", desc: "Choose finishes & upgrades" },
        { title: "Build Equity", desc: "Appreciation during construction" },
        { title: "Low Deposits", desc: "Spread payments over time" },
      ];

      benefits.forEach((b, i) => {
        const x = 20 + (i % 2) * 145;
        const y = 60 + Math.floor(i / 2) * 55;
        
        // Card background
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(x, y, 135, 45, 4, 4, "F");
        
        // Gold left border
        pdf.setFillColor(...COLORS.gold);
        pdf.rect(x, y, 4, 45, "F");
        
        // Number badge
        pdf.setFillColor(...COLORS.gold);
        pdf.circle(x + 20, y + 22, 10, "F");
        pdf.setFontSize(16);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(String(i + 1), x + 20, y + 27, { align: "center" });
        
        // Text
        pdf.setFontSize(18);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(b.title, x + 38, y + 18);
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.gray);
        pdf.text(b.desc, x + 38, y + 32);
      });

      // Bottom tagline
      pdf.setFontSize(12);
      pdf.setTextColor(...COLORS.gray);
      pdf.text("Developer pays our fee — our services are completely free to you.", 20, H - 15);

      // ============ SLIDE 3: OUR PROCESS ============
      pdf.addPage();
      pdf.setFillColor(...COLORS.offWhite);
      pdf.rect(0, 0, W, H, "F");

      pdf.setFontSize(42);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("THE", 20, 40);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("PROCESS", 60, 40);

      const steps = [
        { num: "01", title: "Discovery Call", desc: "Understand your goals" },
        { num: "02", title: "Project Matching", desc: "Curated options for you" },
        { num: "03", title: "VIP Access", desc: "First dibs on best units" },
        { num: "04", title: "Contract Review", desc: "Full legal protection" },
        { num: "05", title: "Completion Support", desc: "We're there until keys" },
      ];

      const stepWidth = (W - 40) / 5;
      steps.forEach((step, i) => {
        const x = 20 + i * stepWidth;
        const y = 70;
        
        // Number
        pdf.setFontSize(32);
        pdf.setTextColor(...COLORS.gold);
        pdf.text(step.num, x + stepWidth / 2, y, { align: "center" });
        
        // Title
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(step.title, x + stepWidth / 2, y + 20, { align: "center" });
        
        // Desc
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.gray);
        pdf.text(step.desc, x + stepWidth / 2, y + 32, { align: "center" });
        
        // Arrow (except last)
        if (i < 4) {
          pdf.setFillColor(...COLORS.gold);
          const arrowX = x + stepWidth - 5;
          pdf.triangle(arrowX, y + 12, arrowX + 8, y + 18, arrowX, y + 24, "F");
        }
      });

      // Bottom highlight box
      pdf.setFillColor(...COLORS.gold);
      pdf.roundedRect(20, 130, W - 40, 40, 4, 4, "F");
      pdf.setFontSize(16);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("$1,500 Legal Credit Included", W / 2, 150, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("On every purchase — our way of supporting your journey", W / 2, 162, { align: "center" });

      // ============ SLIDE 4: MEET THE TEAM ============
      pdf.addPage();
      pdf.setFillColor(...COLORS.dark);
      pdf.rect(0, 0, W, H, "F");

      pdf.setFontSize(42);
      pdf.setTextColor(...COLORS.white);
      pdf.text("MEET", 20, 35);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("THE TEAM", 85, 35);

      if (teamMembers.length > 0) {
        const cardWidth = 85;
        const cardGap = 15;
        const totalWidth = teamMembers.length * cardWidth + (teamMembers.length - 1) * cardGap;
        const startX = (W - totalWidth) / 2;

        teamMembers.forEach((member, i) => {
          const x = startX + i * (cardWidth + cardGap);
          const y = 55;
          
          // Card background
          pdf.setFillColor(...COLORS.charcoal);
          pdf.roundedRect(x, y, cardWidth, 115, 4, 4, "F");
          
          // Photo circle or initials
          const photoY = y + 35;
          if (teamPhotos[i]) {
            try {
              pdf.addImage(teamPhotos[i]!, "JPEG", x + 17.5, y + 10, 50, 50);
            } catch {
              // Fallback to initials
              pdf.setFillColor(...COLORS.gold);
              pdf.circle(x + cardWidth / 2, photoY, 25, "F");
              pdf.setFontSize(20);
              pdf.setTextColor(...COLORS.dark);
              const initials = member.full_name.split(" ").map((n) => n[0]).join("");
              pdf.text(initials, x + cardWidth / 2, photoY + 7, { align: "center" });
            }
          } else {
            pdf.setFillColor(...COLORS.gold);
            pdf.circle(x + cardWidth / 2, photoY, 25, "F");
            pdf.setFontSize(20);
            pdf.setTextColor(...COLORS.dark);
            const initials = member.full_name.split(" ").map((n) => n[0]).join("");
            pdf.text(initials, x + cardWidth / 2, photoY + 7, { align: "center" });
          }
          
          // Name
          pdf.setFontSize(14);
          pdf.setTextColor(...COLORS.white);
          pdf.text(member.full_name, x + cardWidth / 2, y + 75, { align: "center" });
          
          // Title
          pdf.setFontSize(10);
          pdf.setTextColor(...COLORS.gold);
          const titleLines = pdf.splitTextToSize(member.title, cardWidth - 10);
          pdf.text(titleLines, x + cardWidth / 2, y + 88, { align: "center" });
          
          // Specialization tag
          if (member.specializations && member.specializations[0]) {
            pdf.setFillColor(...COLORS.gold);
            pdf.roundedRect(x + 10, y + 100, cardWidth - 20, 10, 2, 2, "F");
            pdf.setFontSize(8);
            pdf.setTextColor(...COLORS.dark);
            const spec = member.specializations[0].length > 18 
              ? member.specializations[0].substring(0, 16) + "..." 
              : member.specializations[0];
            pdf.text(spec, x + cardWidth / 2, y + 107, { align: "center" });
          }
        });
      } else {
        pdf.setFontSize(14);
        pdf.setTextColor(...COLORS.lightGray);
        pdf.text("Our expert team is ready to help you find your perfect presale home.", W / 2, 100, { align: "center" });
      }

      // Languages
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.lightGray);
      pdf.text("We speak: English • Hindi • Punjabi • Urdu • Arabic • Korean", W / 2, H - 15, { align: "center" });

      // ============ SLIDE 5: FEATURED PROJECTS ============
      pdf.addPage();
      pdf.setFillColor(...COLORS.offWhite);
      pdf.rect(0, 0, W, H, "F");

      pdf.setFontSize(42);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("FEATURED", 20, 40);
      pdf.setTextColor(...COLORS.gold);
      pdf.text("PROJECTS", 130, 40);

      if (projects.length > 0) {
        const projCardWidth = (W - 60) / 3;
        projects.slice(0, 3).forEach((proj, i) => {
          const x = 20 + i * (projCardWidth + 10);
          const y = 55;
          
          // Card
          pdf.setFillColor(...COLORS.white);
          pdf.roundedRect(x, y, projCardWidth, 100, 4, 4, "F");
          
          // Image placeholder
          pdf.setFillColor(...COLORS.lightGray);
          pdf.roundedRect(x + 5, y + 5, projCardWidth - 10, 45, 3, 3, "F");
          pdf.setFontSize(10);
          pdf.setTextColor(...COLORS.gray);
          pdf.text("Project Rendering", x + projCardWidth / 2, y + 30, { align: "center" });
          
          // Project name
          pdf.setFontSize(14);
          pdf.setTextColor(...COLORS.dark);
          const nameLines = pdf.splitTextToSize(proj.name, projCardWidth - 15);
          pdf.text(nameLines[0], x + 8, y + 62);
          
          // Location
          pdf.setFontSize(10);
          pdf.setTextColor(...COLORS.gold);
          pdf.text(`${proj.city}${proj.neighborhood ? ` • ${proj.neighborhood}` : ""}`, x + 8, y + 74);
          
          // Details
          pdf.setFontSize(9);
          pdf.setTextColor(...COLORS.gray);
          pdf.text(`${proj.project_type || "Mixed"} | ${formatCompletion(proj.completion_year, proj.completion_month)}`, x + 8, y + 85);
          pdf.setTextColor(...COLORS.dark);
          pdf.text(`From ${formatPrice(proj.starting_price)}`, x + 8, y + 95);
        });
      }

      // CTA
      pdf.setFillColor(...COLORS.gold);
      pdf.roundedRect(W / 2 - 60, H - 30, 120, 18, 4, 4, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("Request VIP Access", W / 2, H - 18, { align: "center" });

      // ============ SLIDE 6: CTA / CLOSE ============
      pdf.addPage();
      pdf.setFillColor(...COLORS.dark);
      pdf.rect(0, 0, W, H, "F");

      // Gold accent
      pdf.setFillColor(...COLORS.gold);
      pdf.rect(0, 0, W, 4, "F");
      pdf.rect(0, H - 4, W, 4, "F");

      // Main message
      pdf.setFontSize(48);
      pdf.setTextColor(...COLORS.white);
      pdf.text("YOUR JOURNEY STARTS", W / 2, 70, { align: "center" });
      pdf.setTextColor(...COLORS.gold);
      pdf.text("WITH THE RIGHT TEAM", W / 2, 95, { align: "center" });

      // Subtext
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.lightGray);
      pdf.text("100% New Construction • Free Expert Guidance • Multilingual Support", W / 2, 120, { align: "center" });

      // CTA button
      pdf.setFillColor(...COLORS.gold);
      pdf.roundedRect(W / 2 - 55, 140, 110, 22, 4, 4, "F");
      pdf.setFontSize(13);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("Book a Free Consultation", W / 2, 154, { align: "center" });

      // Contact
      pdf.setFontSize(12);
      pdf.setTextColor(...COLORS.white);
      pdf.text("presaleproperties.com", W / 2, H - 25, { align: "center" });

      // Save
      pdf.save("Presale-Properties-Guide.pdf");

      toast({
        title: "Presentation Downloaded!",
        description: "Your premium presentation deck is ready.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="xl"
      onClick={generatePDF}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-5 w-5" />
          Download Presentation
        </>
      )}
    </Button>
  );
}
