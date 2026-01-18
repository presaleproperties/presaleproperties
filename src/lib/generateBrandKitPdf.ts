import jsPDF from "jspdf";

// Brand colors in RGB
const BRAND_COLORS = {
  primary: { hex: "#FFB600", rgb: [255, 182, 0] as [number, number, number], hsl: "43 96% 56%" },
  primaryGlow: { hex: "#F59E0B", rgb: [245, 158, 11] as [number, number, number], hsl: "38 92% 50%" },
  primaryDeep: { hex: "#D97706", rgb: [217, 119, 6] as [number, number, number], hsl: "35 90% 45%" },
  foreground: { hex: "#1C2120", rgb: [28, 33, 32] as [number, number, number], hsl: "220 25% 8%" },
  background: { hex: "#FFFDF9", rgb: [255, 253, 249] as [number, number, number], hsl: "40 20% 99%" },
  muted: { hex: "#F3F4F6", rgb: [243, 244, 246] as [number, number, number], hsl: "220 14% 96%" },
  border: { hex: "#E5E7EB", rgb: [229, 231, 235] as [number, number, number], hsl: "220 13% 90%" },
  success: { hex: "#16A34A", rgb: [22, 163, 74] as [number, number, number], hsl: "142 76% 36%" },
  info: { hex: "#0EA5E9", rgb: [14, 165, 233] as [number, number, number], hsl: "199 89% 48%" },
  destructive: { hex: "#EF4444", rgb: [239, 68, 68] as [number, number, number], hsl: "0 84% 60%" },
};

