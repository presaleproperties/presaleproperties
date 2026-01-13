/**
 * SEO FAQ Generator for Presale Projects
 * Generates dynamic, contextual FAQs based on project data
 */

export interface ProjectFAQData {
  name: string;
  city: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  startingPrice: number | null;
  depositStructure: string | null;
  strataFees: string | null;
  assignmentFees: string | null;
  completionYear: number | null;
  completionMonth: number | null;
  developerName: string | null;
  amenities: string[] | null;
  highlights: string[] | null;
  incentives: string | null;
}

export interface FAQItem {
  question: string;
  answer: string;
}

const getProjectTypeLabel = (type: string): string => {
  switch (type) {
    case "condo": return "condos";
    case "townhome": return "townhomes";
    case "mixed": return "residences";
    case "duplex": return "duplexes";
    case "single_family": return "single-family homes";
    default: return "homes";
  }
};

const getMonthName = (month: number): string => {
  return new Date(2000, month - 1).toLocaleString("default", { month: "long" });
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Generate comprehensive FAQs for a presale project
 * Returns 10 SEO-optimized FAQs tailored to the project data
 */
export function generateProjectFAQs(data: ProjectFAQData): FAQItem[] {
  const typeLabel = getProjectTypeLabel(data.projectType);
  const typeSingular = data.projectType === "condo" ? "condo" : 
                       data.projectType === "townhome" ? "townhome" : "home";
  
  const completionDate = data.completionYear 
    ? (data.completionMonth 
        ? `${getMonthName(data.completionMonth)} ${data.completionYear}` 
        : `${data.completionYear}`)
    : "TBA";

  const faqs: FAQItem[] = [];

  // FAQ 1: Deposit Structure
  faqs.push({
    question: `What is the deposit structure for ${data.name}?`,
    answer: data.depositStructure 
      ? `${data.name} requires a deposit of ${data.depositStructure}. The exact payment schedule will be outlined in your purchase agreement. Contact us for detailed deposit timing and requirements.`
      : `${data.name} offers flexible deposit structures typical for BC presales. Most presale projects require a total deposit of 15-20%, paid in installments during construction. Contact us for the specific deposit schedule for ${data.name}.`
  });

  // FAQ 2: Completion Date
  faqs.push({
    question: `When is the estimated completion date for ${data.name}?`,
    answer: data.completionYear 
      ? `${data.name} is scheduled for completion in ${completionDate}. Please note that completion dates are estimates and subject to change based on construction progress. We'll keep you updated on any timeline adjustments.`
      : `The completion date for ${data.name} is to be announced. Presale projects in ${data.neighborhood} typically complete within 2-4 years of sales launch. Register now to receive updates on the construction timeline.`
  });

  // FAQ 3: Rental Restrictions
  faqs.push({
    question: `Can I rent out my ${typeSingular} at ${data.name} after completion?`,
    answer: `Rental policies at ${data.name} will be detailed in the strata bylaws. Most presale ${typeLabel} in ${data.city} allow rentals, making them excellent investment properties. We recommend reviewing the disclosure statement for specific rental restrictions. Contact us to confirm the rental policy for ${data.name}.`
  });

  // FAQ 4: Assignment
  faqs.push({
    question: `Is assignment allowed before completion at ${data.name}?`,
    answer: data.assignmentFees 
      ? `Assignment at ${data.name} is ${data.assignmentFees}. This provides flexibility if your circumstances change before completion. Assignment terms will be detailed in your purchase contract.`
      : `Assignment policies vary by developer. Most presale ${typeLabel} in ${data.neighborhood} allow assignment subject to developer approval and fees. Contact us to confirm the assignment policy and any associated costs for ${data.name}.`
  });

  // FAQ 5: Strata Fees
  faqs.push({
    question: `What are the estimated monthly strata fees at ${data.name}?`,
    answer: data.strataFees 
      ? `Estimated strata fees at ${data.name} are approximately ${data.strataFees}. This typically covers building insurance, maintenance of common areas, and amenities. Final fees will be confirmed closer to completion.`
      : `Strata fee estimates for ${data.name} will be available in the disclosure statement. For ${typeLabel} in ${data.neighborhood}, typical strata fees range from $0.35-$0.55 per square foot per month. Contact us for the specific estimate.`
  });

  // FAQ 6: Finishes
  const amenitiesText = data.amenities && data.amenities.length > 0 
    ? `Building amenities include ${data.amenities.slice(0, 4).join(", ")}.`
    : `Modern amenities and thoughtfully designed common spaces are included.`;
  
  faqs.push({
    question: `What appliances and finishes are included at ${data.name}?`,
    answer: `${data.name} includes high-quality finishes typical of new ${typeLabel} in ${data.neighborhood}. Expect stainless steel appliances, quartz countertops, and contemporary flooring. ${amenitiesText} A detailed finishing schedule is available in the disclosure package.`
  });

  // FAQ 7: Developer
  faqs.push({
    question: `Who is the developer of ${data.name} and what is their track record?`,
    answer: data.developerName 
      ? `${data.name} is developed by ${data.developerName}, an established developer with experience in Metro Vancouver's real estate market. ${data.developerName} is known for delivering quality ${typeLabel} on schedule. Contact us to learn more about their past projects and reputation.`
      : `${data.name} is being developed by an experienced team with a track record in the ${data.city} market. We can provide details on the developer's past projects and reputation upon request.`
  });

  // FAQ 8: Schools
  faqs.push({
    question: `What schools are near ${data.name}?`,
    answer: `${data.neighborhood} in ${data.city} is served by quality public and private schools. The area has well-rated elementary and secondary schools within walking or short driving distance. Contact us for a detailed breakdown of nearby schools, including ratings and distances from ${data.name}.`
  });

  // FAQ 9: Transit & Walkability
  faqs.push({
    question: `How is the transit access and walkability at ${data.name}?`,
    answer: `${data.name} is located in ${data.neighborhood}, ${data.city}, with access to transit and local amenities. ${data.city === "Surrey" || data.city === "Burnaby" || data.city === "Coquitlam" || data.city === "Vancouver" || data.city === "Richmond" ? "SkyTrain and major bus routes are accessible from the area." : "Bus routes and major highways are accessible from the area."} Parks, shops, and restaurants are nearby. Contact us for specific Walk Score and Transit Score details.`
  });

  // FAQ 10: Why Presale
  const incentivesText = data.incentives 
    ? ` Current incentives include: ${data.incentives}.`
    : "";
  
  const priceText = data.startingPrice 
    ? ` Starting from ${formatPrice(data.startingPrice)}, ${data.name} offers excellent value for new construction.`
    : "";

  faqs.push({
    question: `Why should I buy presale at ${data.name} instead of a resale property?`,
    answer: `Buying presale at ${data.name} offers several advantages: brand new construction with full warranty, opportunity to customize finishes, lower initial investment with deposit structure, potential appreciation during construction, GST rebate eligibility, and modern building standards with energy efficiency.${incentivesText}${priceText} ${data.neighborhood} is ${data.city === "Langley" || data.city === "Surrey" ? "one of the fastest-growing areas in Metro Vancouver" : "a sought-after location in Metro Vancouver"}.`
  });

  return faqs;
}

/**
 * Generate FAQPage structured data for SEO
 */
export function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate optimized SEO title for project pages
 * Pattern: [Project Name] [Location] - Presale [Type] from $[Price] | [Feature]
 * Target: Under 60 characters
 */
export function generateSEOTitle(data: {
  name: string;
  neighborhood: string;
  city: string;
  projectType: string;
  startingPrice: number | null;
  developerName: string | null;
  unitMix: string | null;
}): string {
  const typeLabel = data.projectType === "condo" ? "Condos" : 
                    data.projectType === "townhome" ? "Townhomes" : 
                    data.projectType === "mixed" ? "Homes" :
                    data.projectType === "duplex" ? "Duplexes" : "Homes";

  // Format price compactly
  const priceCompact = data.startingPrice 
    ? data.startingPrice >= 1000000 
      ? `$${(data.startingPrice / 1000000).toFixed(1)}M`.replace(".0M", "M")
      : `$${(data.startingPrice / 1000).toFixed(0)}K`
    : null;

  // Use neighborhood if short, otherwise city
  const location = data.neighborhood.length <= 15 ? data.neighborhood : data.city;

  // Build title - aim for under 60 chars
  // Format: "Project Location - Presale Type from $Price"
  let title = `${data.name} ${location} - Presale ${typeLabel}`;
  
  if (priceCompact && (title + ` from ${priceCompact}`).length <= 60) {
    title += ` from ${priceCompact}`;
  }

  // If still under 60, add a feature
  if (title.length <= 50) {
    if (data.developerName && (title + ` | ${data.developerName}`).length <= 60) {
      title += ` | ${data.developerName}`;
    }
  }

  return title;
}

/**
 * Generate optimized SEO description for project pages
 * Target: 155-160 characters
 */
export function generateSEODescription(data: {
  name: string;
  neighborhood: string;
  city: string;
  projectType: string;
  startingPrice: number | null;
  unitMix: string | null;
  highlights: string[] | null;
}): string {
  const typeLabel = data.projectType === "condo" ? "condos" : 
                    data.projectType === "townhome" ? "townhomes" : 
                    data.projectType === "mixed" ? "residences" :
                    data.projectType === "duplex" ? "duplexes" : "homes";

  const priceText = data.startingPrice 
    ? ` from ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(data.startingPrice)}`
    : "";

  const unitText = data.unitMix || "studios to 3-bedroom homes";
  
  // Extract a key feature if available
  const feature = data.highlights && data.highlights.length > 0 
    ? data.highlights[0].substring(0, 30)
    : `${data.neighborhood} location`;

  // Build description - aim for 155-160 chars
  // Pattern: "[Name] presale [type] in [location]. [Units]. [Feature]. VIP pricing & floor plans. Contact presale experts today."
  const base = `${data.name} presale ${typeLabel} in ${data.neighborhood}${priceText}. ${unitText}. ${feature}. VIP pricing & floor plans available.`;
  
  if (base.length <= 160) {
    return base;
  }

  // Shorter version
  return `${data.name} presale ${typeLabel} in ${data.neighborhood}${priceText}. ${unitText}. VIP pricing & floor plans. Contact presale experts today.`.substring(0, 160);
}
