import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "@/components/seo/Helmet";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, MapPin, Home, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

// City configuration with SEO data - Optimized for exact target keywords
const CITY_CONFIG: Record<string, {
  name: string;
  region: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  longDescription: string;
  neighborhoods: string[];
  keywords: string[];
  faqs: { question: string; answer: string }[];
}> = {
  "surrey": {
    name: "Surrey",
    region: "Fraser Valley",
    metaTitle: "Surrey Presale Condos & Townhomes 2026 | VIP Pricing | Presale Properties",
    metaDescription: "Browse Surrey presale condos and townhomes from $400K. VIP access to pricing not available to the public. $0 cost to you. Book your free consultation.",
    h1: "Surrey New Condos & Presale Properties",
    description: "Browse New Construction & Presale Condos in Surrey 2026. Discover presale condos and townhomes across Cloverdale, South Surrey, Guildford & more.",
    longDescription: "Surrey is one of the fastest-growing cities in Metro Vancouver, offering diverse presale opportunities from urban condos in City Centre to family townhomes in Clayton Heights and luxury developments in South Surrey. With excellent transit connections including SkyTrain, new schools, and major amenities, Surrey presales offer exceptional value for first-time buyers and investors alike.",
    neighborhoods: ["City Centre", "Cloverdale", "South Surrey", "Guildford", "Fleetwood", "Clayton Heights", "Whalley", "Newton"],
    keywords: ["Surrey new condos", "presale condos Surrey", "presale townhomes Surrey", "Surrey presale properties 2026", "new construction Surrey", "VIP access presale Surrey"],
    faqs: [
      { question: "How to buy presale condo BC – Surrey edition?", answer: "Buying a presale condo in Surrey starts with registering with a VIP access list to receive floor plans and pricing before public release. You'll review the disclosure statement, sign the contract, and pay deposits (typically 15-20%) over 12-18 months before completion." },
      { question: "What is the deposit structure for presale condos in Surrey?", answer: "Surrey presale condos typically require 15-20% deposits paid in installments. Common structures include 5% at signing, 5% in 90 days, 5% in 180 days, and 5% at 1 year. Some developers offer reduced deposits or extended schedules as incentives." },
      { question: "What is REDMA and how does it apply to Surrey presales?", answer: "REDMA (Real Estate Development Marketing Act) is BC legislation that protects presale buyers. It requires developers to file a disclosure statement with details about the project, strata fees, and your right to rescind within 7 days of signing a presale contract." }
    ]
  },
  "langley": {
    name: "Langley",
    region: "Fraser Valley",
    metaTitle: "Langley Presale Condos & Townhomes 2026 | VIP Access | Presale Properties",
    metaDescription: "Explore Langley presale condos and townhomes near the new SkyTrain extension. VIP pricing from $399K. 400+ families helped. Free consultation.",
    h1: "Langley New Condos & Presale Townhomes",
    description: "Explore presale condos and townhomes in Langley, BC. New construction projects in Willowbrook, Murrayville, Walnut Grove & Langley City with VIP pricing and floor plans.",
    longDescription: "Langley offers the perfect blend of suburban living and urban convenience, with presale developments ranging from modern condos in Willoughby to spacious townhomes in Murrayville. Known for excellent schools, wine country, and family-friendly communities, Langley presales attract buyers seeking quality lifestyle at competitive prices.",
    neighborhoods: ["Willowbrook", "Willoughby", "Murrayville", "Walnut Grove", "Langley City", "Aldergrove", "Brookswood"],
    keywords: ["Langley new condos", "presale townhomes Langley", "Langley presale 2026", "new construction Langley", "VIP access presale Langley", "Willoughby presale condos"],
    faqs: [
      { question: "How to buy presale condo BC – Langley edition?", answer: "To buy a presale condo in Langley, register for VIP access to receive floor plans and presale pricing sheets before public launch. Work with a realtor familiar with Langley developments to review the disclosure statement and negotiate the best incentives." },
      { question: "What deposit structure can I expect for Langley presales?", answer: "Langley presale condos and townhomes typically require 10-20% deposits. Many developers in Langley offer flexible structures such as 5% at signing and 5% at completion, making it more accessible for first-time buyers." },
      { question: "What presale contract BC FAQ should Langley buyers know?", answer: "Key points for Langley presale contracts include the 7-day rescission period under REDMA, assignment restrictions, completion date estimates, and GST implications. Always have a lawyer review your presale contract before the rescission period ends." }
    ]
  },
  "coquitlam": {
    name: "Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Coquitlam Presale Condos & Townhomes 2026 | VIP Access | Presale Properties",
    metaDescription: "Browse Coquitlam presale condos and townhomes with VIP pricing. Near Evergreen SkyTrain. $0 cost to buyers. Book a free 15-min consultation.",
    h1: "Coquitlam New Condos & Presale Properties",
    description: "Find presale condos and townhomes in Coquitlam, BC. New construction near Evergreen Line, Burquitlam, Burke Mountain & Coquitlam Centre with VIP access and pricing.",
    longDescription: "Coquitlam is a premier destination for presale buyers, featuring transit-oriented developments along the Evergreen Line and master-planned communities on Burke Mountain. With stunning mountain views, excellent schools, and world-class amenities at Coquitlam Centre, presales here offer strong investment potential and lifestyle appeal.",
    neighborhoods: ["Burquitlam", "Burke Mountain", "Coquitlam Centre", "Maillardville", "Westwood Plateau", "Austin Heights", "Town Centre"],
    keywords: ["Coquitlam new condos", "presale condos Coquitlam", "Coquitlam presale 2026", "new construction Coquitlam", "Burke Mountain presale", "Evergreen Line condos"],
    faqs: [
      { question: "How to buy presale condo BC in Coquitlam?", answer: "Buying a presale in Coquitlam involves registering for VIP access, reviewing floor plans and pricing, signing the presale contract, and paying deposits. Focus on transit-oriented projects near Evergreen Line stations for best resale potential." },
      { question: "What is the deposit structure for Coquitlam presale condos?", answer: "Coquitlam presale deposits typically range from 15-25% paid over 12-24 months. High-rise projects near SkyTrain may require higher deposits, while Burke Mountain townhomes often offer more flexible terms." },
      { question: "What is REDMA presale definition for Coquitlam buyers?", answer: "REDMA (Real Estate Development Marketing Act) governs all BC presales including Coquitlam. It mandates disclosure statements, a 7-day rescission period, and trust protection for deposits. Understanding REDMA is essential before signing any presale contract." }
    ]
  },
  "burnaby": {
    name: "Burnaby",
    region: "Metro Vancouver",
    metaTitle: "Burnaby New Condos & Presale Properties 2026 | Metrotown",
    metaDescription: "New condos & presale projects in Burnaby. Metrotown, Lougheed, Brentwood. Near SkyTrain. Download floor plans. Never lived in, full warranty. From $450K.",
    h1: "Burnaby New Condos & Presale Properties",
    description: "Discover presale condos in Burnaby, BC. New construction at Metrotown, Brentwood, Lougheed & Edmonds near SkyTrain with VIP pricing and floor plans.",
    longDescription: "Burnaby offers some of the most sought-after presale opportunities in Metro Vancouver, with high-rise developments at Metrotown and Brentwood Town Centre. Excellent SkyTrain connectivity, major shopping destinations, and proximity to Vancouver make Burnaby presales attractive to both end-users and investors.",
    neighborhoods: ["Metrotown", "Brentwood", "Lougheed", "Edmonds", "Highgate", "Burnaby Heights", "Capitol Hill"],
    keywords: ["Burnaby new condos", "presale condos Burnaby", "Metrotown presale condos", "Burnaby presale 2026", "new construction Burnaby", "Brentwood presale"],
    faqs: [
      { question: "How to buy presale condo BC at Metrotown?", answer: "To buy a presale at Metrotown, register with developers early for VIP access. Metrotown presales are highly competitive, so being on VIP lists ensures you receive floor plans and pricing before public launch, giving you first choice of units." },
      { question: "What deposit structure applies to Burnaby presales?", answer: "Burnaby presale condos typically require 20-25% deposits due to high demand. Premium locations like Brentwood and Metrotown may require larger deposits, while Lougheed and Edmonds projects may offer more flexible terms." },
      { question: "What presale contract BC FAQ should Burnaby buyers review?", answer: "Burnaby presale contracts should be reviewed for completion timelines, assignment restrictions, and developer reputation. Ensure you understand the sunset clause, which allows either party to terminate if completion is delayed beyond a certain date." }
    ]
  },
  "abbotsford": {
    name: "Abbotsford",
    region: "Fraser Valley",
    metaTitle: "Abbotsford Presale Condos & Townhomes 2026 | VIP Pricing | Presale Properties",
    metaDescription: "Find Abbotsford presale condos and townhomes from $350K. Expert buyer representation at $0 cost. Get VIP access to exclusive pricing today.",
    h1: "Abbotsford New Condos & Presale Properties",
    description: "Browse presale condos and townhomes in Abbotsford, BC. New construction in West Abbotsford, Clearbrook & Mill Lake area with VIP pricing and floor plans.",
    longDescription: "Abbotsford offers exceptional value for presale buyers, with spacious townhomes and affordable condos in a family-friendly setting. Known for berry farms, mountain views, and a growing downtown core, Abbotsford presales attract first-time buyers and families priced out of Vancouver.",
    neighborhoods: ["West Abbotsford", "Clearbrook", "Mill Lake", "Historic Downtown", "Matsqui", "Auguston"],
    keywords: ["Abbotsford new condos", "presale condos Abbotsford", "Abbotsford presale 2026", "affordable presale BC", "new construction Abbotsford", "first-time buyer Abbotsford"],
    faqs: [
      { question: "How to buy presale condo BC in Abbotsford?", answer: "Buying a presale in Abbotsford follows the same BC process: register for VIP access, review disclosure statements, sign the contract, and pay deposits. Abbotsford offers more affordable entry points than Metro Vancouver, making it ideal for first-time buyers." },
      { question: "What deposit structure can I expect for Abbotsford presales?", answer: "Abbotsford presale condos often have more flexible deposit structures, typically 10-15% with some developers offering as low as 5% at signing. This makes Abbotsford one of the most accessible markets for presale buyers in the Fraser Valley." },
      { question: "What is REDMA and how does it protect Abbotsford presale buyers?", answer: "REDMA protects all BC presale buyers including those purchasing in Abbotsford. It requires developers to provide detailed disclosure statements and gives you 7 days to rescind your contract without penalty. Your deposits are also protected in trust." }
    ]
  },
  "vancouver": {
    name: "Vancouver",
    region: "Metro Vancouver",
    metaTitle: "Vancouver New Condos & Presale Properties 2026 | Downtown",
    metaDescription: "New condos & presale projects in Vancouver. Downtown, Yaletown, Mount Pleasant. Download floor plans & pricing. Never lived in, full warranty. From $600K.",
    h1: "Vancouver New Condos & Presale Properties",
    description: "Browse presale condos in Vancouver, BC. New construction in Downtown, Mount Pleasant, Cambie Corridor, East Van & Olympic Village with VIP access and pricing.",
    longDescription: "Vancouver remains the epicenter of presale development in BC, with world-class condos in Downtown, trendy lofts in Mount Pleasant, and family-friendly townhomes along the Cambie Corridor. Despite premium pricing, Vancouver presales offer unmatched lifestyle, transit access, and long-term appreciation potential.",
    neighborhoods: ["Downtown", "Mount Pleasant", "Cambie Corridor", "East Vancouver", "Olympic Village", "Kitsilano", "Yaletown", "Coal Harbour"],
    keywords: ["Vancouver new condos", "presale condos Vancouver", "Downtown Vancouver presale", "Vancouver presale 2026", "new construction Vancouver", "Yaletown presale condos"],
    faqs: [
      { question: "How to buy presale condo BC in Vancouver?", answer: "Buying a presale condo in Vancouver requires getting on VIP lists early, as units sell quickly. Register with developers directly or through a realtor to receive presale pricing sheets and floor plans before public launch. Be prepared to act fast with your deposit." },
      { question: "What deposit structure is typical for Vancouver presales?", answer: "Vancouver presale condos typically require 20-25% deposits, often paid as 5% at signing, 5% in 90 days, 5% in 180 days, and 5-10% at 1 year. Downtown and waterfront projects may require even higher deposits." },
      { question: "What presale contract BC FAQ should Vancouver buyers know?", answer: "Vancouver presale buyers should understand assignment restrictions, completion timelines, and the difference between estimated vs. guaranteed completion dates. Review the disclosure statement carefully and consult a lawyer before the 7-day rescission period expires." }
    ]
  },
  "richmond": {
    name: "Richmond",
    region: "Metro Vancouver",
    metaTitle: "Richmond New Condos & Presale Properties 2026 | From $500K",
    metaDescription: "New condos & presale projects in Richmond. City Centre, Brighouse. Download floor plans & pricing. Never lived in, full warranty. Move-in ready available.",
    h1: "Richmond New Condos & Presale Properties",
    description: "Explore presale condos in Richmond, BC. New construction near Canada Line, Richmond Centre, Steveston & Bridgeport with VIP pricing and floor plans.",
    longDescription: "Richmond combines urban convenience with waterfront living, offering presale condos near Canada Line stations and charming townhomes in Steveston. As a major employment hub with excellent Asian dining and shopping, Richmond presales appeal to diverse buyers seeking transit-oriented living.",
    neighborhoods: ["City Centre", "Steveston", "Bridgeport", "Aberdeen", "Ironwood", "East Richmond", "Thompson"],
    keywords: ["presale condos Richmond", "preconstruction condos BC", "new condo developments Richmond", "VIP access presale Richmond", "floorplans & pricing Richmond", "Canada Line condos"],
    faqs: [
      { question: "How to buy presale condo BC in Richmond?", answer: "Richmond presales are popular with investors and end-users alike. Register for VIP access through developers or realtors, review floor plans and pricing, and be prepared to decide quickly as Richmond units near Canada Line stations sell fast." },
      { question: "What deposit structure applies to Richmond presales?", answer: "Richmond presale condos typically require 15-20% deposits. Projects near Canada Line stations may require higher deposits due to demand, while East Richmond developments may offer more flexible terms." },
      { question: "What is REDMA presale definition for Richmond buyers?", answer: "REDMA governs all BC presales. Richmond buyers are protected by mandatory disclosure statements, a 7-day rescission period, and deposit trust requirements. Always review these protections before signing any presale contract." }
    ]
  },
  "delta": {
    name: "Delta",
    region: "South of Fraser",
    metaTitle: "Delta New Condos & Presale Properties 2026 | From $350K",
    metaDescription: "New condos & presale projects in Delta. North Delta, Ladner. Download floor plans & pricing. Never lived in, full warranty. From $350K.",
    h1: "Delta New Condos & Presale Properties",
    description: "Find presale condos and townhomes in Delta, BC. New construction in Tsawwassen, Ladner & North Delta communities with VIP pricing and floor plans.",
    longDescription: "Delta offers unique presale opportunities across three distinct communities: beachside living in Tsawwassen, village charm in Ladner, and suburban convenience in North Delta. With the Tsawwassen Mills, ferry terminal, and excellent schools, Delta presales attract families and retirees seeking quality lifestyle.",
    neighborhoods: ["Tsawwassen", "Ladner", "North Delta", "Sunbury", "Scottsdale"],
    keywords: ["Delta new condos", "presale condos Delta", "Delta presale 2026", "new construction Delta", "Tsawwassen presale", "North Delta condos"],
    faqs: [
      { question: "How to buy presale condo BC in Delta?", answer: "Delta presales offer a quieter alternative to Metro Vancouver. Register for VIP access to Tsawwassen and Ladner developments, review disclosure statements, and take advantage of the more relaxed pace compared to Vancouver markets." },
      { question: "What deposit structure can I expect for Delta presales?", answer: "Delta presale condos and townhomes typically require 10-20% deposits with flexible payment schedules. Tsawwassen waterfront projects may require higher deposits, while North Delta offers more accessible terms." },
      { question: "What presale contract BC FAQ applies to Delta?", answer: "Delta presale contracts follow BC-wide rules under REDMA. Pay attention to completion timelines, as Delta projects may have different schedules than urban developments. Ensure your contract clearly states the estimated completion date and any sunset clauses." }
    ]
  },
  "port-coquitlam": {
    name: "Port Coquitlam",
    region: "Tri-Cities",
    metaTitle: "Presale Condos Port Coquitlam – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale condos & townhomes in Port Coquitlam with floorplans, pricing sheets & VIP priority access. Browse preconstruction condos near West Coast Express.",
    h1: "Presale Condos Port Coquitlam – New PoCo Condos Presale Pricing & Floor Plans",
    description: "Discover presale condos and townhomes in Port Coquitlam, BC. New construction near West Coast Express and Traboulay Trail with VIP pricing and floor plans.",
    longDescription: "Port Coquitlam offers excellent presale value in the Tri-Cities, with family-oriented townhomes and condos near transit and the scenic Traboulay PoCo Trail. With a revitalized downtown and strong community feel, PoCo presales attract young families and commuters.",
    neighborhoods: ["Downtown", "Citadel Heights", "Mary Hill", "Riverwood", "Oxford Heights"],
    keywords: ["presale condos Port Coquitlam", "new townhomes presale PoCo", "preconstruction condos BC", "VIP access presale Port Coquitlam", "Tri-Cities presale condos"],
    faqs: [
      { question: "How to buy presale condo BC in Port Coquitlam?", answer: "Port Coquitlam presales offer excellent value in the Tri-Cities. Register for VIP access, review floor plans and pricing, and consider proximity to West Coast Express for commuting convenience." },
      { question: "What deposit structure applies to PoCo presales?", answer: "Port Coquitlam presale deposits typically range from 10-20%, with many developers offering flexible payment schedules to attract first-time buyers and young families." },
      { question: "What is REDMA and how does it apply?", answer: "REDMA protects all BC presale buyers. In Port Coquitlam, you have the same 7-day rescission period, deposit protection, and disclosure statement requirements as anywhere else in BC." }
    ]
  },
  "port-moody": {
    name: "Port Moody",
    region: "Tri-Cities",
    metaTitle: "Presale Condos Port Moody – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale condos in Port Moody with floorplans, pricing sheets & VIP priority access. Browse Moody Centre, Newport Village & Inlet Centre near Evergreen Line.",
    h1: "Presale Condos Port Moody – New Port Moody Condos Presale Pricing & Floor Plans",
    description: "Find presale condos in Port Moody, BC. New construction at Moody Centre, Newport Village & Inlet Centre near Evergreen Line with VIP access and pricing.",
    longDescription: "Port Moody is a boutique presale market known for waterfront living, craft breweries, and stunning natural beauty. With Evergreen Line connectivity and the charming Rocky Point area, Port Moody presales command premium prices but offer exceptional lifestyle value.",
    neighborhoods: ["Moody Centre", "Newport Village", "Inlet Centre", "Glenayre", "College Park"],
    keywords: ["presale condos Port Moody", "preconstruction condos BC", "new condo developments Port Moody", "VIP access presale Port Moody", "Evergreen Line condos Port Moody"],
    faqs: [
      { question: "How to buy presale condo BC in Port Moody?", answer: "Port Moody is a premium boutique market. Register early for VIP access as units sell quickly. Focus on projects near Evergreen Line stations for best transit connectivity and resale value." },
      { question: "What deposit structure is typical for Port Moody?", answer: "Port Moody presales typically require 20% deposits due to high demand. Waterfront and SkyTrain-adjacent projects may require deposits at the higher end of this range." },
      { question: "What presale contract BC FAQ should Port Moody buyers know?", answer: "Port Moody buyers should pay attention to view protection clauses and strata fees for waterfront buildings. Review the disclosure statement for any planned developments nearby that could affect your views." }
    ]
  },
  "new-westminster": {
    name: "New Westminster",
    region: "Metro Vancouver",
    metaTitle: "Presale Condos New Westminster – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale condos in New Westminster with floorplans, pricing sheets & VIP priority access. Browse Sapperton, Quayside & Downtown near SkyTrain.",
    h1: "Presale Condos New Westminster – New West Condos Presale Pricing & Floor Plans",
    description: "Explore presale condos in New Westminster, BC. New construction at Sapperton, Quayside & Downtown near SkyTrain stations with VIP pricing and floor plans.",
    longDescription: "New Westminster offers historic charm meets modern presale development, with waterfront condos at Quayside and transit-oriented living near multiple SkyTrain stations. As one of the most affordable entry points to Metro Vancouver's SkyTrain network, New West presales attract savvy buyers.",
    neighborhoods: ["Downtown", "Sapperton", "Quayside", "Uptown", "Queensborough", "Brow of the Hill"],
    keywords: ["presale condos New Westminster", "preconstruction condos BC", "new condo developments New West", "VIP access presale New Westminster", "SkyTrain condos New Westminster"],
    faqs: [
      { question: "How to buy presale condo BC in New Westminster?", answer: "New Westminster offers some of Metro Vancouver's best presale value near SkyTrain. Register for VIP access with developers at Sapperton, Quayside, or Downtown for early access to floor plans and pricing." },
      { question: "What deposit structure applies to New West presales?", answer: "New Westminster presale deposits typically range from 15-20%, with some developers offering reduced deposits to attract first-time buyers seeking affordable SkyTrain-adjacent living." },
      { question: "What is REDMA presale definition for New West buyers?", answer: "REDMA protects New Westminster presale buyers with mandatory disclosure statements, a 7-day rescission period, and deposit trust requirements. Review all documents carefully with your lawyer." }
    ]
  },
  "north-vancouver": {
    name: "North Vancouver",
    region: "North Shore",
    metaTitle: "Presale Condos North Vancouver – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale condos in North Vancouver with floorplans, pricing sheets & VIP priority access. Browse Lonsdale, Lynn Valley & Lower Lonsdale near SeaBus.",
    h1: "Presale Condos North Vancouver – New North Van Condos Presale Pricing & Floor Plans",
    description: "Browse presale condos in North Vancouver, BC. New construction at Lonsdale, Central Lonsdale, Lynn Valley & Lower Lonsdale with VIP pricing and floor plans.",
    longDescription: "North Vancouver presales offer mountain lifestyle with urban convenience, from waterfront developments at Lonsdale Quay to family townhomes in Lynn Valley. With SeaBus connectivity and world-class outdoor recreation, North Van presales attract active lifestyle buyers.",
    neighborhoods: ["Lower Lonsdale", "Central Lonsdale", "Lynn Valley", "Capilano", "Deep Cove", "Edgemont"],
    keywords: ["presale condos North Vancouver", "preconstruction condos BC", "new condo developments North Van", "VIP access presale North Vancouver", "Lonsdale presale condos"],
    faqs: [
      { question: "How to buy presale condo BC in North Vancouver?", answer: "North Vancouver presales are highly competitive. Register early for VIP access, especially for Lonsdale and waterfront projects. Be prepared to act quickly and have your financing pre-approved." },
      { question: "What deposit structure is typical for North Van presales?", answer: "North Vancouver presales typically require 20-25% deposits. Lower Lonsdale and waterfront projects command higher deposits, while Lynn Valley townhomes may offer more flexible terms." },
      { question: "What presale contract BC FAQ should North Van buyers review?", answer: "North Vancouver buyers should review mountain view protection, strata restrictions on rentals, and pet policies. Many North Van buildings have specific regulations that differ from other Metro Vancouver areas." }
    ]
  },
  "white-rock": {
    name: "White Rock",
    region: "South of Fraser",
    metaTitle: "Presale Condos White Rock – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale condos in White Rock with floorplans, pricing sheets & VIP priority access. Browse oceanfront presales near White Rock Beach & Semiahmoo.",
    h1: "Presale Condos White Rock – New White Rock Condos Presale Pricing & Floor Plans",
    description: "Discover presale condos in White Rock, BC. New construction near White Rock Beach, Semiahmoo & Five Corners with VIP pricing and floor plans.",
    longDescription: "White Rock is a premium presale market known for oceanfront living, the iconic pier, and resort-style atmosphere. With limited land supply and high demand, White Rock presales offer both lifestyle appeal and investment potential for discerning buyers.",
    neighborhoods: ["Town Centre", "Semiahmoo", "East Beach", "West Beach", "Five Corners"],
    keywords: ["presale condos White Rock", "preconstruction condos BC", "oceanfront condos White Rock", "VIP access presale White Rock", "Semiahmoo presale condos"],
    faqs: [
      { question: "How to buy presale condo BC in White Rock?", answer: "White Rock presales are premium opportunities. Register for VIP access early, as oceanfront and ocean-view units sell quickly. Work with a realtor experienced in White Rock's unique presale market." },
      { question: "What deposit structure applies to White Rock presales?", answer: "White Rock presales typically require 20-25% deposits. Oceanfront projects may require higher deposits due to limited supply and premium pricing." },
      { question: "What presale contract BC FAQ should White Rock buyers know?", answer: "White Rock buyers should review view protection clauses carefully, as the city has specific bylaws. Also review strata fees for oceanfront buildings which tend to be higher due to maintenance requirements." }
    ]
  },
  "maple-ridge": {
    name: "Maple Ridge",
    region: "Fraser Valley",
    metaTitle: "Presale Townhomes Maple Ridge – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale townhomes in Maple Ridge with floorplans, pricing sheets & VIP priority access. Browse Albion, Silver Valley & downtown near Golden Ears.",
    h1: "Presale Townhomes Maple Ridge – New Maple Ridge Townhomes Presale Pricing & Floor Plans",
    description: "Find presale townhomes in Maple Ridge, BC. New construction in Albion, Silver Valley & downtown near Golden Ears with VIP pricing and floor plans.",
    longDescription: "Maple Ridge offers exceptional presale value for families, with spacious townhomes in master-planned communities like Silver Valley. With Golden Ears Provincial Park nearby and improving transit connections, Maple Ridge presales attract outdoor enthusiasts and value-seekers.",
    neighborhoods: ["Albion", "Silver Valley", "Downtown", "Cottonwood", "Hammond", "Whonnock"],
    keywords: ["presale townhomes Maple Ridge", "new townhomes presale Maple Ridge", "preconstruction condos BC", "VIP access presale Maple Ridge", "Fraser Valley presale townhomes"],
    faqs: [
      { question: "How to buy presale condo BC in Maple Ridge?", answer: "Maple Ridge presales focus heavily on townhomes. Register for VIP access with developers in Silver Valley and Albion, review floor plans and pricing, and take advantage of more affordable entry points compared to Metro Vancouver." },
      { question: "What deposit structure is typical for Maple Ridge?", answer: "Maple Ridge presale townhomes typically require 10-15% deposits with flexible payment schedules, making it one of the most accessible presale markets in the Lower Mainland." },
      { question: "What is REDMA and how does it protect buyers?", answer: "REDMA provides the same protections for Maple Ridge buyers as anywhere in BC: disclosure statements, 7-day rescission, and deposit trust requirements. Review all documents with a lawyer familiar with presale contracts." }
    ]
  },
  "chilliwack": {
    name: "Chilliwack",
    region: "Fraser Valley",
    metaTitle: "Presale Homes Chilliwack – Floorplans & Pricing | PresaleProperties.com",
    metaDescription: "Find new presale townhomes & single-family homes in Chilliwack with floorplans, pricing sheets & VIP priority access. Browse Sardis, Promontory & Vedder.",
    h1: "Presale Homes Chilliwack – New Chilliwack Homes Presale Pricing & Floor Plans",
    description: "Explore presale homes in Chilliwack, BC. New construction townhomes and single-family homes in Sardis, Promontory & Vedder with VIP pricing and floor plans.",
    longDescription: "Chilliwack offers the most affordable presale opportunities in the Lower Mainland, with spacious townhomes and single-family homes surrounded by stunning mountain scenery. Ideal for remote workers and families seeking value, Chilliwack presales provide exceptional square footage per dollar.",
    neighborhoods: ["Sardis", "Promontory", "Vedder", "Yarrow", "Garrison", "Downtown"],
    keywords: ["presale homes Chilliwack", "new townhomes presale Chilliwack", "preconstruction condos BC", "VIP access presale Chilliwack", "affordable presale BC Chilliwack"],
    faqs: [
      { question: "How to buy presale condo BC in Chilliwack?", answer: "Chilliwack offers BC's most affordable presales. Register for VIP access with developers, review floor plans and pricing, and enjoy more relaxed timelines compared to competitive Metro Vancouver markets." },
      { question: "What deposit structure can I expect in Chilliwack?", answer: "Chilliwack presales offer some of BC's most flexible deposit structures, often as low as 5-10% with extended payment schedules. This makes Chilliwack ideal for first-time buyers." },
      { question: "What presale contract BC FAQ applies to Chilliwack?", answer: "Chilliwack presale contracts follow standard BC rules under REDMA. Pay attention to completion timelines and ensure the disclosure statement accurately reflects the final product and any included upgrades." }
    ]
  }
};

