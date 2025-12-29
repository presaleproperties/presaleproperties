import { useState, useMemo, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  Home,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Mail,
  Phone,
  User,
  Info,
  CheckCircle,
  Sparkles,
  HelpCircle,
  Wallet,
  Receipt,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// BC Property Transfer Tax calculation
function calculatePTT(
  price: number, 
  isPrimaryHome: boolean = false, 
  isNewConstruction: boolean = false
): { provincial: number; municipal: number; rebate: number; exemptionType: string; total: number } {
  // BC Property Transfer Tax
  let provincial = 0;
  if (price <= 200000) {
    provincial = price * 0.01;
  } else if (price <= 2000000) {
    provincial = 2000 + (price - 200000) * 0.02;
  } else if (price <= 3000000) {
    provincial = 2000 + 36000 + (price - 2000000) * 0.03;
  } else {
    provincial = 2000 + 36000 + 30000 + (price - 3000000) * 0.05;
  }
  
  // Additional 2% for foreign buyers in Metro Vancouver (not calculating for now)
  const municipal = 0;
  
  // PTT Exemption for primary home + new construction in BC
  // Full exemption when buying new construction as primary residence
  let rebate = 0;
  let exemptionType = "";
  
  if (isPrimaryHome && isNewConstruction) {
    // Full PTT exemption for primary residence + new construction
    rebate = provincial;
    exemptionType = "Primary Residence New Home Exemption";
  }
  
  return {
    provincial,
    municipal,
    rebate,
    exemptionType,
    total: Math.max(0, provincial + municipal - rebate)
  };
}

export default function MortgageCalculatorPage() {
  // Calculator inputs
  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [priceInput, setPriceInput] = useState("500,000");
  const [downPaymentOption, setDownPaymentOption] = useState("20");
  const [customDownPaymentPercent, setCustomDownPaymentPercent] = useState("");
  const [customDownPaymentDollar, setCustomDownPaymentDollar] = useState("");
  const [downPaymentInputMode, setDownPaymentInputMode] = useState<"percent" | "dollar">("percent");
  const [mortgageRate, setMortgageRate] = useState(3.79);
  const [mortgageRateInput, setMortgageRateInput] = useState("3.79");
  const [amortization, setAmortization] = useState(25);
  const [paymentFrequency, setPaymentFrequency] = useState<"monthly" | "semi-monthly" | "bi-weekly" | "accelerated-bi-weekly" | "weekly" | "accelerated-weekly">("monthly");
  const [propertyTax, setPropertyTax] = useState(2100);
  const [strataFee, setStrataFee] = useState(350);
  const [includeGST, setIncludeGST] = useState(true);
  const [isPrimaryHome, setIsPrimaryHome] = useState(true);
  const [rateType, setRateType] = useState<"fixed" | "variable">("fixed");
  
  // Closing costs
  const [lawyerFees, setLawyerFees] = useState(1500);
  const [titleInsurance, setTitleInsurance] = useState(250);
  const [homeInspection, setHomeInspection] = useState(500);
  const [appraisalFees, setAppraisalFees] = useState(350);
  
  // Monthly expenses
  const [utilities, setUtilities] = useState(150);
  const [homeInsurance, setHomeInsurance] = useState(100);
  
  // UI state
  const [showClosingDetails, setShowClosingDetails] = useState(false);
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);
  const [showAmortizationSchedule, setShowAmortizationSchedule] = useState(false);
  
  // Lead capture
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [inputsCompleted, setInputsCompleted] = useState(0);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Track input completions for soft lead capture trigger
  useEffect(() => {
    let count = 0;
    if (propertyPrice > 0) count++;
    if (downPaymentOption) count++;
    if (mortgageRate > 0) count++;
    if (amortization > 0) count++;
    if (paymentFrequency) count++;
    if (propertyTax > 0) count++;
    if (strataFee > 0) count++;
    
    setInputsCompleted(count);
    
    if (count >= 4 && !leadSubmitted) {
      setShowLeadForm(true);
      trackEvent("soft_lead_shown", getEventContext());
    }
  }, [propertyPrice, downPaymentOption, mortgageRate, amortization, paymentFrequency, propertyTax, strataFee, leadSubmitted]);

  // Debounced price for calculations
  const debouncedPrice = useDebounce(propertyPrice, 300);

  // Calculate total price including GST for new construction
  const totalPriceWithGST = useMemo(() => {
    if (includeGST) {
      return debouncedPrice * 1.05; // 5% GST
    }
    return debouncedPrice;
  }, [debouncedPrice, includeGST]);

  // Calculate down payment percentage based on input mode
  const downPaymentPercent = useMemo(() => {
    if (downPaymentOption === "custom") {
      if (downPaymentInputMode === "dollar") {
        const dollarValue = parseFloat(customDownPaymentDollar.replace(/[^0-9]/g, ''));
        if (!isNaN(dollarValue) && totalPriceWithGST > 0) {
          return (dollarValue / totalPriceWithGST) * 100;
        }
        return 20;
      } else {
        const customValue = parseFloat(customDownPaymentPercent);
        return isNaN(customValue) ? 20 : customValue;
      }
    }
    return parseFloat(downPaymentOption);
  }, [downPaymentOption, customDownPaymentPercent, customDownPaymentDollar, downPaymentInputMode, totalPriceWithGST]);

  // Main calculations
  const calculations = useMemo(() => {
    const basePrice = debouncedPrice;
    
    // GST (5% on new homes) - added to purchase price
    const gstAmount = includeGST ? basePrice * 0.05 : 0;
    
    // Total price including GST (this is what down payment is based on)
    const priceWithGST = basePrice + gstAmount;
    
    // Down payment is calculated on price + GST
    const downPayment = (priceWithGST * downPaymentPercent) / 100;
    
    // Mortgage principal = total price with GST - down payment
    // The mortgage covers what you don't pay upfront
    const principal = priceWithGST - downPayment;
    
    // CMHC insurance for down payments less than 20%
    let cmhcInsurance = 0;
    if (downPaymentPercent < 20) {
      if (downPaymentPercent >= 15) {
        cmhcInsurance = principal * 0.028;
      } else if (downPaymentPercent >= 10) {
        cmhcInsurance = principal * 0.031;
      } else {
        cmhcInsurance = principal * 0.04;
      }
    }
    
    // PST on CMHC (8% in BC)
    const pstOnCmhc = cmhcInsurance * 0.08;
    
    const mortgageAmount = principal + cmhcInsurance;
    
    // GST Rebate for new homes (36% of GST on homes up to $350,000, reduced for $350,000-$450,000)
    let gstRebate = 0;
    if (includeGST) {
      if (basePrice <= 350000) {
        gstRebate = gstAmount * 0.36;
      } else if (basePrice < 450000) {
        gstRebate = gstAmount * 0.36 * (1 - (basePrice - 350000) / 100000);
      }
    }
    
    // BC New Housing Rebate (71.43% of provincial portion, capped) - only for new construction
    let bcNewHousingRebate = 0;
    if (includeGST && basePrice <= 850000) {
      const pstEquivalent = basePrice * 0.07; // Provincial portion equivalent
      bcNewHousingRebate = Math.min(pstEquivalent * 0.7143, 42500);
      if (basePrice > 750000) {
        bcNewHousingRebate = bcNewHousingRebate * (1 - (basePrice - 750000) / 100000);
      }
    }
    
    // Property Transfer Tax - Primary home + new construction (GST) gets exemption
    const ptt = calculatePTT(basePrice, isPrimaryHome, includeGST);
    
    // Payment calculations based on frequency
    const annualRate = mortgageRate / 100;
    const isAccelerated = paymentFrequency.includes("accelerated");
    const baseFrequency = paymentFrequency.replace("accelerated-", "");
    
    const paymentsPerYear: Record<string, number> = {
      monthly: 12,
      "semi-monthly": 24,
      "bi-weekly": 26,
      weekly: 52
    };
    
    const periodsPerYear = paymentsPerYear[baseFrequency] || 12;
    const periodicRate = annualRate / 12; // Always use monthly compounding
    const monthlyPayment = mortgageAmount > 0 && periodicRate > 0
      ? (mortgageAmount * periodicRate * Math.pow(1 + periodicRate, amortization * 12)) /
        (Math.pow(1 + periodicRate, amortization * 12) - 1)
      : 0;
    
    // Calculate payment based on frequency
    let payment = monthlyPayment;
    if (baseFrequency === "bi-weekly") {
      payment = isAccelerated ? monthlyPayment / 2 : (monthlyPayment * 12) / 26;
    } else if (baseFrequency === "weekly") {
      payment = isAccelerated ? monthlyPayment / 4 : (monthlyPayment * 12) / 52;
    } else if (baseFrequency === "semi-monthly") {
      payment = monthlyPayment / 2;
    }
    
    // Effective annual payments for accelerated
    const effectivePaymentsPerYear = isAccelerated 
      ? (baseFrequency === "bi-weekly" ? 26 : 52)
      : periodsPerYear;
    
    // Total amounts (adjusted for accelerated payments)
    const effectiveAnnualPayment = payment * effectivePaymentsPerYear;
    const yearsToPayoff = isAccelerated 
      ? Math.log(1 / (1 - (mortgageAmount * (annualRate / effectivePaymentsPerYear)) / payment)) / 
        (effectivePaymentsPerYear * Math.log(1 + annualRate / effectivePaymentsPerYear))
      : amortization;
    
    const totalPaymentsAmount = effectiveAnnualPayment * (isAccelerated ? yearsToPayoff : amortization);
    const totalInterest = totalPaymentsAmount - mortgageAmount;
    
    // Property tax per payment period
    const propertyTaxPerPeriod = propertyTax > 0 ? propertyTax / periodsPerYear : 0;
    
    // Strata fee per payment period (assume monthly input)
    const strataPerPeriod = strataFee > 0 ? (strataFee * 12) / periodsPerYear : 0;
    
    // Monthly equivalents
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyHomeInsurance = homeInsurance;
    const monthlyUtilities = utilities;
    
    // Total monthly carrying costs
    const totalMonthlyCarrying = monthlyPayment + monthlyPropertyTax + strataFee + monthlyHomeInsurance + monthlyUtilities;
    
    // Cash to close breakdown:
    // - Down payment (calculated on priceWithGST, so GST is already included in down payment)
    // - PTT (on base price)
    // - PST on CMHC (if applicable)
    // - Closing costs (lawyer, title insurance, inspection, appraisal)
    // GST rebates are credited back to buyer at closing
    const cashToClose = downPayment + ptt.total + pstOnCmhc + lawyerFees + titleInsurance + homeInspection + appraisalFees - gstRebate - bcNewHousingRebate;
    
    return {
      propertyPrice: basePrice,
      priceWithGST,
      downPayment,
      downPaymentPercent,
      mortgageAmount,
      cmhcInsurance,
      pstOnCmhc,
      gstAmount,
      gstRebate,
      bcNewHousingRebate,
      ptt,
      payment,
      monthlyPayment,
      totalInterest,
      totalCost: totalPaymentsAmount + downPayment,
      propertyTaxPerPeriod,
      strataPerPeriod,
      monthlyPropertyTax,
      monthlyHomeInsurance,
      monthlyUtilities,
      totalMonthlyCarrying,
      cashToClose,
      lawyerFees,
      titleInsurance,
      homeInspection,
      appraisalFees,
      paymentsPerYear: periodsPerYear,
      totalPayments: amortization * periodsPerYear,
      yearsToPayoff: isAccelerated ? yearsToPayoff : amortization
    };
  }, [debouncedPrice, downPaymentPercent, mortgageRate, amortization, paymentFrequency, propertyTax, strataFee, includeGST, isPrimaryHome, lawyerFees, titleInsurance, homeInspection, appraisalFees, utilities, homeInsurance]);

  // Down payment comparison scenarios (like ratehub's 4-column view)
  const downPaymentComparison = useMemo(() => {
    const basePrice = debouncedPrice;
    // Use price with GST for down payment calculations
    const priceForDP = includeGST ? basePrice * 1.05 : basePrice;
    const annualRate = mortgageRate / 100;
    const periodicRate = annualRate / 12;
    
    // Calculate minimum down payment based on price (before GST for CMHC rules)
    let minDownPercent = 5;
    if (basePrice > 1500000) {
      minDownPercent = 20;
    } else if (basePrice > 500000) {
      // 5% of first $500K + 10% of rest
      const minDown = 25000 + (basePrice - 500000) * 0.1;
      minDownPercent = Math.ceil((minDown / basePrice) * 100);
    }
    
    // Create 4 scenarios with appropriate percentages
    const percentages = basePrice > 1500000 
      ? [20, 25, 30, 35]
      : [Math.max(5, minDownPercent), 10, 15, 20];
    
    return percentages.map((percent, index) => {
      // Down payment based on price with GST
      const downPayment = (priceForDP * percent) / 100;
      // Mortgage principal is base price minus the down payment allocated to base price
      const principal = basePrice - (downPayment * (basePrice / priceForDP));
      
      // CMHC insurance for down payments less than 20%
      let cmhcInsurance = 0;
      if (percent < 20) {
        if (percent >= 15) {
          cmhcInsurance = principal * 0.028;
        } else if (percent >= 10) {
          cmhcInsurance = principal * 0.031;
        } else {
          cmhcInsurance = principal * 0.04;
        }
      }
      
      const mortgageAmount = principal + cmhcInsurance;
      
      const monthlyPayment = mortgageAmount > 0 && periodicRate > 0
        ? (mortgageAmount * periodicRate * Math.pow(1 + periodicRate, amortization * 12)) /
          (Math.pow(1 + periodicRate, amortization * 12) - 1)
        : 0;
      
      const isSelected = Math.abs(percent - downPaymentPercent) < 0.5;
      const isMinimum = index === 0 && percent === minDownPercent;
      
      return {
        percent,
        downPayment,
        cmhcInsurance,
        mortgageAmount,
        monthlyPayment,
        isSelected,
        isMinimum
      };
    });
  }, [debouncedPrice, mortgageRate, amortization, downPaymentPercent, includeGST]);

  // Interest rate risk scenarios
  const rateScenarios = useMemo(() => {
    const scenarios = [
      { label: "Current Rate", rate: mortgageRate },
      { label: "-1%", rate: Math.max(0.5, mortgageRate - 1) },
      { label: "+1%", rate: mortgageRate + 1 },
      { label: "+2%", rate: mortgageRate + 2 },
    ];
    
    return scenarios.map(scenario => {
      const annualRate = scenario.rate / 100;
      const periodicRate = annualRate / 12;
      const monthlyPayment = calculations.mortgageAmount > 0 && periodicRate > 0
        ? (calculations.mortgageAmount * periodicRate * Math.pow(1 + periodicRate, amortization * 12)) /
          (Math.pow(1 + periodicRate, amortization * 12) - 1)
        : 0;
      
      return {
        ...scenario,
        payment: monthlyPayment,
        difference: monthlyPayment - calculations.monthlyPayment
      };
    });
  }, [mortgageRate, calculations.mortgageAmount, calculations.monthlyPayment, amortization]);

  // Amortization schedule (first 5 years + summary)
  const amortizationSchedule = useMemo(() => {
    const schedule: { year: number; totalPaid: number; principalPaid: number; interestPaid: number; balance: number }[] = [];
    let balance = calculations.mortgageAmount;
    const annualRate = mortgageRate / 100;
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculations.monthlyPayment;
    
    for (let year = 1; year <= Math.min(amortization, 10); year++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      
      for (let month = 1; month <= 12; month++) {
        if (balance <= 0) break;
        const interestPayment = balance * monthlyRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
        yearlyInterest += interestPayment;
        yearlyPrincipal += principalPayment;
        balance -= principalPayment;
      }
      
      schedule.push({
        year,
        totalPaid: yearlyPrincipal + yearlyInterest,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        balance: Math.max(0, balance)
      });
    }
    
    return schedule;
  }, [calculations.mortgageAmount, calculations.monthlyPayment, mortgageRate, amortization]);

  // Format currency
  const formatCurrency = (amount: number, decimals = 0) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  // Handle price input
  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue) && numValue > 0) {
      setPropertyPrice(numValue);
    }
  };

  const handlePriceBlur = () => {
    setPriceInput(propertyPrice.toLocaleString());
  };

  const handlePriceFocus = () => {
    setPriceInput(propertyPrice.toString());
  };

  // Event context for tracking
  const getEventContext = useCallback(() => ({
    property_price: propertyPrice,
    down_payment_pct: downPaymentPercent,
    mortgage_rate: mortgageRate,
    amortization,
    frequency: paymentFrequency,
    page_url: window.location.href
  }), [propertyPrice, downPaymentPercent, mortgageRate, amortization, paymentFrequency]);

  // Track events
  const trackEvent = (eventName: string, params: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, params);
    }
    console.log('Track:', eventName, params);
  };

  // Handle lead form submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadForm.name || !leadForm.email) {
      toast.error("Please enter your name and email");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      };

      const { error } = await supabase.from("project_leads").insert({
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone || null,
        message: `Mortgage Calculator Lead - Price: ${formatCurrency(propertyPrice)}, Down: ${downPaymentPercent}%, Rate: ${mortgageRate}%, Amort: ${amortization}yr, Payment: ${formatCurrency(calculations.monthlyPayment)}`,
        persona: "Buyer",
        timeline: "0-3 months"
      });

      if (error) throw error;

      trackEvent("soft_lead_submit", {
        ...getEventContext(),
        lead_type: "mortgage_calculator",
        ...utmData
      });

      setLeadSubmitted(true);
      toast.success("Estimate sent! Check your email.");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FAQ data
  const faqs = [
    {
      question: "What is mortgage amortization?",
      answer: "Mortgage amortization is the total length of time it takes to pay off your mortgage in full. In Canada, common amortization periods are 15, 20, 25, or 30 years. A longer amortization means lower monthly payments but more interest paid over time. For presale condos, most buyers choose 25 years as it balances affordability with total cost."
    },
    {
      question: "How much should I put for a down payment on a presale?",
      answer: "For presale condos in BC, developers typically require 15-20% as a deposit, paid in stages during construction. For mortgage qualification, the minimum down payment is 5% for homes under $500,000, and 10% for the portion above $500,000 (up to $1M). Down payments under 20% require CMHC insurance, which is added to your mortgage."
    },
    {
      question: "How do strata fees affect my monthly housing costs?",
      answer: "Strata fees are monthly charges that cover building maintenance, insurance, and amenities. In Metro Vancouver, strata fees typically range from $200-$600/month for condos. These fees are added to your mortgage payment when calculating total monthly housing costs. Some lenders factor strata fees into your debt service ratios when qualifying you for a mortgage."
    },
    {
      question: "What's a mortgage rate and how is it determined?",
      answer: "A mortgage rate is the interest charged on your home loan. Fixed rates stay the same for your term (typically 5 years), while variable rates fluctuate with the prime rate. Rates depend on factors like Bank of Canada policy, bond yields, your credit score, down payment size, and the lender. For presales, you'll lock in your rate closer to completion."
    },
    {
      question: "How do I use this calculator for presale condos?",
      answer: "Enter the presale price as your property price. For down payment, use the deposit amount you'll pay to the developer (typically 15-20%). Add estimated strata fees and property taxes. The calculator will show your monthly payment at completion. Remember: you don't pay mortgage payments during construction — only your staged deposits."
    },
    {
      question: "What is CMHC insurance and when do I need it?",
      answer: "CMHC (Canada Mortgage and Housing Corporation) insurance protects lenders when borrowers have less than 20% down payment. The insurance premium (2.8-4% of mortgage) is added to your loan. For a $700,000 presale with 10% down, CMHC insurance would add approximately $19,530 to your mortgage amount."
    },
    {
      question: "What is BC Property Transfer Tax?",
      answer: "Property Transfer Tax (PTT) is a provincial tax paid when you buy property in BC. The rate is 1% on the first $200,000, 2% on $200,000-$2,000,000, 3% on $2,000,000-$3,000,000, and 5% above $3,000,000. First-time buyers may qualify for exemptions up to $8,000 on homes up to $500,000. New home buyers can get up to $13,000 exemption."
    },
    {
      question: "What closing costs should I budget for?",
      answer: "Beyond your down payment, budget for: Property Transfer Tax (1-5% depending on price), lawyer fees ($1,500-$2,500), title insurance ($200-$400), home inspection ($300-$600), appraisal fees ($300-$500), PST on CMHC insurance if applicable (8%), and GST on new homes (5%, with partial rebates available)."
    }
  ];

  // Payment frequency labels
  const frequencyLabels: Record<string, string> = {
    monthly: "Monthly",
    "semi-monthly": "Semi-Monthly",
    "bi-weekly": "Bi-Weekly",
    "accelerated-bi-weekly": "Accelerated Bi-Weekly",
    weekly: "Weekly",
    "accelerated-weekly": "Accelerated Weekly"
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Mortgage Calculator for Presale Condos & Townhomes | PresaleProperties.com</title>
        <meta name="description" content="Estimate your monthly mortgage payments for presale condos & townhomes in Surrey, Langley, Coquitlam, Burnaby, Abbotsford & Vancouver. Includes land transfer tax, closing costs, and amortization schedule." />
        <meta name="keywords" content="presale mortgage calculator, mortgage payment calculator BC, mortgage payments presale condos, presale condo affordability, mortgage estimate Vancouver, land transfer tax BC, closing costs calculator" />
        <link rel="canonical" href="https://presaleproperties.com/mortgage-calculator" />
      </Helmet>
      
      <FAQSchema faqs={faqs} />

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container px-4 py-3">
            <Breadcrumbs items={[{ label: "Mortgage Calculator" }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                <Calculator className="h-4 w-4" />
                Mortgage Calculator
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Mortgage Payment Calculator
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Get a sense for your mortgage payments, closing costs, and monthly carrying costs for presale properties in Metro Vancouver & Fraser Valley.
              </p>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Results Bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="container px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{frequencyLabels[paymentFrequency]} Payment</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(calculations.payment, 0)}</p>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Cash to Close</p>
                  <p className="text-sm font-semibold">{formatCurrency(calculations.cashToClose)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Monthly Total</p>
                  <p className="text-sm font-semibold">{formatCurrency(calculations.totalMonthlyCarrying)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Section */}
        <section className="py-4 md:py-10">
          <div className="container px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
                
                {/* Inputs Column */}
                <div className="lg:col-span-2 space-y-3 md:space-y-4">
                  {/* Main Calculator Card */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Calculate Your Mortgage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      
                      {/* Property Price & Location Row */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="property-price" className="text-sm font-medium mb-2 flex items-center gap-1">
                            Property Price
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>The total purchase price of the property before any taxes or fees.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="property-price"
                              type="text"
                              inputMode="numeric"
                              value={priceInput}
                              onChange={(e) => handlePriceChange(e.target.value)}
                              onBlur={handlePriceBlur}
                              onFocus={handlePriceFocus}
                              className="pl-9 text-lg font-semibold h-12"
                              placeholder="750,000"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                            Location
                          </Label>
                          <Select defaultValue="bc">
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bc">British Columbia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Down Payment */}
                      <div>
                        <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                          Down Payment
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-medium mb-1">Minimum Down Payment:</p>
                                <ul className="text-xs space-y-1">
                                  <li>• $500,000 or less: 5%</li>
                                  <li>• $500,000-$1.5M: 5% of first $500K + 10% of rest</li>
                                  <li>• $1.5M+: 20% minimum</li>
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Select value={downPaymentOption} onValueChange={setDownPaymentOption}>
                            <SelectTrigger className="h-11 col-span-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="15">15%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                              <SelectItem value="25">25%</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {downPaymentOption === "custom" ? (
                            <div className="col-span-1 sm:col-span-3 grid grid-cols-3 gap-2">
                              {/* Toggle between % and $ */}
                              <div className="flex rounded-lg border overflow-hidden h-11">
                                <button
                                  type="button"
                                  onClick={() => setDownPaymentInputMode("percent")}
                                  className={`flex-1 flex items-center justify-center text-sm font-medium transition-colors ${
                                    downPaymentInputMode === "percent"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                >
                                  <Percent className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDownPaymentInputMode("dollar")}
                                  className={`flex-1 flex items-center justify-center text-sm font-medium transition-colors ${
                                    downPaymentInputMode === "dollar"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              </div>
                              {downPaymentInputMode === "percent" ? (
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={customDownPaymentPercent}
                                    onChange={(e) => setCustomDownPaymentPercent(e.target.value)}
                                    placeholder="20"
                                    className="h-11 pr-8"
                                    min="5"
                                    max="80"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                              ) : (
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={customDownPaymentDollar}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      setCustomDownPaymentDollar(value);
                                    }}
                                    onBlur={() => {
                                      const num = parseInt(customDownPaymentDollar);
                                      if (!isNaN(num)) {
                                        setCustomDownPaymentDollar(num.toLocaleString());
                                      }
                                    }}
                                    onFocus={() => {
                                      setCustomDownPaymentDollar(customDownPaymentDollar.replace(/[^0-9]/g, ''));
                                    }}
                                    placeholder="150,000"
                                    className="h-11 pl-8"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-center bg-muted rounded-lg px-2 text-xs">
                                <span className="font-medium">
                                  {downPaymentInputMode === "percent" 
                                    ? formatCurrency(calculations.downPayment)
                                    : `${downPaymentPercent.toFixed(1)}%`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center bg-muted rounded-lg px-3 col-span-1">
                              <span className="font-medium text-sm">{formatCurrency(calculations.downPayment)}</span>
                            </div>
                          )}
                          {calculations.cmhcInsurance > 0 && (
                            <div className="col-span-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                              <Info className="h-3.5 w-3.5 shrink-0" />
                              <span>+{formatCurrency(calculations.cmhcInsurance)} CMHC (down payment under 20%)</span>
                            </div>
                          )}
                        </div>
                        {includeGST && (
                          <p className="text-xs text-muted-foreground mt-2 px-1">
                            Down payment is based on total price with GST ({formatCurrency(calculations.priceWithGST)})
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2 px-1 text-sm">
                          <span className="text-muted-foreground">Total Mortgage</span>
                          <span className="font-semibold">{formatCurrency(calculations.mortgageAmount)}</span>
                        </div>
                      </div>

                      {/* Amortization & Rate */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                            Amortization
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>The total length of time to pay off your mortgage. Longer periods mean lower payments but more interest. 30-year amortization requires 20%+ down payment (or first-time buyer/new build exemption).</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Select value={amortization.toString()} onValueChange={(v) => setAmortization(parseInt(v))}>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 years</SelectItem>
                              <SelectItem value="25">25 years</SelectItem>
                              <SelectItem value="20">20 years</SelectItem>
                              <SelectItem value="15">15 years</SelectItem>
                              <SelectItem value="10">10 years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="mortgage-rate" className="text-sm font-medium mb-2 flex items-center gap-1">
                            Mortgage Rate
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>The interest rate on your mortgage. Current 5-year fixed rates are around 4.5-5.5%. Variable rates may be lower but fluctuate with prime rate.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <div className="relative">
                            <Input
                              id="mortgage-rate"
                              type="text"
                              inputMode="decimal"
                              value={mortgageRateInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setMortgageRateInput(value);
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed) && parsed >= 0 && parsed <= 15) {
                                  setMortgageRate(parsed);
                                }
                              }}
                              onBlur={() => {
                                if (mortgageRateInput === "" || isNaN(parseFloat(mortgageRateInput))) {
                                  setMortgageRateInput(mortgageRate.toString());
                                }
                              }}
                              className="h-11 pr-8"
                              placeholder="3.79"
                            />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      {/* Payment Frequency */}
                      <div>
                        <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                          Payment Frequency
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p><strong>Accelerated payments</strong> help pay off your mortgage faster by making the equivalent of one extra monthly payment per year.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Select value={paymentFrequency} onValueChange={(v: any) => setPaymentFrequency(v)}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly (12/year)</SelectItem>
                            <SelectItem value="semi-monthly">Semi-Monthly (24/year)</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly (26/year)</SelectItem>
                            <SelectItem value="accelerated-bi-weekly">Accelerated Bi-Weekly (26/year)</SelectItem>
                            <SelectItem value="weekly">Weekly (52/year)</SelectItem>
                            <SelectItem value="accelerated-weekly">Accelerated Weekly (52/year)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Buyer Options - Optimized for mobile */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="primary-home"
                            checked={isPrimaryHome}
                            onCheckedChange={setIsPrimaryHome}
                            className="scale-90 md:scale-100"
                          />
                          <Label htmlFor="primary-home" className="text-xs md:text-sm cursor-pointer flex items-center gap-1">
                            Primary home
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Select if this will be your principal residence. Combined with new construction (GST), you may qualify for PTT exemption up to $835K.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="include-gst"
                            checked={includeGST}
                            onCheckedChange={setIncludeGST}
                            className="scale-90 md:scale-100"
                          />
                          <Label htmlFor="include-gst" className="text-xs md:text-sm cursor-pointer flex items-center gap-1">
                            New construction (GST 5%)
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>New homes are subject to 5% GST. Rebates may apply for homes under $450K.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>
                      </div>
                      {isPrimaryHome && includeGST && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          PTT exemption may apply for primary residence + new construction
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Down Payment Comparison (4-column view like ratehub) */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Compare Down Payment Scenarios
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        See how different down payments affect your mortgage and monthly payment
                      </p>
                    </CardHeader>
                    <CardContent className="px-3 md:px-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {downPaymentComparison.map((scenario, i) => (
                          <button
                            key={scenario.percent}
                            onClick={() => setDownPaymentOption(scenario.percent.toString())}
                            className={`p-2.5 md:p-3 rounded-lg border text-center transition-all active:scale-[0.98] ${
                              scenario.isSelected 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            {/* Header */}
                            <div className="mb-1.5 md:mb-2">
                              <div className="flex items-center justify-center gap-1">
                                <span className={`text-base md:text-lg font-bold ${scenario.isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {scenario.percent}%
                                </span>
                                {scenario.isMinimum && (
                                  <span className="text-[9px] md:text-[10px] bg-muted text-muted-foreground px-1 py-0.5 rounded">
                                    MIN
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] md:text-xs text-muted-foreground">Down</p>
                            </div>

                            {/* Down Payment Amount - Hidden on mobile for space */}
                            <div className="hidden md:block py-2 border-t">
                              <p className="text-xs text-muted-foreground mb-0.5">Down Payment</p>
                              <p className="text-sm font-semibold">{formatCurrency(scenario.downPayment)}</p>
                            </div>

                            {/* CMHC - Compact on mobile */}
                            <div className="py-1.5 md:py-2 border-t">
                              <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">CMHC</p>
                              <p className={`text-xs md:text-sm font-medium ${scenario.cmhcInsurance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                {scenario.cmhcInsurance > 0 ? `+${formatCurrency(scenario.cmhcInsurance)}` : '$0'}
                              </p>
                            </div>

                            {/* Total Mortgage - Hidden on mobile */}
                            <div className="hidden md:block py-2 border-t bg-muted/30 -mx-3 px-3">
                              <p className="text-xs text-muted-foreground mb-0.5">Mortgage</p>
                              <p className="text-sm font-bold">{formatCurrency(scenario.mortgageAmount)}</p>
                            </div>

                            {/* Monthly Payment */}
                            <div className="pt-2 md:pt-3 mt-1 md:mt-2 border-t">
                              <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Monthly</p>
                              <p className={`text-base md:text-xl font-bold ${scenario.isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {formatCurrency(scenario.monthlyPayment)}
                              </p>
                            </div>

                            {/* Select indicator - Smaller on mobile */}
                            {scenario.isSelected && (
                              <div className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-primary font-medium flex items-center justify-center gap-1">
                                <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                <span className="hidden md:inline">Selected</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 text-center">
                        Tap to select • Under 20% requires CMHC insurance
                      </p>
                    </CardContent>
                  </Card>

                  {/* Cash Needed to Close */}
                  <Card>
                    <CardHeader className="py-3 md:pb-2">
                      <button 
                        onClick={() => setShowClosingDetails(!showClosingDetails)}
                        className="flex items-center justify-between w-full text-left gap-2"
                      >
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          <span className="hidden sm:inline">Cash Needed to Close</span>
                          <span className="sm:hidden">Cash to Close</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-lg md:text-xl font-bold text-primary">{formatCurrency(calculations.cashToClose)}</span>
                          {showClosingDetails ? <ChevronUp className="h-4 w-4 md:h-5 md:w-5" /> : <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                      </button>
                    </CardHeader>
                    {showClosingDetails && (
                      <CardContent className="pt-2 space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Down Payment</span>
                            <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                          </div>
                          
                          <div className="border-t pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Property Transfer Tax (BC)</p>
                            <div className="flex justify-between py-1 pl-3">
                              <span className="text-muted-foreground">Provincial PTT</span>
                              <span>{formatCurrency(calculations.ptt.provincial)}</span>
                            </div>
                            {calculations.ptt.rebate > 0 && (
                              <div className="flex justify-between py-1 pl-3 text-green-600">
                                <span className="flex items-center gap-1">
                                  {calculations.ptt.exemptionType}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>Primary residence buyers of newly built homes in BC can get full PTT exemption on homes up to $835,000, with partial exemption up to $860,000.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </span>
                                <span>-{formatCurrency(calculations.ptt.rebate)}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1 pl-3 font-medium">
                              <span>Net PTT</span>
                              <span>{calculations.ptt.total === 0 ? <span className="text-green-600">$0</span> : formatCurrency(calculations.ptt.total)}</span>
                            </div>
                          </div>
                          
                          {calculations.pstOnCmhc > 0 && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">PST on CMHC Insurance (8%)</span>
                              <span>{formatCurrency(calculations.pstOnCmhc)}</span>
                            </div>
                          )}
                          
                          {/* GST Rebates - shown only if applicable (GST itself is in down payment) */}
                          {(calculations.gstRebate > 0 || calculations.bcNewHousingRebate > 0) && (
                            <div className="border-t pt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">GST Rebates (credited at closing)</p>
                              {calculations.gstRebate > 0 && (
                                <div className="flex justify-between py-1 pl-3 text-green-600">
                                  <span>Federal GST Rebate</span>
                                  <span>-{formatCurrency(calculations.gstRebate)}</span>
                                </div>
                              )}
                              {calculations.bcNewHousingRebate > 0 && (
                                <div className="flex justify-between py-1 pl-3 text-green-600">
                                  <span>BC New Housing Rebate</span>
                                  <span>-{formatCurrency(calculations.bcNewHousingRebate)}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {includeGST && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Note: GST ({formatCurrency(calculations.gstAmount)}) is included in down payment calculation
                            </p>
                          )}
                          
                          <div className="border-t pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Closing Costs</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Lawyer Fees</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    value={lawyerFees}
                                    onChange={(e) => setLawyerFees(parseFloat(e.target.value) || 0)}
                                    className="h-9 pl-6 text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Title Insurance</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    value={titleInsurance}
                                    onChange={(e) => setTitleInsurance(parseFloat(e.target.value) || 0)}
                                    className="h-9 pl-6 text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Home Inspection</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    value={homeInspection}
                                    onChange={(e) => setHomeInspection(parseFloat(e.target.value) || 0)}
                                    className="h-9 pl-6 text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Appraisal Fees</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    value={appraisalFees}
                                    onChange={(e) => setAppraisalFees(parseFloat(e.target.value) || 0)}
                                    className="h-9 pl-6 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Monthly Expenses */}
                  <Card>
                    <CardHeader className="py-3 md:pb-2">
                      <button 
                        onClick={() => setShowMonthlyDetails(!showMonthlyDetails)}
                        className="flex items-center justify-between w-full text-left gap-2"
                      >
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <Receipt className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          <span className="hidden sm:inline">Monthly Carrying Costs</span>
                          <span className="sm:hidden">Monthly Costs</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-lg md:text-xl font-bold text-primary">{formatCurrency(calculations.totalMonthlyCarrying)}</span>
                          {showMonthlyDetails ? <ChevronUp className="h-4 w-4 md:h-5 md:w-5" /> : <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                      </button>
                    </CardHeader>
                    {showMonthlyDetails && (
                      <CardContent className="pt-2 space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Mortgage Payment (P&I)</span>
                            <span className="font-medium">{formatCurrency(calculations.monthlyPayment)}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 border-t pt-3">
                            <div>
                              <Label className="text-xs">Property Tax (Annual)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={propertyTax}
                                  onChange={(e) => setPropertyTax(parseFloat(e.target.value) || 0)}
                                  className="h-9 pl-6 text-sm"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(calculations.monthlyPropertyTax)}/mo</p>
                            </div>
                            <div>
                              <Label className="text-xs">Strata Fee (Monthly)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={strataFee}
                                  onChange={(e) => setStrataFee(parseFloat(e.target.value) || 0)}
                                  className="h-9 pl-6 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Home Insurance (Monthly)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={homeInsurance}
                                  onChange={(e) => setHomeInsurance(parseFloat(e.target.value) || 0)}
                                  className="h-9 pl-6 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Utilities (Monthly)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={utilities}
                                  onChange={(e) => setUtilities(parseFloat(e.target.value) || 0)}
                                  className="h-9 pl-6 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Interest Rate Risk */}
                  <Card>
                    <CardHeader className="pb-2 md:pb-3">
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Interest Rate Scenarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 md:px-6">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3">See how your payment changes with different rates:</p>
                      <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                        {rateScenarios.map((scenario, i) => (
                          <div 
                            key={i} 
                            className={`p-2 md:p-3 rounded-lg border text-center ${i === 0 ? 'bg-primary/5 border-primary/30' : ''}`}
                          >
                            <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">{scenario.label}</p>
                            <p className="text-xs md:text-sm font-medium">{scenario.rate.toFixed(2)}%</p>
                            <p className="text-sm md:text-lg font-bold">{formatCurrency(scenario.payment)}</p>
                            {scenario.difference !== 0 && (
                              <p className={`text-[10px] md:text-xs ${scenario.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {scenario.difference > 0 ? '+' : ''}{formatCurrency(scenario.difference)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amortization Schedule */}
                  <Card>
                    <CardHeader className="pb-2">
                      <button 
                        onClick={() => setShowAmortizationSchedule(!showAmortizationSchedule)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Amortization Schedule
                        </CardTitle>
                        {showAmortizationSchedule ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </CardHeader>
                    {showAmortizationSchedule && (
                      <CardContent className="pt-2">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">Year</TableHead>
                                <TableHead className="text-right">Total Paid</TableHead>
                                <TableHead className="text-right">Principal</TableHead>
                                <TableHead className="text-right">Interest</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {amortizationSchedule.map((row) => (
                                <TableRow key={row.year}>
                                  <TableCell className="font-medium">{row.year}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(row.totalPaid)}</TableCell>
                                  <TableCell className="text-right text-green-600">{formatCurrency(row.principalPaid)}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{formatCurrency(row.interestPaid)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50 font-semibold">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">{formatCurrency(calculations.totalCost)}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(calculations.mortgageAmount)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(calculations.totalInterest)}</TableCell>
                                <TableCell className="text-right">$0</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          * Showing first {Math.min(amortization, 10)} years. Full amortization is {amortization} years.
                        </p>
                      </CardContent>
                    )}
                  </Card>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Results are estimates only. Actual payments, taxes, and closing costs may vary. Property transfer tax calculations are for BC only. Consult a mortgage professional for personalized advice.
                      <Link to="/presale-guide" className="text-primary hover:underline ml-1">
                        Learn more about presale financing →
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Results Column (Sticky) - Hidden on mobile since we have sticky bar */}
                <div className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-4 space-y-4">
                    {/* Main Payment Card */}
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                      <CardContent className="p-5">
                        {/* Main Payment */}
                        <div className="text-center pb-4 border-b mb-4">
                          <p className="text-sm text-muted-foreground mb-1">
                            {frequencyLabels[paymentFrequency]} Payment
                          </p>
                          <p className="text-4xl font-bold text-primary">
                            {formatCurrency(calculations.payment, 0)}
                          </p>
                          {paymentFrequency !== "monthly" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ≈ {formatCurrency(calculations.monthlyPayment)} monthly
                            </p>
                          )}
                          {paymentFrequency.includes("accelerated") && (
                            <p className="text-xs text-green-600 mt-1">
                              Pay off ~{Math.round(amortization - calculations.yearsToPayoff)} years faster
                            </p>
                          )}
                        </div>

                        {/* Key Stats */}
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property Price</span>
                            <span className="font-medium">{formatCurrency(calculations.propertyPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Down Payment ({downPaymentPercent}%)</span>
                            <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mortgage Amount</span>
                            <span className="font-medium">{formatCurrency(calculations.mortgageAmount)}</span>
                          </div>
                          {calculations.cmhcInsurance > 0 && (
                            <div className="flex justify-between text-amber-600">
                              <span>CMHC Insurance</span>
                              <span>+{formatCurrency(calculations.cmhcInsurance)}</span>
                            </div>
                          )}
                          
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Summary Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cash to Close</p>
                        <p className="text-lg font-bold">{formatCurrency(calculations.cashToClose)}</p>
                      </Card>
                      <Card className="p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Total</p>
                        <p className="text-lg font-bold">{formatCurrency(calculations.totalMonthlyCarrying)}</p>
                      </Card>
                    </div>

                    {/* CTA Card */}
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Find presales in your budget</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Projects matching ~{formatCurrency(calculations.totalMonthlyCarrying)}/mo
                            </p>
                            <Link to="/presale-projects">
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => trackEvent("budget_cta_click", getEventContext())}
                              >
                                Browse Projects
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Soft Lead Capture Form */}
        {showLeadForm && !leadSubmitted && (
          <section className="py-8 bg-muted/30">
            <div className="container px-4">
              <div className="max-w-xl mx-auto">
                <Card className="border-primary/20">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Get your estimate emailed</h3>
                        <p className="text-sm text-muted-foreground">
                          Plus tailored presale recommendations based on your budget
                        </p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Your Name"
                            value={leadForm.name}
                            onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                            className="pl-9 h-11"
                            required
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                            className="pl-9 h-11"
                            required
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone (optional)"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-9 h-11"
                        />
                      </div>
                      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send My Estimate"}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Lead Success State */}
        {leadSubmitted && (
          <section className="py-8 bg-muted/30">
            <div className="container px-4">
              <div className="max-w-xl mx-auto">
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-5 md:p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Estimate Sent!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Check your email for your personalized mortgage breakdown and presale recommendations.
                    </p>
                    <Link to="/contact">
                      <Button 
                        variant="outline"
                        onClick={() => trackEvent("affordability_call_click", getEventContext())}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Book a 10-min Affordability Call
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Understanding mortgages for presale condos & townhomes
                </p>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`faq-${i}`}
                    className="bg-background rounded-lg border px-4 md:px-6"
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 md:py-14">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                Ready to start your presale journey?
              </h2>
              <p className="text-muted-foreground mb-6">
                Browse our curated collection of presale condos and townhomes across Metro Vancouver.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/presale-projects">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Presale Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/presale-guide">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Read Presale Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
