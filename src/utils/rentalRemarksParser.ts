/**
 * Rental Remarks Parser
 * Extracts rental-specific data from MLS public_remarks field
 */

export interface ParsedRentalData {
  leaseAmount: number | null;
  leaseFrequency: string | null;
  petsAllowed: string | null;
  availabilityDate: string | null;
  utilitiesIncluded: string[];
  furnished: string | null;
  isRental: boolean;
}

// Price extraction patterns - ordered by specificity
const PRICE_PATTERNS = [
  // "Gross lease per month $4,560" or "$4,560 per month"
  /(?:gross\s+)?(?:rent|lease)(?:\s+(?:is|at|for|:))?\s*(?:per\s+month\s+)?\$\s*([\d,]+)/gi,
  /\$\s*([\d,]+)\s*(?:\+\s*(?:gst|hst|tax))?(?:\s*per\s+month|\s*\/\s*mo(?:nth)?|\s*monthly)/gi,
  // "$2,500/mo" or "$2500 / month"
  /\$\s*([\d,]+)\s*(?:\/|\s*per\s*)?\s*(?:mo(?:nth)?|m)\b/gi,
  // "rent is $2500" or "rental at $2500"
  /rent(?:al)?(?:\s+(?:is|at|of|:))?\s*\$?\s*([\d,]+)(?:\s*(?:\/|\s*per)?\s*(?:mo(?:nth)?)?)?/gi,
  // "lease at $2500" or "lease for $2500"
  /lease(?:\s+(?:is|at|for|of|:))?\s*\$?\s*([\d,]+)(?:\s*(?:\/|\s*per)?\s*(?:mo(?:nth)?)?)?/gi,
  // "2500/month" or "2,500 per month" (no dollar sign)
  /([\d,]+)\s*(?:\/|\s*per\s*)\s*(?:mo(?:nth)?)\b/gi,
  // "$2500 month" or "$2,500 monthly"
  /\$\s*([\d,]+)\s+(?:month(?:ly)?|per\s+month)/gi,
  // "monthly rent of $2500" or "monthly rent: $2500"
  /monthly\s+rent(?:\s+(?:is|of|:))?\s*\$?\s*([\d,]+)/gi,
  // Price followed by frequency in parentheses: "$2500 (monthly)"
  /\$\s*([\d,]+)\s*\((?:monthly|per\s+month|\/mo)\)/gi,
];

// Pet policy patterns
const PET_PATTERNS = {
  allowed: [
    /pets?\s*(?:are\s*)?(?:allowed|welcome|ok|okay|permitted|friendly)/gi,
    /pet\s*friendly/gi,
    /cats?\s*(?:and|&|or)?\s*dogs?\s*(?:allowed|welcome|ok)/gi,
    /dogs?\s*(?:and|&|or)?\s*cats?\s*(?:allowed|welcome|ok)/gi,
  ],
  restricted: [
    /(?:small\s+)?pets?\s*(?:only|negotiable|with\s*deposit)/gi,
    /cats?\s*only/gi,
    /small\s*(?:dogs?|pets?)\s*(?:only|allowed)/gi,
    /pets?\s*(?:case\s*by\s*case|upon\s*approval|with\s*approval)/gi,
  ],
  notAllowed: [
    /no\s*pets?/gi,
    /pets?\s*not\s*(?:allowed|permitted)/gi,
    /pet\s*free/gi,
    /sorry,?\s*no\s*pets?/gi,
  ],
};

// Availability patterns
const AVAILABILITY_PATTERNS = [
  /available\s*(?:from\s*)?(?:now|immediately|asap)/gi,
  /available\s*(?:from\s*)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?(?:,?\s*(\d{4}))?/gi,
  /available\s*(?:from\s*)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/gi,
  /move[\s\-]?in\s*(?:ready|now|immediately|date\s*:?\s*(.+?)(?:\.|,|$))/gi,
  /immediate\s*(?:occupancy|possession|move[\s\-]?in)/gi,
  /ready\s*(?:now|immediately|to\s*move)/gi,
];

