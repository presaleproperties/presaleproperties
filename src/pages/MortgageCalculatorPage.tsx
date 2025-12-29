import { useState, useMemo, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowRight,
  Mail,
  Phone,
  User,
  Info,
  CheckCircle,
  Sparkles
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

export default function MortgageCalculatorPage() {
  // Calculator inputs
  const [propertyPrice, setPropertyPrice] = useState(750000);
  const [priceInput, setPriceInput] = useState("750,000");
  const [downPaymentOption, setDownPaymentOption] = useState("20");
  const [customDownPayment, setCustomDownPayment] = useState("");
  const [mortgageRate, setMortgageRate] = useState(4.99);
  const [amortization, setAmortization] = useState(25);
  const [paymentFrequency, setPaymentFrequency] = useState<"monthly" | "semi-monthly" | "bi-weekly" | "weekly">("monthly");
  const [propertyTax, setPropertyTax] = useState(0);
  const [strataFee, setStrataFee] = useState(350);
  const [includeGST, setIncludeGST] = useState(false);
  const [includeLegalCosts, setIncludeLegalCosts] = useState(false);
  const [rateType, setRateType] = useState<"fixed" | "variable">("fixed");
  
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
    
    // Show lead form after 4+ inputs modified
    if (count >= 4 && !leadSubmitted) {
      setShowLeadForm(true);
      // Track soft_lead_shown event
      trackEvent("soft_lead_shown", getEventContext());
    }
  }, [propertyPrice, downPaymentOption, mortgageRate, amortization, paymentFrequency, propertyTax, strataFee, leadSubmitted]);

  // Debounced price for calculations
  const debouncedPrice = useDebounce(propertyPrice, 300);

  // Calculate down payment percentage
  const downPaymentPercent = useMemo(() => {
    if (downPaymentOption === "custom") {
      const customValue = parseFloat(customDownPayment);
      return isNaN(customValue) ? 20 : customValue;
    }
    return parseFloat(downPaymentOption);
  }, [downPaymentOption, customDownPayment]);

  // Main calculations
  const calculations = useMemo(() => {
    const price = debouncedPrice;
    const downPayment = (price * downPaymentPercent) / 100;
    const principal = price - downPayment;
    
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
    
    const mortgageAmount = principal + cmhcInsurance;
    
    // GST (5% on new homes)
    const gstAmount = includeGST ? price * 0.05 : 0;
    
    // Legal costs estimate
    const legalCosts = includeLegalCosts ? 2500 : 0;
    
    // Payment calculations based on frequency
    const annualRate = mortgageRate / 100;
    const paymentsPerYear = {
      monthly: 12,
      "semi-monthly": 24,
      "bi-weekly": 26,
      weekly: 52
    }[paymentFrequency];
    
    const periodicRate = annualRate / paymentsPerYear;
    const totalPayments = amortization * paymentsPerYear;
    
    // Payment calculation using standard amortization formula
    const payment = mortgageAmount > 0 && periodicRate > 0
      ? (mortgageAmount * periodicRate * Math.pow(1 + periodicRate, totalPayments)) /
        (Math.pow(1 + periodicRate, totalPayments) - 1)
      : 0;
    
    // Total amounts
    const totalPaymentsAmount = payment * totalPayments;
    const totalInterest = totalPaymentsAmount - mortgageAmount;
    
    // Property tax per payment period
    const propertyTaxPerPeriod = propertyTax > 0 ? propertyTax / paymentsPerYear : 0;
    
    // Strata fee per payment period (assume monthly input)
    const strataPerPeriod = strataFee > 0 ? (strataFee * 12) / paymentsPerYear : 0;
    
    // Total payment including extras
    const totalPaymentWithExtras = payment + propertyTaxPerPeriod + strataPerPeriod;
    
    // Monthly equivalent for comparison
    const monthlyEquivalent = totalPaymentWithExtras * (paymentsPerYear / 12);
    
    return {
      propertyPrice: price,
      downPayment,
      downPaymentPercent,
      mortgageAmount,
      cmhcInsurance,
      gstAmount,
      legalCosts,
      payment,
      totalInterest,
      totalCost: totalPaymentsAmount + downPayment,
      propertyTaxPerPeriod,
      strataPerPeriod,
      totalPaymentWithExtras,
      monthlyEquivalent,
      paymentsPerYear,
      totalPayments
    };
  }, [debouncedPrice, downPaymentPercent, mortgageRate, amortization, paymentFrequency, propertyTax, strataFee, includeGST, includeLegalCosts]);

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
    // GA4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }
    // Meta Pixel
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
      // Get UTM params
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      };

      // Save to database
      const { error } = await supabase.from("project_leads").insert({
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone || null,
        message: `Mortgage Calculator Lead - Price: ${formatCurrency(propertyPrice)}, Down: ${downPaymentPercent}%, Rate: ${mortgageRate}%, Amort: ${amortization}yr, Payment: ${formatCurrency(calculations.payment)}`,
        persona: "Buyer",
        timeline: "0-3 months"
      });

      if (error) throw error;

      // Track event
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
      question: "Should I choose fixed or variable rate for a presale?",
      answer: "This depends on your risk tolerance and market conditions. Fixed rates offer payment certainty, which is valuable for first-time buyers. Variable rates are typically lower initially but can increase. For presales, you'll make this decision closer to completion when you finalize your mortgage, so monitor rate trends during construction."
    },
    {
      question: "What other costs should I budget for beyond the mortgage payment?",
      answer: "Beyond your mortgage, budget for: property tax (0.25-0.4% of value annually), strata fees ($200-600/month), home insurance ($300-800/year), utilities ($100-200/month), and maintenance. For presales, also budget for GST (5% on new homes, partial rebate if primary residence), legal fees ($1,500-2,500), and any assignment or inspection costs."
    }
  ];

  // Payment frequency labels
  const frequencyLabels = {
    monthly: "Monthly",
    "semi-monthly": "Semi-Monthly",
    "bi-weekly": "Bi-Weekly",
    weekly: "Weekly"
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Mortgage Calculator for Presale Condos & Townhomes | PresaleProperties.com</title>
        <meta name="description" content="Estimate your monthly mortgage payments for presale condos & townhomes in Surrey, Langley, Coquitlam, Burnaby, Abbotsford & Vancouver. Try our interactive tool." />
        <meta name="keywords" content="presale mortgage calculator, mortgage payment calculator BC, mortgage payments presale condos, presale condo affordability, mortgage estimate Vancouver" />
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
        <section className="bg-gradient-to-b from-primary/5 to-background py-10 md:py-14">
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
                Estimate your monthly mortgage payments for new presale properties in Metro Vancouver & Fraser Valley.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                
                {/* Inputs Column */}
                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardContent className="p-4 md:p-6 space-y-5">
                      
                      {/* Property Price */}
                      <div>
                        <Label htmlFor="property-price" className="text-sm font-medium mb-2 block">
                          Property Price *
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

                      {/* Down Payment */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Down Payment / Deposit
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={downPaymentOption} onValueChange={setDownPaymentOption}>
                            <SelectTrigger className="h-12">
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
                          {downPaymentOption === "custom" && (
                            <div className="relative">
                              <Input
                                type="number"
                                value={customDownPayment}
                                onChange={(e) => setCustomDownPayment(e.target.value)}
                                placeholder="Enter %"
                                className="h-12 pr-8"
                                min="5"
                                max="80"
                              />
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {downPaymentOption !== "custom" && (
                            <div className="flex items-center justify-center bg-muted rounded-lg px-4">
                              <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mortgage Rate & Amortization */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mortgage-rate" className="text-sm font-medium mb-2 block">
                            Mortgage Rate (%)
                          </Label>
                          <div className="relative">
                            <Input
                              id="mortgage-rate"
                              type="number"
                              value={mortgageRate}
                              onChange={(e) => setMortgageRate(parseFloat(e.target.value) || 0)}
                              className="h-12 pr-8"
                              step="0.01"
                              min="0"
                              max="15"
                            />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Amortization
                          </Label>
                          <Select value={amortization.toString()} onValueChange={(v) => setAmortization(parseInt(v))}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 years</SelectItem>
                              <SelectItem value="15">15 years</SelectItem>
                              <SelectItem value="20">20 years</SelectItem>
                              <SelectItem value="25">25 years</SelectItem>
                              <SelectItem value="30">30 years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Payment Frequency & Rate Type */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Payment Frequency
                          </Label>
                          <Select value={paymentFrequency} onValueChange={(v: any) => setPaymentFrequency(v)}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Rate Type
                          </Label>
                          <Select value={rateType} onValueChange={(v: any) => setRateType(v)}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Rate</SelectItem>
                              <SelectItem value="variable">Variable Rate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Property Tax & Strata */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="property-tax" className="text-sm font-medium mb-2 block">
                            Annual Property Tax
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="property-tax"
                              type="number"
                              value={propertyTax || ""}
                              onChange={(e) => setPropertyTax(parseFloat(e.target.value) || 0)}
                              className="h-12 pl-9"
                              placeholder="2,500"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="strata-fee" className="text-sm font-medium mb-2 block">
                            Monthly Strata Fee
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="strata-fee"
                              type="number"
                              value={strataFee || ""}
                              onChange={(e) => setStrataFee(parseFloat(e.target.value) || 0)}
                              className="h-12 pl-9"
                              placeholder="350"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Optional Toggles */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="include-gst"
                            checked={includeGST}
                            onCheckedChange={setIncludeGST}
                          />
                          <Label htmlFor="include-gst" className="text-sm cursor-pointer">
                            Include GST (5%)
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="include-legal"
                            checked={includeLegalCosts}
                            onCheckedChange={setIncludeLegalCosts}
                          />
                          <Label htmlFor="include-legal" className="text-sm cursor-pointer">
                            Include Legal Costs (~$2,500)
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Results are estimates only based on input values. Actual payments may vary based on lender qualification, credit score, and current rates. 
                      <Link to="/presale-guide" className="text-primary hover:underline ml-1">
                        Learn how this calculator works →
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background sticky top-4">
                    <CardContent className="p-4 md:p-6">
                      {/* Main Payment */}
                      <div className="text-center pb-4 border-b mb-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          {frequencyLabels[paymentFrequency]} Payment
                        </p>
                        <p className="text-4xl md:text-5xl font-bold text-primary">
                          {formatCurrency(calculations.payment, 0)}
                        </p>
                        {paymentFrequency !== "monthly" && (
                          <p className="text-sm text-muted-foreground mt-2">
                            ≈ {formatCurrency(calculations.monthlyEquivalent)} monthly equivalent
                          </p>
                        )}
                      </div>

                      {/* Payment Breakdown */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Down Payment</span>
                          <span className="font-medium">{formatCurrency(calculations.downPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mortgage Amount</span>
                          <span className="font-medium">{formatCurrency(calculations.mortgageAmount)}</span>
                        </div>
                        {calculations.cmhcInsurance > 0 && (
                          <div className="flex justify-between text-amber-600">
                            <span>CMHC Insurance</span>
                            <span className="font-medium">+{formatCurrency(calculations.cmhcInsurance)}</span>
                          </div>
                        )}
                        {calculations.gstAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (5%)</span>
                            <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
                          </div>
                        )}
                        {calculations.legalCosts > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Legal Costs</span>
                            <span className="font-medium">{formatCurrency(calculations.legalCosts)}</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Interest</span>
                            <span className="font-medium">{formatCurrency(calculations.totalInterest)}</span>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-muted-foreground">Total Cost ({amortization}yr)</span>
                            <span className="font-medium">{formatCurrency(calculations.totalCost)}</span>
                          </div>
                        </div>

                        {(propertyTax > 0 || strataFee > 0) && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-xs text-muted-foreground mb-2">Including extras:</p>
                            {propertyTax > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Property Tax</span>
                                <span className="font-medium">+{formatCurrency(calculations.propertyTaxPerPeriod)}/{paymentFrequency.replace("-", " ")}</span>
                              </div>
                            )}
                            {strataFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Strata Fee</span>
                                <span className="font-medium">+{formatCurrency(calculations.strataPerPeriod)}/{paymentFrequency.replace("-", " ")}</span>
                              </div>
                            )}
                            <div className="flex justify-between mt-2 pt-2 border-t">
                              <span className="font-medium">Total w/ Extras</span>
                              <span className="font-bold text-primary">{formatCurrency(calculations.totalPaymentWithExtras)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CTA Card */}
                  <Card className="border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">See presales in your budget</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Find projects matching your {formatCurrency(calculations.monthlyEquivalent)}/mo budget
                          </p>
                          <Link to="/presale-projects">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => trackEvent("budget_cta_click", getEventContext())}
                            >
                              Browse Presale Projects
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

        {/* Value Add Section */}
        <section className="py-10 md:py-14">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-primary/20 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Find Presale Properties in Your Budget</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Use your estimate to plan deposit + mortgage strategy on presales.
                        </p>
                        <Link to="/presale-projects">
                          <Button variant="outline" size="sm">
                            Browse Projects
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Assignment Opportunities</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get into a presale at yesterday's prices with shorter wait times.
                        </p>
                        <Link to="/assignments">
                          <Button variant="outline" size="sm">
                            View Assignments
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
        </section>

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