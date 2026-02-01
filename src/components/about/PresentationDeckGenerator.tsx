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

// Brand colors (HSL to RGB conversion for PDF)
const COLORS = {
  primary: [255, 182, 0] as [number, number, number], // Gold #FFB600
  dark: [28, 33, 32] as [number, number, number], // #1C2120
  lightBg: [255, 253, 249] as [number, number, number], // #FFFDF9
  muted: [100, 116, 139] as [number, number, number], // Muted gray
  white: [255, 255, 255] as [number, number, number],
};

const formatPrice = (price: number | null): string => {
  if (!price) return "TBD";
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const formatCompletionDate = (year: number | null, month: number | null): string => {
  if (!year) return "TBD";
  if (month) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[month - 1]} ${year}`;
  }
  return String(year);
};

export function PresentationDeckGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch 5 featured projects
      const { data: projects, error } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, project_type, starting_price, price_range, completion_year, completion_month, developer_name, featured_image")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // If not enough featured projects, get recent ones
      let finalProjects: Project[] = projects || [];
      if (finalProjects.length < 5) {
        const { data: moreProjects } = await supabase
          .from("presale_projects")
          .select("id, name, city, neighborhood, project_type, starting_price, price_range, completion_year, completion_month, developer_name, featured_image")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5 - finalProjects.length);
        
        if (moreProjects) {
          finalProjects = [...finalProjects, ...moreProjects];
        }
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Helper function to add page header
      const addPageHeader = (title: string) => {
        // Gold accent bar
        pdf.setFillColor(...COLORS.primary);
        pdf.rect(0, 0, pageWidth, 8, "F");
        
        // Header text
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.white);
        pdf.text("PRESALE PROPERTIES GROUP", 15, 5.5);
        
        // Page title
        pdf.setFontSize(24);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(title, 15, 25);
        
        // Underline
        pdf.setDrawColor(...COLORS.primary);
        pdf.setLineWidth(1);
        pdf.line(15, 28, 80, 28);
      };

      // ========== SLIDE 1: Cover ==========
      // Background
      pdf.setFillColor(...COLORS.dark);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Gold accent bar
      pdf.setFillColor(...COLORS.primary);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, "F");
      
      // Logo/Title
      pdf.setFontSize(42);
      pdf.setTextColor(...COLORS.white);
      pdf.text("PRESALE PROPERTIES GROUP", pageWidth / 2, 60, { align: "center" });
      
      // Tagline
      pdf.setFontSize(18);
      pdf.setTextColor(...COLORS.primary);
      pdf.text("Vancouver's New Construction Specialists", pageWidth / 2, 75, { align: "center" });
      
      // Subtitle
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.white);
      pdf.text("100% New Construction Only — No Resale", pageWidth / 2, 90, { align: "center" });
      
      // Stats bar
      const statsY = 120;
      pdf.setFontSize(28);
      pdf.setTextColor(...COLORS.primary);
      pdf.text("400+", pageWidth / 4, statsY, { align: "center" });
      pdf.text("$200M+", pageWidth / 2, statsY, { align: "center" });
      pdf.text("5+", (pageWidth / 4) * 3, statsY, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.white);
      pdf.text("Homes Sold", pageWidth / 4, statsY + 8, { align: "center" });
      pdf.text("In Sales", pageWidth / 2, statsY + 8, { align: "center" });
      pdf.text("Years Experience", (pageWidth / 4) * 3, statsY + 8, { align: "center" });
      
      // Footer text
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("presaleproperties.com", pageWidth / 2, pageHeight - 5, { align: "center" });

      // ========== SLIDE 2: Who We Are ==========
      pdf.addPage();
      pdf.setFillColor(...COLORS.lightBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      addPageHeader("Who We Are");
      
      pdf.setFontSize(12);
      pdf.setTextColor(...COLORS.dark);
      const whoWeAreText = [
        "Presale Properties Group is a team of licensed REALTORS® focused 100% on new",
        "construction homes in Metro Vancouver. With over 400+ new construction homes sold",
        "and more than $200 million in transactions, we bring deep expertise and dedication",
        "to every client we serve.",
      ];
      whoWeAreText.forEach((line, i) => {
        pdf.text(line, 15, 45 + (i * 7));
      });
      
      // Highlights grid
      const highlights = [
        { title: "100% New Construction", desc: "We focus exclusively on presale and move-in ready homes" },
        { title: "80%+ New Construction", desc: "Condos, townhomes, and single-family homes" },
        { title: "Multilingual Service", desc: "English, Hindi, Punjabi, Urdu, Arabic, Korean & more" },
        { title: "Culturally Aware", desc: "Understanding the needs of first-generation homebuyers" },
      ];
      
      highlights.forEach((item, i) => {
        const x = 15 + (i % 2) * 140;
        const y = 85 + Math.floor(i / 2) * 45;
        
        // Card background
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(x, y, 130, 38, 3, 3, "F");
        
        // Gold accent
        pdf.setFillColor(...COLORS.primary);
        pdf.rect(x, y, 4, 38, "F");
        
        pdf.setFontSize(14);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(item.title, x + 10, y + 12);
        
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.muted);
        pdf.text(item.desc, x + 10, y + 24);
      });

      // ========== SLIDE 3: What We Do Differently ==========
      pdf.addPage();
      pdf.setFillColor(...COLORS.lightBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      addPageHeader("What We Do Differently");
      
      const differentiators = [
        { title: "True Specialist Focus", desc: "Most agents are generalists — we are 100% new construction specialists" },
        { title: "Full Buyer Representation", desc: "Negotiating credits, deposit structures, contract review, assignment clauses" },
        { title: "Zero Cost to You", desc: "Commissions are paid by developers — our services are completely free to buyers" },
        { title: "VIP Access & Pricing", desc: "Direct developer relationships mean first access and exclusive incentives" },
        { title: "Post-Sale Support", desc: "We support you through completion, deficiencies, and beyond" },
        { title: "Legal Credit Included", desc: "$1,500 credit toward your legal fees on every purchase" },
      ];
      
      differentiators.forEach((item, i) => {
        const x = 15 + (i % 2) * 140;
        const y = 40 + Math.floor(i / 2) * 40;
        
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(x, y, 130, 35, 3, 3, "F");
        
        pdf.setFillColor(...COLORS.primary);
        pdf.circle(x + 8, y + 10, 4, "F");
        
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(item.title, x + 18, y + 12);
        
        pdf.setFontSize(9);
        pdf.setTextColor(...COLORS.muted);
        const lines = pdf.splitTextToSize(item.desc, 105);
        pdf.text(lines, x + 18, y + 22);
      });

      // ========== SLIDE 4: Meet The Team ==========
      pdf.addPage();
      pdf.setFillColor(...COLORS.lightBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      addPageHeader("Meet The Team");
      
      const team = [
        { name: "Sunny Parmar", title: "Founder & Lead Advisor", desc: "Expert in negotiation, deal structuring, and investor strategy" },
        { name: "Priya Sharma", title: "First-Time Buyer Specialist", desc: "Focused on education, contract clarity, and emotional support" },
        { name: "Kevin Lee", title: "Investor Relations & Leasing", desc: "Handles assignments, tenant placement, and legal coordination" },
      ];
      
      team.forEach((member, i) => {
        const x = 15 + (i * 95);
        const y = 45;
        
        // Card
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(x, y, 88, 100, 3, 3, "F");
        
        // Avatar placeholder
        pdf.setFillColor(...COLORS.primary);
        pdf.circle(x + 44, y + 25, 18, "F");
        
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.white);
        pdf.text(member.name.split(" ").map(n => n[0]).join(""), x + 44, y + 28, { align: "center" });
        
        // Name
        pdf.setFontSize(14);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(member.name, x + 44, y + 55, { align: "center" });
        
        // Title
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.primary);
        pdf.text(member.title, x + 44, y + 63, { align: "center" });
        
        // Bio
        pdf.setFontSize(9);
        pdf.setTextColor(...COLORS.muted);
        const bioLines = pdf.splitTextToSize(member.desc, 75);
        pdf.text(bioLines, x + 44, y + 75, { align: "center" });
      });

      // ========== SLIDE 5: Client Impact ==========
      pdf.addPage();
      pdf.setFillColor(...COLORS.lightBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      addPageHeader("Client Impact & Success");
      
      // Stats
      const impactStats = [
        { stat: "$20K–$30K+", label: "Average Incentives Negotiated" },
        { stat: "400+", label: "Presale Homes Sold" },
        { stat: "$1,500", label: "Legal Credit for Buyers" },
        { stat: "5+ Years", label: "Dedicated Presale Experience" },
      ];
      
      impactStats.forEach((item, i) => {
        const x = 15 + (i * 70);
        
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(x, 40, 65, 50, 3, 3, "F");
        
        pdf.setFontSize(18);
        pdf.setTextColor(...COLORS.primary);
        pdf.text(item.stat, x + 32.5, 60, { align: "center" });
        
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.muted);
        const labelLines = pdf.splitTextToSize(item.label, 55);
        pdf.text(labelLines, x + 32.5, 72, { align: "center" });
      });
      
      // Case studies
      pdf.setFontSize(12);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("Success Stories", 15, 105);
      
      pdf.setFillColor(...COLORS.white);
      pdf.roundedRect(15, 110, 130, 55, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("First-Time Buyer Success", 22, 122);
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.muted);
      const ftbText = pdf.splitTextToSize("Helping buyers negotiate better terms, reduce deposits by up to 5%, and gain confidence in making one of the biggest decisions of their lives.", 115);
      pdf.text(ftbText, 22, 132);
      
      pdf.setFillColor(...COLORS.white);
      pdf.roundedRect(150, 110, 130, 55, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("Investor Portfolio Growth", 157, 122);
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.muted);
      const invText = pdf.splitTextToSize("Helping investors scale portfolios with strategic presale purchases, tenant placement, and assignment expertise.", 115);
      pdf.text(invText, 157, 132);

      // ========== SLIDES 6-10: Featured Projects ==========
      finalProjects.forEach((project, index) => {
        pdf.addPage();
        pdf.setFillColor(...COLORS.lightBg);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        addPageHeader(`Featured Project ${index + 1}`);
        
        // Project card
        pdf.setFillColor(...COLORS.white);
        pdf.roundedRect(15, 35, pageWidth - 30, 120, 5, 5, "F");
        
        // Image placeholder
        pdf.setFillColor(...COLORS.muted);
        pdf.roundedRect(25, 45, 100, 70, 3, 3, "F");
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.white);
        pdf.text("Project Image", 75, 82, { align: "center" });
        
        // Project details
        pdf.setFontSize(22);
        pdf.setTextColor(...COLORS.dark);
        pdf.text(project.name, 135, 55);
        
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.primary);
        pdf.text(`${project.city}${project.neighborhood ? ` • ${project.neighborhood}` : ""}`, 135, 65);
        
        // Details grid
        const details = [
          { label: "Property Type", value: project.project_type || "TBD" },
          { label: "Price Range", value: project.price_range || (project.starting_price ? `From ${formatPrice(project.starting_price)}` : "Contact Us") },
          { label: "Completion", value: formatCompletionDate(project.completion_year, project.completion_month) },
          { label: "Developer", value: project.developer_name || "TBD" },
        ];
        
        details.forEach((detail, i) => {
          const x = 135 + (i % 2) * 75;
          const y = 80 + Math.floor(i / 2) * 25;
          
          pdf.setFontSize(9);
          pdf.setTextColor(...COLORS.muted);
          pdf.text(detail.label, x, y);
          
          pdf.setFontSize(11);
          pdf.setTextColor(...COLORS.dark);
          pdf.text(String(detail.value), x, y + 8);
        });
        
        // CTA
        pdf.setFillColor(...COLORS.primary);
        pdf.roundedRect(25, 125, 100, 20, 3, 3, "F");
        pdf.setFontSize(11);
        pdf.setTextColor(...COLORS.dark);
        pdf.text("Contact Us for VIP Access", 75, 138, { align: "center" });
      });

      // ========== FINAL SLIDE: Contact CTA ==========
      pdf.addPage();
      pdf.setFillColor(...COLORS.dark);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Gold accent
      pdf.setFillColor(...COLORS.primary);
      pdf.rect(0, 0, pageWidth, 8, "F");
      
      // Main heading
      pdf.setFontSize(36);
      pdf.setTextColor(...COLORS.white);
      pdf.text("Your Journey Starts", pageWidth / 2, 55, { align: "center" });
      pdf.text("With the Right Team", pageWidth / 2, 70, { align: "center" });
      
      // Subheading
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.muted);
      pdf.text("Let us help you find your next home or investment", pageWidth / 2, 90, { align: "center" });
      pdf.text("— fully protected, fully guided, fully free.", pageWidth / 2, 100, { align: "center" });
      
      // CTA button
      pdf.setFillColor(...COLORS.primary);
      pdf.roundedRect(pageWidth / 2 - 50, 115, 100, 18, 3, 3, "F");
      pdf.setFontSize(12);
      pdf.setTextColor(...COLORS.dark);
      pdf.text("Book a Free Consultation", pageWidth / 2, 127, { align: "center" });
      
      // Contact info
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.white);
      pdf.text("presaleproperties.com", pageWidth / 2, 155, { align: "center" });
      
      // Trust badges
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.muted);
      pdf.text("✓ 100% New Construction    ✓ Free Buyer Representation    ✓ Multilingual Support", pageWidth / 2, 175, { align: "center" });

      // Save PDF
      pdf.save("About-Presale-Properties-Group.pdf");
      
      toast({
        title: "Presentation Downloaded!",
        description: "Your presentation deck has been saved as a PDF.",
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