// Utilities patterns
const UTILITY_PATTERNS: Record<string, RegExp[]> = {
  heat: [/heat(?:ing)?\s*(?:is\s*)?included/gi, /includes?\s*heat/gi],
  hydro: [/hydro\s*(?:is\s*)?included/gi, /includes?\s*hydro/gi, /electricity\s*included/gi],
  water: [/water\s*(?:is\s*)?included/gi, /includes?\s*water/gi, /hot\s*water\s*included/gi],
  gas: [/gas\s*(?:is\s*)?included/gi, /includes?\s*gas/gi],
  internet: [/internet\s*(?:is\s*)?included/gi, /wifi\s*included/gi, /includes?\s*(?:internet|wifi)/gi],
  cable: [/cable\s*(?:is\s*)?included/gi, /includes?\s*cable/gi],
  all: [/all\s*utilities?\s*(?:are\s*)?included/gi, /utilities?\s*(?:are\s*)?included/gi],
};

// Furnished patterns
const FURNISHED_PATTERNS = {
  furnished: [
    /\bfully?\s*furnished\b/gi,
    /\bfurnished\s*(?:unit|suite|apartment|condo)?\b/gi,
    /\bcomes?\s*furnished\b/gi,
  ],
  partiallyFurnished: [
    /partially\s*furnished/gi,
    /semi[\s\-]?furnished/gi,
    /some\s*furniture\s*included/gi,
  ],
  unfurnished: [
    /\bunfurnished\b/gi,
    /\bnot\s*furnished\b/gi,
    /furniture\s*not\s*included/gi,
  ],
};

// Rental indicator keywords
const RENTAL_KEYWORDS = [
  /\bfor\s*rent\b/gi,
  /\bfor\s*lease\b/gi,
  /\brental\b/gi,
  /\blease\s*(?:available|now)\b/gi,
  /\bmonthly\s*rent\b/gi,
  /\btenant\b/gi,
  /\blandlord\b/gi,
  /\brenter\b/gi,
  /\bper\s*month\b/gi,
  /\$[\d,]+\s*\/\s*mo/gi,
];

/**
 * Extract rental price from remarks
 */
function extractLeaseAmount(remarks: string): { amount: number | null; frequency: string | null } {
  for (const pattern of PRICE_PATTERNS) {
    const matches = remarks.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1]?.replace(/,/g, '');
      const price = parseInt(priceStr, 10);
      
      // Validate reasonable rental range ($400 - $25,000/month)
      if (price >= 400 && price <= 25000) {
        return { amount: price, frequency: 'Monthly' };
      }
    }
  }
  return { amount: null, frequency: null };
}

/**
 * Extract pet policy from remarks
 */
function extractPetPolicy(remarks: string): string | null {
  // Check "not allowed" first (most restrictive)
  for (const pattern of PET_PATTERNS.notAllowed) {
    if (pattern.test(remarks)) {
      return 'No';
    }
  }
  
  // Check restricted/conditional
  for (const pattern of PET_PATTERNS.restricted) {
    if (pattern.test(remarks)) {
      const match = remarks.match(pattern);
      return match ? match[0].trim() : 'Restricted';
    }
  }
  
  // Check allowed
  for (const pattern of PET_PATTERNS.allowed) {
    if (pattern.test(remarks)) {
      return 'Yes';
    }
  }
  
  return null;
}

/**
 * Extract availability date from remarks
 */
