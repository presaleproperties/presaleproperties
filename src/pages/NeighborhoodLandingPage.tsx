import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import NotFound from "./NotFound";
import { Helmet } from "react-helmet-async";
import { 
  ChevronRight, Home, MapPin, Building2, Shield, TrendingUp, 
  Users, School, ShoppingBag, TreePine, Bus, DollarSign, 
  PiggyBank, Percent, BarChart3, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl } from "@/lib/seoUrls";

// Comprehensive Neighborhood SEO Configurations
export const NEIGHBORHOOD_SEO_CONFIG: Record<string, {
  slug: string;
  displayName: string;
  city: string;
  citySlug: string;
  overview: string;
  whyBuy: string[];
  marketStats: {
    avgCondoPrice: string;
    avgTownhomePrice: string;
    pricePerSqft: string;
    avgRental: string;
    rentalYield: string;
  };
  location: {
    walkScore: number;
    transitScore: number;
    highlights: string[];
  };
  schools: { name: string; rating: string; distance: string }[];
  shopping: { name: string; distance: string }[];
  parks: { name: string; distance: string }[];
  investmentAnalysis: string;
  faqs: { question: string; answer: string }[];
}> = {
  "south-surrey": {
    slug: "south-surrey",
    displayName: "South Surrey",
    city: "Surrey",
    citySlug: "surrey",
    overview: "South Surrey is one of Metro Vancouver's most desirable neighbourhoods, offering an exceptional blend of natural beauty, established communities, and new presale developments. Bordered by the Pacific Ocean to the south and farmland to the east, South Surrey delivers a unique coastal lifestyle just 45 minutes from downtown Vancouver. The area is known for its proximity to White Rock's stunning waterfront, excellent schools, and family-friendly atmosphere. New presale projects in South Surrey range from luxury oceanview condos to spacious townhomes, making it ideal for families, retirees, and investors seeking long-term appreciation in BC's real estate market.",
    whyBuy: [
      "Proximity to White Rock Beach & Ocean Park",
      "Top-rated schools including Semiahmoo Secondary",
      "Growing employment at Campbell Heights business park",
      "Strong historical appreciation (7-9% annually)",
      "Lower density than urban centres"
    ],
    marketStats: {
      avgCondoPrice: "$650,000 - $950,000",
      avgTownhomePrice: "$950,000 - $1,400,000",
      pricePerSqft: "$750 - $950",
      avgRental: "$2,200 - $3,200/month",
      rentalYield: "3.5% - 4.2%"
    },
    location: {
      walkScore: 45,
      transitScore: 35,
      highlights: [
        "15 minutes to Highway 99",
        "10 minutes to White Rock Beach",
        "20 minutes to Tsawwassen Ferry Terminal",
        "5 minutes to Semiahmoo Town Centre"
      ]
    },
    schools: [
      { name: "Semiahmoo Secondary", rating: "9/10", distance: "2.5 km" },
      { name: "Earl Marriott Secondary", rating: "8/10", distance: "3.2 km" },
      { name: "Southridge School (Private)", rating: "10/10", distance: "4.0 km" }
    ],
    shopping: [
      { name: "Morgan Crossing", distance: "3.5 km" },
      { name: "Grandview Corners", distance: "4.0 km" },
      { name: "White Rock Downtown", distance: "5.0 km" }
    ],
    parks: [
      { name: "Crescent Beach", distance: "6.0 km" },
      { name: "Blackie Spit Park", distance: "5.5 km" },
      { name: "South Surrey Athletic Park", distance: "2.0 km" }
    ],
    investmentAnalysis: "South Surrey presales offer strong investment potential driven by limited land supply, proximity to the US border (attracting cross-border workers), and ongoing development of the Campbell Heights business park. The area has historically outperformed Metro Vancouver averages for appreciation, with particularly strong demand for family-oriented townhomes. New infrastructure investments, including road improvements and school expansions, continue to enhance the area's appeal.",
    faqs: [
      { question: "Why buy presale in South Surrey?", answer: "South Surrey offers a unique combination of coastal lifestyle, excellent schools, and strong appreciation potential. Presale buyers can secure properties at today's prices with completion in 2-3 years, typically seeing 10-15% appreciation by move-in." },
      { question: "What are typical presale prices in South Surrey?", answer: "Presale condos in South Surrey range from $650K-$950K, while townhomes typically start at $950K and can exceed $1.4M for larger units with ocean views or premium locations." },
      { question: "Is South Surrey good for families?", answer: "Absolutely. South Surrey is known for top-rated schools (Semiahmoo Secondary, Southridge School), safe neighbourhoods, abundant parks, and a strong community feel. Many presale townhome developments specifically target families." },
      { question: "What is the rental potential in South Surrey?", answer: "South Surrey rental yields average 3.5-4.2%. Two-bedroom condos rent for $2,200-$2,800/month, while 3-bedroom townhomes command $3,000-$3,800/month. Demand is strong from families and professionals." }
    ]
  },
  "langley-willoughby": {
    slug: "langley-willoughby",
    displayName: "Willoughby",
    city: "Langley",
    citySlug: "langley",
    overview: "Willoughby is Langley's fastest-growing master-planned community, transforming from farmland into a vibrant family-oriented neighbourhood. With over 80,000 residents expected at buildout, Willoughby offers excellent schools, modern amenities, and some of the most affordable presale options in Metro Vancouver. The area features a mix of townhomes, condos, and single-family homes, with continuous new development creating opportunities for buyers at various price points. Willoughby's community-focused design includes extensive trail networks, new schools, and commercial centres within walking distance of residential areas.",
    whyBuy: [
      "Most affordable presale prices in Metro Vancouver",
      "New schools and community facilities",
      "Future SkyTrain extension (planned)",
      "Master-planned community design",
      "Strong family demographics"
    ],
    marketStats: {
      avgCondoPrice: "$450,000 - $650,000",
      avgTownhomePrice: "$700,000 - $1,000,000",
      pricePerSqft: "$600 - $750",
      avgRental: "$1,800 - $2,600/month",
      rentalYield: "4.0% - 4.8%"
    },
    location: {
      walkScore: 50,
      transitScore: 40,
      highlights: [
        "Direct access to Highway 1",
        "20 minutes to Surrey City Centre",
        "35 minutes to Downtown Vancouver",
        "10 minutes to Langley City"
      ]
    },
    schools: [
      { name: "R.E. Mountain Secondary", rating: "8/10", distance: "1.5 km" },
      { name: "Willoughby Elementary", rating: "8/10", distance: "0.8 km" },
      { name: "Yorkson Creek Middle School", rating: "8/10", distance: "1.2 km" }
    ],
    shopping: [
      { name: "Willoughby Town Centre", distance: "1.0 km" },
      { name: "Langley Bypass Shopping", distance: "3.5 km" },
      { name: "Willowbrook Mall", distance: "5.0 km" }
    ],
    parks: [
      { name: "Yorkson Off-Leash Dog Park", distance: "1.5 km" },
      { name: "Willoughby Community Park", distance: "1.0 km" },
      { name: "Derek Doubleday Arboretum", distance: "2.5 km" }
    ],
    investmentAnalysis: "Willoughby presents exceptional investment value with the lowest entry prices in Metro Vancouver and strong population growth driving demand. The planned SkyTrain extension to Langley will significantly boost property values, potentially adding 15-25% to current prices. Young families continue to flock to the area for affordability and schools, creating reliable rental demand and resale liquidity.",
    faqs: [
      { question: "Is Willoughby a good investment for first-time buyers?", answer: "Yes! Willoughby offers the most affordable presale prices in Metro Vancouver, making it ideal for first-time buyers. Entry-level condos start around $450K, and townhomes under $800K are available." },
      { question: "When will SkyTrain come to Willoughby?", answer: "The SkyTrain extension to Langley is currently in planning stages with construction expected to begin in the late 2020s. Properties near the planned route are seeing increased demand." },
      { question: "What's the community like in Willoughby?", answer: "Willoughby has a young, family-oriented demographic. New schools, parks, and community centres are continuously being built to serve the growing population. It's known for a strong sense of community." }
    ]
  },
  "surrey-city-centre": {
    slug: "surrey-city-centre",
    displayName: "Surrey City Centre",
    city: "Surrey",
    citySlug: "surrey",
    overview: "Surrey City Centre is rapidly transforming into BC's second downtown, featuring modern high-rise condos, SkyTrain connectivity, and major employment centres. Home to SFU Surrey, City Hall, and Central City Mall, this transit-oriented neighbourhood offers urban living at prices significantly below Vancouver. The area is experiencing unprecedented development with dozens of towers in various stages of construction, creating a vibrant urban core with restaurants, entertainment, and cultural amenities.",
    whyBuy: [
      "Direct SkyTrain access to Vancouver",
      "SFU Surrey & major employers",
      "Highest appreciation area in Surrey",
      "Urban amenities and nightlife",
      "Government investment in infrastructure"
    ],
    marketStats: {
      avgCondoPrice: "$500,000 - $750,000",
      avgTownhomePrice: "$750,000 - $1,100,000",
      pricePerSqft: "$700 - $900",
      avgRental: "$2,000 - $2,800/month",
      rentalYield: "4.5% - 5.2%"
    },
    location: {
      walkScore: 82,
      transitScore: 78,
      highlights: [
        "Surrey Central SkyTrain Station",
        "25 minutes to Downtown Vancouver",
        "5 minutes to Gateway Station",
        "Direct access to Highway 1"
      ]
    },
    schools: [
      { name: "SFU Surrey", rating: "N/A", distance: "0.5 km" },
      { name: "Queen Elizabeth Secondary", rating: "7/10", distance: "2.0 km" },
      { name: "Kwantlen Polytechnic", rating: "N/A", distance: "3.5 km" }
    ],
    shopping: [
      { name: "Central City Mall", distance: "0.3 km" },
      { name: "Guildford Town Centre", distance: "5.0 km" },
      { name: "King George Hub", distance: "1.0 km" }
    ],
    parks: [
      { name: "Holland Park", distance: "1.5 km" },
      { name: "Bear Creek Park", distance: "4.0 km" },
      { name: "Green Timbers Urban Forest", distance: "3.0 km" }
    ],
    investmentAnalysis: "Surrey City Centre is the top investment pick in Surrey due to SkyTrain access, strong rental demand from SFU students and young professionals, and massive government investment. The area offers 4.5-5.2% rental yields - among the highest in Metro Vancouver. Continued tower development is creating a true urban core, with values expected to appreciate as the neighbourhood matures.",
    faqs: [
      { question: "Is Surrey City Centre safe?", answer: "Surrey City Centre has seen significant improvements in safety due to increased population, business activity, and police presence. The growing residential population has transformed the area into a vibrant, safer urban centre." },
      { question: "What's the rental demand like?", answer: "Rental demand is extremely strong, driven by SFU students, young professionals, and transit commuters. Vacancy rates are typically under 1%, and rents have grown 5-8% annually." },
      { question: "How does it compare to Downtown Vancouver?", answer: "Surrey City Centre offers similar urban amenities and transit access at 30-40% lower prices. For investors and young buyers, it provides Vancouver-quality living at Surrey prices." }
    ]
  },
  "coquitlam-burquitlam": {
    slug: "coquitlam-burquitlam",
    displayName: "Burquitlam",
    city: "Coquitlam",
    citySlug: "coquitlam",
    overview: "Burquitlam straddles the Burnaby-Coquitlam border, offering exceptional value with direct Evergreen Line SkyTrain access. This transit-oriented neighbourhood features new condo towers, established residential streets, and convenient access to both Burnaby and Coquitlam amenities. Burquitlam attracts young professionals and investors seeking SkyTrain access at more affordable prices than Burnaby.",
    whyBuy: [
      "Evergreen Line SkyTrain station",
      "Lower prices than Burnaby",
      "Mountain and city views",
      "Growing commercial amenities",
      "Strong rental demand"
    ],
    marketStats: {
      avgCondoPrice: "$550,000 - $800,000",
      avgTownhomePrice: "$900,000 - $1,300,000",
      pricePerSqft: "$750 - $950",
      avgRental: "$2,100 - $2,900/month",
      rentalYield: "4.2% - 4.8%"
    },
    location: {
      walkScore: 72,
      transitScore: 75,
      highlights: [
        "Burquitlam SkyTrain Station",
        "15 minutes to Metrotown",
        "35 minutes to Downtown Vancouver",
        "5 minutes to Lougheed Mall"
      ]
    },
    schools: [
      { name: "Burnaby Mountain Secondary", rating: "8/10", distance: "3.0 km" },
      { name: "Burnaby Central Secondary", rating: "8/10", distance: "4.0 km" },
      { name: "SFU Burnaby Campus", rating: "N/A", distance: "6.0 km" }
    ],
    shopping: [
      { name: "Burquitlam Plaza", distance: "0.5 km" },
      { name: "Lougheed Town Centre", distance: "2.5 km" },
      { name: "Coquitlam Centre", distance: "4.0 km" }
    ],
    parks: [
      { name: "Como Lake Park", distance: "2.0 km" },
      { name: "Burnaby Mountain", distance: "5.0 km" },
      { name: "Stoney Creek Park", distance: "3.0 km" }
    ],
    investmentAnalysis: "Burquitlam offers the best value for SkyTrain-connected living in the Tri-Cities. The Evergreen Line has driven significant appreciation since opening, and continued development is creating a walkable urban village. Rental demand is strong from professionals commuting to Vancouver, making it an excellent investment for long-term holds.",
    faqs: [
      { question: "How does Burquitlam compare to Brentwood?", answer: "Burquitlam offers similar SkyTrain access at 15-20% lower prices than Brentwood. While Brentwood has more retail amenities, Burquitlam is rapidly developing its own commercial core." },
      { question: "What's the commute like from Burquitlam?", answer: "Burquitlam SkyTrain reaches Downtown Vancouver in about 35 minutes, Metrotown in 15 minutes, and Lougheed Town Centre in 5 minutes - making it ideal for transit commuters." },
      { question: "Is Burquitlam good for investors?", answer: "Yes! Burquitlam offers 4.2-4.8% rental yields with strong tenant demand. The combination of transit access and relative affordability creates reliable rental income." }
    ]
  },
  "burnaby-metrotown": {
    slug: "burnaby-metrotown",
    displayName: "Metrotown",
    city: "Burnaby",
    citySlug: "burnaby",
    overview: "Metrotown is Burnaby's urban heart, featuring Western Canada's largest shopping mall, multiple SkyTrain stations, and some of the region's most iconic condo towers. This dense, vibrant neighbourhood offers the ultimate urban convenience with world-class shopping, dining, and entertainment steps from home. Presale developments in Metrotown attract investors and owner-occupiers seeking premium urban living with excellent appreciation potential.",
    whyBuy: [
      "Metropolis at Metrotown (largest mall in Western Canada)",
      "Multiple SkyTrain stations",
      "Highest density employment area",
      "Strong appreciation history",
      "World-class dining and entertainment"
    ],
    marketStats: {
      avgCondoPrice: "$650,000 - $1,000,000",
      avgTownhomePrice: "$1,100,000 - $1,600,000",
      pricePerSqft: "$900 - $1,200",
      avgRental: "$2,400 - $3,400/month",
      rentalYield: "4.0% - 4.5%"
    },
    location: {
      walkScore: 95,
      transitScore: 92,
      highlights: [
        "Metrotown SkyTrain Station",
        "20 minutes to Downtown Vancouver",
        "Adjacent to Central Park",
        "Direct access to Highway 1"
      ]
    },
    schools: [
      { name: "Burnaby Central Secondary", rating: "8/10", distance: "1.5 km" },
      { name: "BCIT", rating: "N/A", distance: "3.0 km" },
      { name: "Marlborough Elementary", rating: "7/10", distance: "1.0 km" }
    ],
    shopping: [
      { name: "Metropolis at Metrotown", distance: "0.2 km" },
      { name: "Crystal Mall", distance: "0.5 km" },
      { name: "Station Square", distance: "0.3 km" }
    ],
    parks: [
      { name: "Central Park", distance: "0.5 km" },
      { name: "Bonsor Recreation Complex", distance: "0.8 km" },
      { name: "Maywood Park", distance: "1.0 km" }
    ],
    investmentAnalysis: "Metrotown commands premium pricing justified by unmatched amenities and transit access. The area has historically appreciated 6-8% annually, outperforming many Vancouver neighbourhoods. High rental demand from students, professionals, and newcomers ensures minimal vacancy. Presale buyers should expect 15-25% deposits but can anticipate strong appreciation by completion.",
    faqs: [
      { question: "Is Metrotown too crowded?", answer: "Metrotown is dense but well-designed, with wide streets, parks (Central Park), and efficient transit. Many residents appreciate the urban energy and convenience. Tower living here is modern and well-appointed." },
      { question: "What are presale deposits like in Metrotown?", answer: "Metrotown presales typically require 20-25% deposits paid over 12-18 months. The high demand and premium location justify the larger deposit requirements." },
      { question: "How is the rental market?", answer: "Metrotown has one of the strongest rental markets in Metro Vancouver with vacancy under 0.5%. One-bedrooms rent for $2,200-$2,600, and two-bedrooms command $2,800-$3,400." }
    ]
  },
  "vancouver-mount-pleasant": {
    slug: "vancouver-mount-pleasant",
    displayName: "Mount Pleasant",
    city: "Vancouver",
    citySlug: "vancouver",
    overview: "Mount Pleasant is Vancouver's creative hub, home to craft breweries, tech startups, and Main Street's eclectic boutiques. This trendy neighbourhood attracts young professionals, artists, and foodies seeking urban living with character. Presale developments here blend modern design with the area's industrial heritage, offering loft-style condos and contemporary townhomes.",
    whyBuy: [
      "Tech company headquarters (Hootsuite, etc.)",
      "Brewery District entertainment",
      "Main Street boutiques and restaurants",
      "Broadway Subway (under construction)",
      "Strong appreciation in creative neighbourhoods"
    ],
    marketStats: {
      avgCondoPrice: "$700,000 - $1,100,000",
      avgTownhomePrice: "$1,200,000 - $1,800,000",
      pricePerSqft: "$1,000 - $1,400",
      avgRental: "$2,600 - $3,600/month",
      rentalYield: "3.5% - 4.0%"
    },
    location: {
      walkScore: 92,
      transitScore: 88,
      highlights: [
        "Broadway-City Hall SkyTrain Station",
        "10 minutes to Downtown",
        "Main Street restaurants and shops",
        "Adjacent to Olympic Village"
      ]
    },
    schools: [
      { name: "Emily Carr University", rating: "N/A", distance: "2.0 km" },
      { name: "Sir Charles Tupper Secondary", rating: "7/10", distance: "1.5 km" },
      { name: "VCC", rating: "N/A", distance: "1.0 km" }
    ],
    shopping: [
      { name: "Main Street shops", distance: "0.3 km" },
      { name: "Cambie Village", distance: "1.0 km" },
      { name: "Broadway shopping", distance: "0.5 km" }
    ],
    parks: [
      { name: "Jonathan Rogers Park", distance: "0.5 km" },
      { name: "Dude Chilling Park", distance: "0.8 km" },
      { name: "Olympic Village waterfront", distance: "1.5 km" }
    ],
    investmentAnalysis: "Mount Pleasant offers unique investment appeal with strong demand from tech workers, creatives, and young professionals. The Broadway Subway extension (opening 2027) will dramatically improve connectivity, likely boosting values 10-15%. The area's character and walkability command premium rents and ensure strong appreciation.",
    faqs: [
      { question: "Is Mount Pleasant family-friendly?", answer: "While more urban, Mount Pleasant has good schools, parks, and a strong community. It's popular with young families who value walkability and the vibrant neighbourhood culture." },
      { question: "What will the Broadway Subway do for property values?", answer: "The Broadway Subway (Millennium Line extension) opening around 2027 will add stations at Main Street and Mount Pleasant, significantly improving transit access and likely boosting property values 10-15%." },
      { question: "What's the vibe like?", answer: "Mount Pleasant has an artsy, laid-back vibe with craft breweries, farm-to-table restaurants, and indie boutiques. It's less corporate than Downtown but more urban than East Van." }
    ]
  },
  "richmond-brighouse": {
    slug: "richmond-brighouse",
    displayName: "Brighouse",
    city: "Richmond",
    citySlug: "richmond",
    overview: "Brighouse is Richmond's city centre, featuring Richmond Centre mall, multiple Canada Line stations, and a vibrant Asian dining scene. This transit-oriented neighbourhood offers urban convenience with easy access to YVR airport and downtown Vancouver. Presale developments attract investors, airport workers, and those seeking Richmond's unique cultural amenities.",
    whyBuy: [
      "Canada Line SkyTrain access",
      "15 minutes to YVR Airport",
      "Richmond Centre & Aberdeen malls",
      "Excellent Asian dining scene",
      "Strong rental demand"
    ],
    marketStats: {
      avgCondoPrice: "$600,000 - $900,000",
      avgTownhomePrice: "$1,000,000 - $1,400,000",
      pricePerSqft: "$850 - $1,100",
      avgRental: "$2,200 - $3,100/month",
      rentalYield: "4.0% - 4.5%"
    },
    location: {
      walkScore: 85,
      transitScore: 80,
      highlights: [
        "Brighouse Canada Line Station",
        "25 minutes to Downtown Vancouver",
        "15 minutes to YVR Airport",
        "Walking distance to Richmond Centre"
      ]
    },
    schools: [
      { name: "Richmond Secondary", rating: "8/10", distance: "1.5 km" },
      { name: "Kwantlen Polytechnic", rating: "N/A", distance: "3.0 km" },
      { name: "Steveston-London Secondary", rating: "8/10", distance: "4.0 km" }
    ],
    shopping: [
      { name: "Richmond Centre", distance: "0.3 km" },
      { name: "Aberdeen Centre", distance: "1.5 km" },
      { name: "Lansdowne Centre", distance: "1.0 km" }
    ],
    parks: [
      { name: "Minoru Park", distance: "0.5 km" },
      { name: "Richmond Olympic Oval", distance: "2.0 km" },
      { name: "Garden City Park", distance: "1.5 km" }
    ],
    investmentAnalysis: "Brighouse offers strong investment fundamentals with Canada Line access, airport proximity (attracting airline workers), and Richmond's excellent schools. The area has steady 5-7% annual appreciation and 4.0-4.5% rental yields. The unique cultural amenities and dining options attract diverse tenants.",
    faqs: [
      { question: "Is Brighouse good for airport workers?", answer: "Absolutely! Brighouse is 15 minutes from YVR by Canada Line, making it the preferred location for flight crews, airport staff, and business travelers who need easy airport access." },
      { question: "What's special about Richmond dining?", answer: "Richmond has the best Asian dining in North America outside of Asia. Brighouse offers hundreds of restaurants, bakeries, and night markets, attracting foodies from across the region." },
      { question: "How liquid is the resale market?", answer: "Brighouse condos are highly liquid with strong buyer demand. Properties typically sell within 2-3 weeks when priced correctly, making it easy to exit investments." }
    ]
  },
  "north-vancouver-lonsdale": {
    slug: "north-vancouver-lonsdale",
    displayName: "Lonsdale",
    city: "North Vancouver",
    citySlug: "north-vancouver",
    overview: "Lonsdale is North Vancouver's urban core, featuring the revitalized Lonsdale Quay, SeaBus terminal, and stunning ocean/mountain views. This waterfront neighbourhood combines urban convenience with North Shore lifestyle, attracting professionals and families seeking outdoor access without sacrificing urban amenities.",
    whyBuy: [
      "SeaBus to Downtown Vancouver (12 minutes)",
      "Lonsdale Quay Market and waterfront",
      "Mountain and ocean views",
      "Grouse Mountain and ski access",
      "Strong North Shore schools"
    ],
    marketStats: {
      avgCondoPrice: "$700,000 - $1,100,000",
      avgTownhomePrice: "$1,200,000 - $1,800,000",
      pricePerSqft: "$950 - $1,250",
      avgRental: "$2,400 - $3,400/month",
      rentalYield: "3.5% - 4.0%"
    },
    location: {
      walkScore: 80,
      transitScore: 72,
      highlights: [
        "Lonsdale Quay SeaBus Terminal",
        "12 minutes to Downtown Vancouver",
        "20 minutes to Grouse Mountain",
        "Direct access to Upper Levels Highway"
      ]
    },
    schools: [
      { name: "Carson Graham Secondary", rating: "8/10", distance: "1.5 km" },
      { name: "Handsworth Secondary", rating: "9/10", distance: "3.0 km" },
      { name: "Capilano University", rating: "N/A", distance: "4.0 km" }
    ],
    shopping: [
      { name: "Lonsdale Quay Market", distance: "0.3 km" },
      { name: "Lonsdale Avenue shops", distance: "0.2 km" },
      { name: "Park & Tilford", distance: "2.5 km" }
    ],
    parks: [
      { name: "Waterfront Park", distance: "0.5 km" },
      { name: "Victoria Park", distance: "0.8 km" },
      { name: "Lynn Canyon Park", distance: "6.0 km" }
    ],
    investmentAnalysis: "Lonsdale offers unique North Shore living with quick SeaBus access to Downtown Vancouver. The area commands premium pricing for ocean/mountain views and outdoor lifestyle access. Recent development has transformed Lower Lonsdale into a vibrant urban core, with appreciation of 6-8% annually. The limited land supply on the North Shore supports long-term value growth.",
    faqs: [
      { question: "Is the SeaBus commute practical?", answer: "Yes! The SeaBus takes 12 minutes to Waterfront Station, and many commuters prefer it to driving. The scenic ride across Burrard Inlet is a highlight, and buses connect to all North Shore areas." },
      { question: "What outdoor activities are nearby?", answer: "Lonsdale offers unmatched outdoor access: Grouse Mountain skiing (20 min), Lynn Canyon hiking (15 min), Deep Cove kayaking (20 min), and waterfront cycling/walking paths right outside your door." },
      { question: "Are North Shore presales expensive?", answer: "North Shore presales command 10-15% premium over similar offerings in Burnaby or Coquitlam, reflecting the lifestyle value and limited land supply. However, they typically appreciate well." }
    ]
  },
  "new-westminster-downtown": {
    slug: "new-westminster-downtown",
    displayName: "Downtown New Westminster",
    city: "New Westminster",
    citySlug: "new-westminster",
    overview: "Downtown New Westminster combines historic charm with modern urban living along the Fraser River. This revitalized waterfront neighbourhood features heritage architecture, the River Market, and SkyTrain access. Presale developments offer river views and urban convenience at prices below Vancouver and Burnaby.",
    whyBuy: [
      "Two SkyTrain stations (Expo Line)",
      "Fraser River waterfront",
      "Historic downtown character",
      "Royal Columbian Hospital employment",
      "Affordable urban living"
    ],
    marketStats: {
      avgCondoPrice: "$500,000 - $750,000",
      avgTownhomePrice: "$800,000 - $1,200,000",
      pricePerSqft: "$700 - $900",
      avgRental: "$1,900 - $2,700/month",
      rentalYield: "4.2% - 4.8%"
    },
    location: {
      walkScore: 90,
      transitScore: 85,
      highlights: [
        "New Westminster & Columbia SkyTrain",
        "25 minutes to Downtown Vancouver",
        "Fraser River boardwalk",
        "Adjacent to Queensborough"
      ]
    },
    schools: [
      { name: "New Westminster Secondary", rating: "7/10", distance: "1.0 km" },
      { name: "Douglas College", rating: "N/A", distance: "0.5 km" },
      { name: "Queensborough Middle School", rating: "7/10", distance: "2.5 km" }
    ],
    shopping: [
      { name: "River Market at the Quay", distance: "0.3 km" },
      { name: "Columbia Street shops", distance: "0.2 km" },
      { name: "Queensborough Landing", distance: "3.0 km" }
    ],
    parks: [
      { name: "Westminster Pier Park", distance: "0.3 km" },
      { name: "Queen's Park", distance: "1.5 km" },
      { name: "Moody Park", distance: "1.0 km" }
    ],
    investmentAnalysis: "Downtown New Westminster offers exceptional value for SkyTrain-connected living. The area has transformed from industrial to residential over the past decade, with continued waterfront development. Rental yields of 4.2-4.8% outperform many Metro Vancouver locations. The Royal Columbian Hospital redevelopment will add thousands of healthcare jobs, boosting housing demand.",
    faqs: [
      { question: "How is Downtown New West different from other SkyTrain areas?", answer: "Downtown New West offers historic character, waterfront access, and more affordable pricing than Metrotown or Surrey Central. It's ideal for those who appreciate heritage charm with urban convenience." },
      { question: "Is the area still industrial?", answer: "No! Downtown New West has transformed dramatically over the past 15 years. The waterfront is now a vibrant residential and commercial area with condos, restaurants, and the River Market." },
      { question: "What's happening with Royal Columbian Hospital?", answer: "The $1.4 billion hospital redevelopment is adding thousands of healthcare jobs, creating strong housing demand from medical professionals and support staff." }
    ]
  },
  "maple-ridge-town-centre": {
    slug: "maple-ridge-town-centre",
    displayName: "Maple Ridge Town Centre",
    city: "Maple Ridge",
    citySlug: "maple-ridge",
    overview: "Maple Ridge Town Centre offers small-town charm with growing urban amenities. This affordable Fraser Valley community features mountain views, outdoor recreation access, and some of the lowest presale prices in Metro Vancouver. Ideal for families and first-time buyers seeking space and value.",
    whyBuy: [
      "Most affordable presale prices in region",
      "Golden Ears mountain access",
      "Growing employment and retail",
      "Strong family communities",
      "West Coast Express commuter rail"
    ],
    marketStats: {
      avgCondoPrice: "$400,000 - $550,000",
      avgTownhomePrice: "$600,000 - $900,000",
      pricePerSqft: "$500 - $650",
      avgRental: "$1,600 - $2,300/month",
      rentalYield: "4.5% - 5.5%"
    },
    location: {
      walkScore: 65,
      transitScore: 45,
      highlights: [
        "West Coast Express to Downtown",
        "Lougheed Highway access",
        "Golden Ears Provincial Park nearby",
        "Historic downtown core"
      ]
    },
    schools: [
      { name: "Garibaldi Secondary", rating: "7/10", distance: "1.5 km" },
      { name: "Maple Ridge Secondary", rating: "7/10", distance: "2.0 km" },
      { name: "Thomas Haney Secondary", rating: "8/10", distance: "3.0 km" }
    ],
    shopping: [
      { name: "Haney Place Mall", distance: "0.5 km" },
      { name: "Downtown Maple Ridge", distance: "0.3 km" },
      { name: "Westgate Shopping Centre", distance: "2.0 km" }
    ],
    parks: [
      { name: "Memorial Peace Park", distance: "0.5 km" },
      { name: "Golden Ears Provincial Park", distance: "15 km" },
      { name: "Whonnock Lake", distance: "8 km" }
    ],
    investmentAnalysis: "Maple Ridge offers the highest rental yields in Metro Vancouver (4.5-5.5%) due to low entry prices and strong family rental demand. While further from Vancouver, the West Coast Express provides reliable commuting. The area attracts young families priced out of closer-in markets, ensuring steady demand for family-sized units.",
    faqs: [
      { question: "Is the commute from Maple Ridge practical?", answer: "The West Coast Express takes 55-70 minutes to Downtown Vancouver, similar to driving during rush hour. Many commuters work remotely part-time, making the commute manageable." },
      { question: "Why is Maple Ridge so affordable?", answer: "Maple Ridge's distance from Vancouver and limited transit options keep prices lower. However, this creates exceptional value for those who can work remotely or commute flexibly." },
      { question: "What outdoor activities are available?", answer: "Maple Ridge offers unmatched outdoor access: Golden Ears Provincial Park, Alouette Lake, mountain biking trails, and the Pitt River for kayaking - all within 15-20 minutes." }
    ]
  }
};