export function generateBrandKitPdf(): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // ========== COVER PAGE ==========
  // Gold gradient header
  doc.setFillColor(...BRAND_COLORS.primary.rgb);
  doc.rect(0, 0, pageWidth, 80, "F");
  
  // Dark strip
  doc.setFillColor(...BRAND_COLORS.foreground.rgb);
  doc.rect(0, 80, pageWidth, 8, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("presale", 20, 45);
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.text("properties.", 88, 45);
  
  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Brand Identity Guidelines", 20, 60);

  yPos = 110;

  // Intro section
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Brand Kit", 20, yPos);
  yPos += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const introText = "This document outlines the core brand elements for Presale Properties, Vancouver's leading new construction specialists. Use these guidelines to maintain brand consistency across all materials.";
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 40);
  doc.text(splitIntro, 20, yPos);
  yPos += 35;

  // Brand positioning box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 45, 4, 4, "F");
  doc.setDrawColor(...BRAND_COLORS.primary.rgb);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPos, pageWidth - 40, 45, 4, 4, "S");

  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Brand Positioning", 28, yPos + 12);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("\"Vancouver's New Construction Specialists\"", 28, yPos + 24);
  doc.setTextColor(100, 100, 100);
  doc.text("100% new construction only – No resale. Every property is never lived in.", 28, yPos + 36);

  yPos += 65;

  // Table of contents
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Contents", 20, yPos);
  yPos += 12;

  const contents = [
    "1. Color Palette",
    "2. Typography",
    "3. Logo Usage",
    "4. UI Components",
    "5. Brand Voice",
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  contents.forEach((item, i) => {
    doc.text(item, 28, yPos + (i * 8));
  });

  // Footer
  addFooter(doc, 1);

  // ========== PAGE 2: COLOR PALETTE ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("01", 20, yPos);
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(22);
  doc.text("Color Palette", 35, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Our premium color palette features rich gold accents with refined neutrals.", 20, yPos);
  yPos += 15;

  // Primary Colors
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Primary Brand Colors", 20, yPos);
  yPos += 12;

  const primaryColors = [
    { name: "Primary Gold", color: BRAND_COLORS.primary, usage: "Main accent, CTAs, highlights" },
    { name: "Primary Glow", color: BRAND_COLORS.primaryGlow, usage: "Gradients, hover states" },
    { name: "Primary Deep", color: BRAND_COLORS.primaryDeep, usage: "Active states, depth" },
  ];

  primaryColors.forEach((colorInfo, i) => {
    const x = 20 + (i * 58);
    drawColorSwatch(doc, x, yPos, colorInfo.name, colorInfo.color, colorInfo.usage);
  });

  yPos += 55;

  // Neutral Colors
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Neutral Colors", 20, yPos);
  yPos += 12;

  const neutralColors = [
    { name: "Foreground", color: BRAND_COLORS.foreground, usage: "Primary text, headings" },
    { name: "Background", color: BRAND_COLORS.background, usage: "Page backgrounds" },
    { name: "Muted", color: BRAND_COLORS.muted, usage: "Secondary surfaces" },
    { name: "Border", color: BRAND_COLORS.border, usage: "Dividers, borders" },
  ];

  neutralColors.forEach((colorInfo, i) => {
    const x = 20 + ((i % 4) * 45);
    drawColorSwatchSmall(doc, x, yPos, colorInfo.name, colorInfo.color);
  });

  yPos += 50;

  // Semantic Colors
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Semantic Colors", 20, yPos);
  yPos += 12;

  const semanticColors = [
    { name: "Success", color: BRAND_COLORS.success, usage: "Positive states" },
    { name: "Info", color: BRAND_COLORS.info, usage: "Information" },
    { name: "Destructive", color: BRAND_COLORS.destructive, usage: "Errors, warnings" },
  ];

  semanticColors.forEach((colorInfo, i) => {
    const x = 20 + (i * 58);
    drawColorSwatch(doc, x, yPos, colorInfo.name, colorInfo.color, colorInfo.usage);
  });

  yPos += 60;

  // Gradient Examples
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Brand Gradients", 20, yPos);
  yPos += 12;

  // Gold gradient simulation
  doc.setFillColor(...BRAND_COLORS.primary.rgb);
  doc.roundedRect(20, yPos, 80, 25, 3, 3, "F");
  doc.setFillColor(...BRAND_COLORS.primaryDeep.rgb);
  doc.roundedRect(60, yPos, 40, 25, 0, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("gradient-gold", 25, yPos + 15);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("135deg, Primary → Primary Deep", 20, yPos + 35);

  addFooter(doc, 2);

  // ========== PAGE 3: TYPOGRAPHY ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("02", 20, yPos);
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(22);
  doc.text("Typography", 35, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("We use Plus Jakarta Sans for its modern, professional appearance.", 20, yPos);
  yPos += 20;

  // Primary Typeface
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 60, 4, 4, "F");

  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Primary Typeface", 28, yPos + 12);

  doc.setFontSize(28);
  doc.text("Plus Jakarta Sans", 28, yPos + 35);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Fallback: system-ui, sans-serif", 28, yPos + 48);

  yPos += 75;

  // Font weights
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Font Weights", 20, yPos);
  yPos += 12;

  const weights = [
    { weight: "400 Regular", sample: "Body text, descriptions" },
    { weight: "500 Medium", sample: "Labels, captions" },
    { weight: "600 SemiBold", sample: "Buttons, subheadings" },
    { weight: "700 Bold", sample: "Headlines, CTAs" },
    { weight: "800 ExtraBold", sample: "Hero headlines" },
  ];

  weights.forEach((w, i) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", i >= 3 ? "bold" : "normal");
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(w.weight, 28, yPos + (i * 10));
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(w.sample, 90, yPos + (i * 10));
  });

  yPos += 65;

  // Type scale
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Type Scale", 20, yPos);
  yPos += 12;

  const typeScale = [
    { size: "36px", name: "Hero", usage: "Main headlines" },
    { size: "24px", name: "H1", usage: "Page titles" },
    { size: "20px", name: "H2", usage: "Section headers" },
    { size: "16px", name: "H3", usage: "Card titles" },
    { size: "14px", name: "Body", usage: "Main content" },
    { size: "12px", name: "Small", usage: "Captions, labels" },
  ];

  typeScale.forEach((type, i) => {
    const y = yPos + (i * 10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.primary.rgb);
    doc.text(type.size, 28, y);
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(type.name, 55, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(type.usage, 85, y);
  });

  yPos += 75;

  // Letter spacing
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Letter Spacing", 20, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Premium: -0.025em (headlines)", 28, yPos);
  doc.text("Tightest: -0.04em (large display text)", 28, yPos + 10);

  addFooter(doc, 3);

  // ========== PAGE 4: LOGO USAGE ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("03", 20, yPos);
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(22);
  doc.text("Logo Usage", 35, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("The Presale Properties logo consists of two elements: the wordmark and the accent.", 20, yPos);
  yPos += 20;

  // Primary logo
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 50, 4, 4, "F");

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("presale", 35, yPos + 30);
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.text("properties", 88, yPos + 30);
  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.text(".", 155, yPos + 30);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Primary Logo - Full color on light backgrounds", 35, yPos + 42);

  yPos += 65;

  // Logo elements
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Logo Elements", 20, yPos);
  yPos += 12;

  const elements = [
    { element: "\"presale\"", color: "Primary Gold (#FFB600)", desc: "First part of wordmark" },
    { element: "\"properties\"", color: "Foreground (#1C2120)", desc: "Second part of wordmark" },
    { element: "\".\" (period)", color: "Primary Gold (#FFB600)", desc: "Brand accent mark" },
  ];

  elements.forEach((el, i) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(el.element, 28, yPos + (i * 12));
    doc.setFont("helvetica", "normal");
    doc.text(el.color, 70, yPos + (i * 12));
    doc.setTextColor(100, 100, 100);
    doc.text(el.desc, 130, yPos + (i * 12));
  });

  yPos += 50;

  // Clear space
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Clear Space", 20, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const clearSpaceText = "Maintain clear space around the logo equal to the height of the 'p' character. This ensures the logo remains legible and prominent in all applications.";
  const splitClear = doc.splitTextToSize(clearSpaceText, pageWidth - 50);
  doc.text(splitClear, 28, yPos);

  yPos += 30;

  // Minimum size
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Minimum Size", 20, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Print: 30mm width minimum", 28, yPos);
  doc.text("Digital: 120px width minimum", 28, yPos + 10);

  yPos += 30;

  // Don'ts
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Logo Don'ts", 20, yPos);
  yPos += 12;

  const donts = [
    "Do not stretch or distort the logo",
    "Do not change the logo colors",
    "Do not add effects (shadows, outlines)",
    "Do not place on busy backgrounds",
    "Do not rearrange logo elements",
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND_COLORS.destructive.rgb);
  donts.forEach((d, i) => {
    doc.text("✕ " + d, 28, yPos + (i * 8));
  });

  addFooter(doc, 4);

  // ========== PAGE 5: UI COMPONENTS ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("04", 20, yPos);
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(22);
  doc.text("UI Components", 35, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Key UI patterns and component specifications.", 20, yPos);
  yPos += 20;

  // Border radius
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Border Radius", 20, yPos);
  yPos += 12;

  // Radius examples
  const radii = [
    { radius: "4px", name: "Small", usage: "Badges, small buttons" },
    { radius: "8px", name: "Medium", usage: "Inputs, cards" },
    { radius: "12px", name: "Default", usage: "Cards, modals" },
    { radius: "16px", name: "Large", usage: "Hero sections" },
  ];

  radii.forEach((r, i) => {
    const x = 28 + (i * 42);
    doc.setFillColor(...BRAND_COLORS.muted.rgb);
    doc.roundedRect(x, yPos, 35, 25, parseInt(r.radius) / 4, parseInt(r.radius) / 4, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(r.radius, x + 10, yPos + 35);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(r.name, x + 10, yPos + 42);
  });

  yPos += 55;

  // Shadows
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Shadow System", 20, yPos);
  yPos += 12;

  const shadows = [
    { name: "shadow-xs", desc: "Subtle depth for small elements" },
    { name: "shadow-card", desc: "Default card elevation" },
    { name: "shadow-card-hover", desc: "Interactive hover state" },
    { name: "shadow-gold-glow", desc: "Primary CTA emphasis" },
    { name: "shadow-premium", desc: "Hero/modal elevation" },
  ];

  shadows.forEach((s, i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(s.name, 28, yPos + (i * 10));
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(s.desc, 80, yPos + (i * 10));
  });

  yPos += 65;

  // Button styles
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Button Styles", 20, yPos);
  yPos += 12;

  // Primary button
  doc.setFillColor(...BRAND_COLORS.primary.rgb);
  doc.roundedRect(28, yPos, 70, 24, 3, 3, "F");
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Primary Button", 40, yPos + 15);

  // Secondary button
  doc.setFillColor(...BRAND_COLORS.foreground.rgb);
  doc.roundedRect(105, yPos, 70, 24, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Secondary", 125, yPos + 15);

  yPos += 35;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Primary: Gold background, dark text - Use for main CTAs", 28, yPos);
  doc.text("Secondary: Dark background, white text - Use for supporting actions", 28, yPos + 10);

  yPos += 30;

  // Animations
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Animation Tokens", 20, yPos);
  yPos += 12;

  const animations = [
    { name: "fade-in-up", timing: "0.6s ease-out", usage: "Page elements" },
    { name: "scale-in", timing: "0.3s ease-out", usage: "Modals, overlays" },
    { name: "glow-pulse", timing: "3s infinite", usage: "Attention CTAs" },
    { name: "shimmer", timing: "2s infinite", usage: "Loading states" },
    { name: "float", timing: "3s infinite", usage: "Subtle emphasis" },
  ];

  animations.forEach((a, i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(a.name, 28, yPos + (i * 10));
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(a.timing, 70, yPos + (i * 10));
    doc.text(a.usage, 115, yPos + (i * 10));
  });

  addFooter(doc, 5);

  // ========== PAGE 6: BRAND VOICE ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(...BRAND_COLORS.primary.rgb);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("05", 20, yPos);
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(22);
  doc.text("Brand Voice", 35, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("How we communicate with our audience.", 20, yPos);
  yPos += 20;

  // Tone attributes
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tone Attributes", 20, yPos);
  yPos += 12;

  const toneAttributes = [
    { attr: "Professional", desc: "We are experts in new construction real estate" },
    { attr: "Trustworthy", desc: "Data-driven insights, verified information" },
    { attr: "Approachable", desc: "Complex topics made accessible" },
    { attr: "Premium", desc: "High-quality service and presentation" },
    { attr: "Authoritative", desc: "Market specialists with deep knowledge" },
  ];

  toneAttributes.forEach((t, i) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLORS.primary.rgb);
    doc.text("•", 28, yPos + (i * 12));
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(t.attr, 35, yPos + (i * 12));
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(t.desc, 80, yPos + (i * 12));
  });

  yPos += 75;

  // Key phrases
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Key Brand Phrases", 20, yPos);
  yPos += 12;

  const phrases = [
    "\"Vancouver's New Construction Specialists\"",
    "\"100% new construction only – No resale\"",
    "\"Never lived in. Warranty included.\"",
    "\"VIP pricing and first access\"",
    "\"Direct developer relationships\"",
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  phrases.forEach((p, i) => {
    doc.setTextColor(...BRAND_COLORS.foreground.rgb);
    doc.text(p, 28, yPos + (i * 10));
  });

  yPos += 65;

  // Writing guidelines
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Writing Guidelines", 20, yPos);
  yPos += 12;

  const guidelines = [
    "Use active voice and clear, direct language",
    "Lead with benefits, not features",
    "Include specific data points when possible",
    "Avoid jargon; explain complex terms",
    "Maintain consistency in terminology",
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  guidelines.forEach((g, i) => {
    doc.setTextColor(...BRAND_COLORS.success.rgb);
    doc.text("✓", 28, yPos + (i * 10));
    doc.setTextColor(100, 100, 100);
    doc.text(g, 38, yPos + (i * 10));
  });

  yPos += 65;

  // Contact info box
  doc.setFillColor(...BRAND_COLORS.primary.rgb);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 4, 4, "F");

  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Questions about brand usage?", 28, yPos + 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Contact: info@presaleproperties.com", 28, yPos + 26);
  doc.text("presaleproperties.com", pageWidth - 28, yPos + 26, { align: "right" });

  addFooter(doc, 6);

  // Save
  doc.save("presale-properties-brand-kit.pdf");
}

function drawColorSwatch(
  doc: jsPDF,
  x: number,
  y: number,
  name: string,
  color: { hex: string; rgb: [number, number, number]; hsl: string },
  usage: string
) {
  doc.setFillColor(...color.rgb);
  doc.roundedRect(x, y, 52, 35, 3, 3, "F");
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(name, x, y + 43);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(color.hex, x, y + 50);
}

function drawColorSwatchSmall(
  doc: jsPDF,
  x: number,
  y: number,
  name: string,
  color: { hex: string; rgb: [number, number, number]; hsl: string }
) {
  doc.setFillColor(...color.rgb);
  if (name === "Background") {
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(x, y, 38, 25, 2, 2, "FD");
  } else {
    doc.roundedRect(x, y, 38, 25, 2, 2, "F");
  }
  
  doc.setTextColor(...BRAND_COLORS.foreground.rgb);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(name, x, y + 32);
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(color.hex, x, y + 38);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Presale Properties Brand Kit", 20, pageHeight - 12);
  doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 12, { align: "right" });
  
  // Gold line
  doc.setDrawColor(...BRAND_COLORS.primary.rgb);
  doc.setLineWidth(1);
  doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);
}