function extractAvailabilityDate(remarks: string): string | null {
  const lowerRemarks = remarks.toLowerCase();
  
  // Check for immediate availability
  if (/available\s*(?:now|immediately|asap)/i.test(remarks) ||
      /immediate\s*(?:occupancy|possession|move)/i.test(remarks) ||
      /move[\s\-]?in\s*ready/i.test(remarks)) {
    return 'Immediate';
  }
  
  // Check for month-based dates
  const monthMatch = remarks.match(
    /available\s*(?:from\s*)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?(?:,?\s*(\d{4}))?/i
  );
  
  if (monthMatch) {
    const month = monthMatch[1];
    const day = monthMatch[2] || '1';
    const year = monthMatch[3] || new Date().getFullYear().toString();
    return `${month} ${day}, ${year}`;
  }
  
  // Check for numeric dates
  const dateMatch = remarks.match(
    /available\s*(?:from\s*)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i
  );
  
  if (dateMatch) {
    const month = dateMatch[1];
    const day = dateMatch[2];
    const year = dateMatch[3] || new Date().getFullYear().toString();
    return `${month}/${day}/${year}`;
  }
  
  return null;
}

/**
 * Extract utilities included from remarks
 */
function extractUtilitiesIncluded(remarks: string): string[] {
  const utilities: string[] = [];
  
  // Check for "all utilities included" first
  for (const pattern of UTILITY_PATTERNS.all) {
    if (pattern.test(remarks)) {
      return ['Heat', 'Hydro', 'Water', 'Gas'];
    }
  }
  
  // Check individual utilities
  const utilityMap: Record<string, string> = {
    heat: 'Heat',
    hydro: 'Hydro',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    cable: 'Cable',
  };
  
  for (const [key, patterns] of Object.entries(UTILITY_PATTERNS)) {
    if (key === 'all') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(remarks)) {
        const utilityName = utilityMap[key];
        if (utilityName && !utilities.includes(utilityName)) {
          utilities.push(utilityName);
        }
        break;
      }
    }
  }
  
  return utilities;
}

/**
 * Extract furnished status from remarks
 */
function extractFurnishedStatus(remarks: string): string | null {
  // Check unfurnished first
  for (const pattern of FURNISHED_PATTERNS.unfurnished) {
    if (pattern.test(remarks)) {
      return 'Unfurnished';
    }
  }
  
  // Check partially furnished
  for (const pattern of FURNISHED_PATTERNS.partiallyFurnished) {
    if (pattern.test(remarks)) {
      return 'Partially';
    }
  }
  
  // Check fully furnished
  for (const pattern of FURNISHED_PATTERNS.furnished) {
    if (pattern.test(remarks)) {
      return 'Furnished';
    }
  }
  
  return null;
}

/**
 * Check if remarks indicate this is a rental listing
 */
function isRentalListing(remarks: string, listingPrice: number): boolean {
  // If listing price is $0, it's almost ALWAYS a rental in DDF
  // Zero-price is the standard convention for lease listings
  if (listingPrice === 0) {
    return true;
  }
  
  // For non-zero price listings, check for explicit rental keywords
  for (const pattern of RENTAL_KEYWORDS) {
    if (pattern.test(remarks)) {
      return true;
    }
  }
  
  // Check if we can extract a lease amount
  const { amount } = extractLeaseAmount(remarks);
  if (amount !== null) {
    return true;
  }
  
  return false;
}

/**
 * Main parser function - extracts all rental data from remarks
 */
export function parseRentalRemarks(
  publicRemarks: string | null | undefined,
  listingPrice: number = 0
): ParsedRentalData {
  const remarks = publicRemarks || '';
  
  const { amount, frequency } = extractLeaseAmount(remarks);
  const petsAllowed = extractPetPolicy(remarks);
  const availabilityDate = extractAvailabilityDate(remarks);
  const utilitiesIncluded = extractUtilitiesIncluded(remarks);
  const furnished = extractFurnishedStatus(remarks);
  const isRental = isRentalListing(remarks, listingPrice);
  
  return {
    leaseAmount: amount,
    leaseFrequency: frequency,
    petsAllowed,
    availabilityDate,
    utilitiesIncluded,
    furnished,
    isRental,
  };
}

/**
 * Batch process multiple listings
 */
export function parseMultipleListings(
  listings: Array<{ publicRemarks: string | null; listingPrice: number }>
): ParsedRentalData[] {
  return listings.map(listing => 
    parseRentalRemarks(listing.publicRemarks, listing.listingPrice)
  );
}