// Get all neighborhood slugs for routing
export const getNeighborhoodSlugs = (): string[] => {
  return Object.keys(NEIGHBORHOOD_SEO_CONFIG);
};

export default function NeighborhoodLandingPage() {
  const { neighborhoodSlug } = useParams<{ neighborhoodSlug: string }>();
  
  const config = useMemo(() => {
    if (!neighborhoodSlug) return null;
    return NEIGHBORHOOD_SEO_CONFIG[neighborhoodSlug] || null;
  }, [neighborhoodSlug]);

  // Fetch presale projects for this neighborhood
  const { data: projects, isLoading } = useQuery({
    queryKey: ["neighborhood-projects", config?.city, config?.displayName],
    queryFn: async () => {
      if (!config) return [];
      
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("is_published", true)
        .or(`neighborhood.ilike.%${config.displayName}%,city.ilike.%${config.city}%`)
        .order("view_count", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    enabled: !!config,
  });

  if (!config) {
    return <NotFound />;
  }

  const pageTitle = `${config.displayName} Presale Properties | New Construction Condos & Townhomes | ${config.city} BC`;
  const pageDescription = `Browse presale condos & townhomes in ${config.displayName}, ${config.city}. ${config.overview.slice(0, 150)}... VIP pricing, floorplans & deposit info.`;
  const canonicalUrl = `https://presaleproperties.com/${config.slug}-presale`;

  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": `PresaleProperties - ${config.displayName} Specialist`,
    "description": pageDescription,
    "url": canonicalUrl,
    "areaServed": {
      "@type": "City",
      "name": config.city
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": config.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "Presale Projects", "item": "https://presaleproperties.com/presale-projects" },
      { "@type": "ListItem", "position": 3, "name": config.city, "item": `https://presaleproperties.com/${config.citySlug}-presale-condos` },
      { "@type": "ListItem", "position": 4, "name": config.displayName }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <ConversionHeader />

        <main className="container py-6 md:py-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6 overflow-x-auto">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link to="/presale-projects" className="hover:text-foreground transition-colors shrink-0">
              Presale Projects
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link to={`/${config.citySlug}-presale-condos`} className="hover:text-foreground transition-colors shrink-0">
              {config.city}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium shrink-0">{config.displayName}</span>
          </nav>

          {/* Hero Section */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {config.city}, BC
              </Badge>
              <Badge className="bg-primary/10 text-primary text-xs">
                Presale
              </Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              {config.displayName} Presale Properties | New Construction Condos & Townhomes
            </h1>
            <p className="text-muted-foreground text-sm text-foreground/80">
              <span className="font-medium text-primary">{projects?.length || 0}</span> presale projects available
            </p>
          </section>

          {/* Overview Section */}
          <section id="overview" className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Why Buy Presale in {config.displayName}?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {config.overview}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.whyBuy.map((reason, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border"
                >
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Current Inventory Section */}
          <section id="current-inventory" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                Current {config.displayName} Presale Projects
              </h2>
              <Link to={`/${config.citySlug}-presale-condos`}>
                <Button variant="outline" size="sm">
                  View All {config.city}
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border">
                    <Skeleton className="aspect-[16/11] w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {projects.map((project, index) => (
                  <ScrollReveal key={project.id} delay={index * 0.05}>
                    <PresaleProjectCard
                      id={project.id}
                      slug={project.slug}
                      name={project.name}
                      city={project.city}
                      neighborhood={project.neighborhood}
                      projectType={project.project_type}
                      status={project.status}
                      completionYear={project.completion_year}
                      startingPrice={project.starting_price}
                      featuredImage={project.featured_image}
                      galleryImages={project.gallery_images}
                      lastVerifiedDate={project.last_verified_date}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No presale projects currently available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Check back soon for new developments in {config.displayName}.
                </p>
                <Link to={`/${config.citySlug}-presale-condos`}>
                  <Button>Browse All {config.city} Projects</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Market Stats Section */}
          <section id="market-stats" className="mb-12 bg-muted/30 rounded-xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {config.displayName} Real Estate Market Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Avg Condo Price</h3>
                </div>
                <p className="text-lg font-semibold text-foreground">{config.marketStats.avgCondoPrice}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Avg Townhome Price</h3>
                </div>
                <p className="text-lg font-semibold text-foreground">{config.marketStats.avgTownhomePrice}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Price Per Sq Ft</h3>
                </div>
                <p className="text-lg font-semibold text-foreground">{config.marketStats.pricePerSqft}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Avg Rental Rates</h3>
                </div>
                <p className="text-lg font-semibold text-foreground">{config.marketStats.avgRental}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Rental Yield</h3>
                </div>
                <p className="text-lg font-semibold text-foreground">{config.marketStats.rentalYield}</p>
              </div>
            </div>
          </section>

          {/* Neighborhood Guide Section */}
          <section id="neighborhood-guide" className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
              Living in {config.displayName}
            </h2>
            
            {/* Location & Transportation */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bus className="h-5 w-5 text-primary" />
                Location & Transportation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Walk Score</span>
                    <span className="font-semibold text-foreground">{config.location.walkScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Transit Score</span>
                    <span className="font-semibold text-foreground">{config.location.transitScore}/100</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {config.location.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Schools */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Schools & Education
              </h3>
              <div className="space-y-2">
                {config.schools.map((school, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">{school.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-primary font-medium">{school.rating}</span>
                      <span className="text-muted-foreground">{school.distance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopping & Dining */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Shopping & Dining
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.shopping.map((shop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">{shop.name}</span>
                    <span className="text-sm text-muted-foreground">{shop.distance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parks & Recreation */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TreePine className="h-5 w-5 text-primary" />
                Parks & Recreation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.parks.map((park, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">{park.name}</span>
                    <span className="text-sm text-muted-foreground">{park.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Investment Analysis Section */}
          <section id="investment-analysis" className="mb-12 bg-primary/5 rounded-xl p-6 md:p-8 border border-primary/20">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {config.displayName} Investment Potential
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {config.investmentAnalysis}
            </p>
            <Link to="/calculator">
              <Button className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Calculate Your ROI
              </Button>
            </Link>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
              Frequently Asked Questions About {config.displayName}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {config.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Related Neighborhoods */}
          <section className="bg-muted/30 rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Explore More Neighborhoods
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NEIGHBORHOOD_SEO_CONFIG)
                .filter(([key]) => key !== neighborhoodSlug)
                .slice(0, 8)
                .map(([key, neighborhood]) => (
                  <Link key={key} to={`/${key}-presale`}>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-muted transition-colors px-3 py-1.5"
                    >
                      {neighborhood.displayName}, {neighborhood.city}
                    </Badge>
                  </Link>
                ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