const STATUS_OPTIONS = [
  { value: "any", label: "All Status" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "active", label: "Selling Now" },
  { value: "sold_out", label: "Sold Out" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "All Types" },
  { value: "condo", label: "Condos" },
  { value: "townhome", label: "Townhomes" },
  { value: "mixed", label: "Mixed" },
];

const PRICE_RANGES = [
  { value: "any", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "completion", label: "Completion Date" },
];

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
  featured_image: string | null;
  gallery_images: string[] | null;
  is_featured: boolean;
};

export default function CityPresalePage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cityConfig = citySlug ? CITY_CONFIG[citySlug] : null;
  const cityName = cityConfig?.name || "";

  // Get filter values from URL params
  const filters = {
    status: searchParams.get("status") || "any",
    projectType: searchParams.get("type") || "any",
    priceRange: searchParams.get("price") || "any",
    sort: searchParams.get("sort") || "newest",
  };

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["city-presale-projects", cityName, filters, currentPage],
    queryFn: async () => {
      if (!cityName) return { projects: [], totalCount: 0 };

      // First, get total count
      let countQuery = supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("city", cityName);

      // Apply filters to count query
      if (filters.status !== "any") {
        countQuery = countQuery.eq("status", filters.status as "coming_soon" | "active" | "sold_out");
      }
      if (filters.projectType !== "any") {
        countQuery = countQuery.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        countQuery = countQuery.gte("starting_price", min).lte("starting_price", max);
      }

      const { count } = await countQuery;

      // Then get paginated data
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, is_featured")
        .eq("is_published", true)
        .eq("city", cityName);

      // Apply filters
      if (filters.status !== "any") {
        query = query.eq("status", filters.status as "coming_soon" | "active" | "sold_out");
      }
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }

      // Apply sorting
      switch (filters.sort) {
        case "price-asc":
          query = query.order("starting_price", { ascending: true, nullsFirst: false });
          break;
        case "price-desc":
          query = query.order("starting_price", { ascending: false, nullsFirst: false });
          break;
        case "completion":
          query = query.order("completion_year", { ascending: true }).order("completion_month", { ascending: true });
          break;
        default:
          query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: projectsData, error } = await query;
      if (error) throw error;

      return { projects: projectsData as Project[], totalCount: count || 0 };
    },
    enabled: !!cityName,
  });

  // Query for map projects with coordinates
  const { data: mapProjects } = useQuery({
    queryKey: ["city-presale-map-projects", cityName, filters],
    queryFn: async () => {
      if (!cityName) return [];

      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .eq("city", cityName)
        .not("map_lat", "is", null)
        .not("map_lng", "is", null);

      // Apply filters
      if (filters.status !== "any") {
        query = query.eq("status", filters.status as "coming_soon" | "active" | "sold_out");
      }
      if (filters.projectType !== "any") {
        query = query.eq("project_type", filters.projectType as "condo" | "townhome" | "mixed");
      }
      if (filters.priceRange !== "any") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        query = query.gte("starting_price", min).lte("starting_price", max);
      }

      query = query.order("is_featured", { ascending: false }).limit(200);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityName,
    staleTime: 5 * 60 * 1000,
  });

  const projects = data?.projects || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter by search query client-side
  const filteredProjects = useMemo(() => {
    if (!projects || !searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "any" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["city-presale-projects"] });
  }, [queryClient]);

  const activeFilterCount = [
    filters.status !== "any",
    filters.projectType !== "any",
    filters.priceRange !== "any",
  ].filter(Boolean).length;

  if (!cityConfig) {
    // Signal 404 to prerender services
    if (typeof window !== "undefined") {
      (window as any).prerenderReady = true;
      (window as any).prerenderStatusCode = 404;
    }
    
    return (
      <>
        <Helmet>
          <title>City Not Found | PresaleProperties.com</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="prerender-status-code" content="404" />
        </Helmet>
        <ConversionHeader />
        <main className="min-h-screen bg-background py-20">
          <div className="container text-center">
            <h1 className="text-3xl font-bold mb-4">City Not Found</h1>
            <p className="text-muted-foreground mb-8">The city you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/presale-projects">View All Projects</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Use SEO-friendly canonical URL format
  const canonicalUrl = `https://presaleproperties.com/${citySlug}-presale-condos`;
  const currentYear = new Date().getFullYear();

  // Use exact keyword templates from CITY_CONFIG
  const seoTitle = cityConfig.metaTitle;
  const seoDescription = cityConfig.metaDescription;

  // Enhanced structured data with LocalBusiness context
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Presale Condos ${cityName}, BC - New Construction Pricing & Floor Plans`,
    "description": cityConfig.longDescription,
    "url": canonicalUrl,
    "numberOfItems": totalCount,
    "itemListElement": projects?.slice(0, 10).map((project, index) => {
      // Generate SEO-friendly URL for each project
      const neighborhoodSlug = (project.neighborhood || project.city).toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
      const typeSlug = project.project_type === 'townhome' ? 'townhomes' : 
                       project.project_type === 'mixed' ? 'homes' : 'condos';
      const projectSeoUrl = `https://presaleproperties.com/${neighborhoodSlug}-presale-${typeSlug}-${project.slug}`;
      
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "RealEstateListing",
          "name": project.name,
          "url": projectSeoUrl,
          "image": project.featured_image,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": project.city,
            "addressRegion": "BC",
            "addressCountry": "CA"
          },
          "offers": project.starting_price ? {
            "@type": "Offer",
            "priceCurrency": "CAD",
            "price": project.starting_price,
            "availability": project.status === "sold_out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock"
          } : undefined
        }
      };
    }) || []
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://presaleproperties.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Presale Projects",
        "item": "https://presaleproperties.com/presale-projects"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `Presale Condos ${cityName}`,
        "item": canonicalUrl
      }
    ]
  };

  // FAQ Schema with city-specific educational content and general FAQs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      // City-specific educational FAQs from config
      ...cityConfig.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      })),
      // Dynamic city FAQs
      {
        "@type": "Question",
        "name": `How many presale projects are available in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `There are currently ${totalCount} presale projects available in ${cityName}, BC. Browse condos, townhomes, and new condo developments with VIP pricing, floorplans & pricing sheets, and early access registration.`
        }
      },
      {
        "@type": "Question",
        "name": `What neighborhoods in ${cityName} have presale developments?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Popular neighborhoods for presale condos ${cityName} include ${cityConfig.neighborhoods.slice(0, 5).join(", ")}. Each area offers unique lifestyle benefits and investment opportunities for preconstruction condos BC buyers.`
        }
      }
    ]
  };

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
        <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Project Type</label>
        <Select value={filters.projectType} onValueChange={(v) => updateFilter("type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Starting Price</label>
        <Select value={filters.priceRange} onValueChange={(v) => updateFilter("price", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-muted-foreground px-4">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Related cities for internal linking
  const relatedCities = Object.entries(CITY_CONFIG)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 6);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={cityConfig.keywords.join(", ")} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PresaleProperties.com" />
        <meta property="og:locale" content="en_CA" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* Geo */}
        <meta name="geo.region" content="CA-BC" />
        <meta name="geo.placename" content={cityName} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="container px-4 py-12 md:py-16 lg:py-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link to="/presale-projects" className="hover:text-foreground transition-colors">Presale Projects</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{cityName}</span>
            </nav>

            <div className="max-w-4xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <MapPin className="h-3 w-3 mr-1" />
                {cityConfig.region}
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                {cityConfig.h1}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                {cityConfig.longDescription}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {cityConfig.neighborhoods.slice(0, 6).map((neighborhood) => (
                  <Badge key={neighborhood} variant="outline" className="text-sm">
                    {neighborhood}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{totalCount}</span>
                  <span className="text-muted-foreground">Active Projects</span>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/map-search?mode=presale&city=${cityName}`}>
                    <Map className="h-4 w-4 mr-2" />
                    View Map
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PullToRefresh onRefresh={handleRefresh}>
          <section className="container px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Desktop Sidebar Filters */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24 space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Filter Projects</h3>
                    <FilterControls />
                  </div>

                  {/* Sorting */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                    <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Mobile Controls */}
                <div className="flex items-center gap-3 mb-6 lg:hidden">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterControls />
                        <div className="mt-6">
                          <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                          <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Search */}
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects in this city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {totalCount} projects
                  </p>
                </div>

                {/* Results */}
                {isLoading ? (
                  <LoadingSkeleton />
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-16">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search query.
                    </p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {filteredProjects.map((project) => (
                        <PresaleProjectCard
                          key={project.id}
                          id={project.id}
                          name={project.name}
                          slug={project.slug}
                          city={project.city}
                          neighborhood={project.neighborhood}
                          status={project.status}
                          projectType={project.project_type}
                          completionYear={project.completion_year}
                          startingPrice={project.starting_price}
                          featuredImage={project.featured_image}
                          galleryImages={project.gallery_images}
                        />
                      ))}
                    </div>
                    <PaginationControls />
                  </>
                )}
              </div>
            </div>
          </section>
        </PullToRefresh>

        {/* SEO Content Section */}
        <section className="bg-muted/30 border-t border-border">
          <div className="container px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Why Buy Presale Condos in {cityName}?
              </h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {cityName} is one of the most dynamic real estate markets in British Columbia, 
                  offering exceptional opportunities for presale buyers. Whether you're looking for 
                  new condos Vancouver presale opportunities, presale townhomes {cityName}, or 
                  preconstruction condos BC, our marketplace connects you with VIP access presale 
                  listings, floorplans & pricing, and presale pricing sheets.
                </p>
                <h3 className="text-xl font-semibold mt-8 mb-4">Popular Neighborhoods for New Condo Developments</h3>
                <ul className="grid sm:grid-cols-2 gap-2 mb-8">
                  {cityConfig.neighborhoods.map((neighborhood) => (
                    <li key={neighborhood} className="flex items-center gap-2 text-muted-foreground">
                      <Home className="h-4 w-4 text-primary shrink-0" />
                      {neighborhood}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section with educational keywords */}
        <section className="border-t border-border">
          <div className="container px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Presale FAQs for {cityName} Buyers
              </h2>
              <div className="space-y-4">
                {cityConfig.faqs.map((faq, index) => (
                  <div key={index} className="bg-card rounded-lg border p-6">
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Learn more about how to buy presale condo BC in our comprehensive guide.
                </p>
                <Link to="/buyers-guide">
                  <Button variant="outline">
                    Read the Presale Buyer's Guide
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Cities Section with exact match anchor text */}
        <section className="border-t border-border bg-muted/30">
          <div className="container px-4 py-12 md:py-16">
            <h2 className="text-2xl font-bold mb-6">Explore Presale Condos in Other Cities</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedCities.map(([slug, config]) => (
                <Link
                  key={slug}
                  to={`/presale-condos/${slug}`}
                  className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all"
                  title={`Presale Condos ${config.name}`}
                >
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Presale Condos {config.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{config.region}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <NewConstructionBenefits />
        
        {/* Large Map Section - Shows filtered presale projects for this city */}
        <HomeUnifiedMapSection 
          initialMode="presale" 
          contextType="presale"
          externalPresaleProjects={mapProjects}
          cityContext={cityName}
          customHeading={`${cityName} Presale Projects on Map`}
        />
      </main>

      <MistakesGuideLeadMagnet location="city_presale_page" />

      <Footer />
    </>
  );
}
