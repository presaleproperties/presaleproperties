import { useMemo, useState, useCallback } from 'react';
import { ROIInputs, ROIResults, YearlyProjection, DEFAULT_INPUTS, Scenario, DEFAULT_SCENARIOS } from '@/types/roi';

// Calculate monthly mortgage payment using standard amortization formula
function calculateMonthlyMortgagePayment(
  principal: number,
  annualRate: number,
  amortizationYears: number
): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return payment;
}

// Calculate remaining mortgage balance after n months
function calculateMortgageBalance(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  monthsPaid: number
): number {
  if (principal <= 0 || annualRate <= 0) return principal;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;
  
  const balance = principal * (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, monthsPaid)) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.max(0, balance);
}

// Calculate BC Property Transfer Tax
// For NEW CONSTRUCTION (presales): BC 2024 newly-built home PTT exemption applies.
// Full exemption ≤ $1,100,000 | Partial exemption $1,100,001–$1,150,000 | No exemption above $1,150,000
export function calculatePTT(price: number, isFirstTimeBuyer: boolean = false): number {
  if (price <= 0) return 0;
  
  let ptt = 0;
  
  // First $200,000: 1%
  ptt += Math.min(price, 200000) * 0.01;
  
  // $200,001 to $2,000,000: 2%
  if (price > 200000) {
    ptt += Math.min(price - 200000, 1800000) * 0.02;
  }
  
  // Over $2,000,000: 3%
  if (price > 2000000) {
    ptt += (price - 2000000) * 0.03;
  }
  
  // Newly-built home PTT exemption (BC April 2024+): applies to ALL buyers (not just FTB)
  // for principal residence purchases of new construction.
  // Full exemption ≤ $1,100,000; partial phase-out up to $1,150,000
  if (isFirstTimeBuyer) {
    if (price <= 1100000) {
      ptt = 0;
    } else if (price < 1150000) {
      const exemptFraction = (1150000 - price) / 50000;
      ptt = Math.round(ptt * (1 - exemptFraction));
    }
  }
  
  return Math.round(ptt);
}

// Calculate GST for new construction
export function calculateGST(price: number): number {
  return Math.round(price * 0.05);
}

// Calculate CMHC mortgage insurance premium
export function calculateCMHCInsurance(principal: number, downPaymentPercent: number): number {
  if (downPaymentPercent >= 20) return 0;
  if (downPaymentPercent >= 15) return Math.round(principal * 0.028);
  if (downPaymentPercent >= 10) return Math.round(principal * 0.031);
  return Math.round(principal * 0.04);
}

// Calculate GST New Housing Rebate — BC 2024 New Construction rules.
// First-Time Buyers purchasing a NEW BUILD as primary residence:
//   Full 100% GST rebate (net GST = $0) on homes priced ≤ $1,000,000.
//   Partial rebate phases out from $1,000,001 to $1,200,000 (linear).
//   No rebate above $1,200,000.
// Investors do NOT qualify — rebate is $0 regardless of price.
export function calculateGSTRebate(price: number, gstAmount: number): number {
  if (price <= 1000000) {
    return Math.round(gstAmount); // 100% rebate
  } else if (price < 1200000) {
    // Linear phase-out: full rebate at $1M, zero at $1.2M
    const fraction = (1200000 - price) / 200000;
    return Math.round(gstAmount * fraction);
  }
  return 0;
}

export function useROICalculator(initialInputs: ROIInputs = DEFAULT_INPUTS) {
  const [inputs, setInputs] = useState<ROIInputs>(initialInputs);
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'base' | 'aggressive'>('base');

  const updateInputs = useCallback((
    section: keyof ROIInputs,
    field: string,
    value: number | string | boolean | null
  ) => {
    setInputs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  const applyScenario = useCallback((scenarioKey: 'conservative' | 'base' | 'aggressive') => {
    const scenario = DEFAULT_SCENARIOS[scenarioKey];
    setActiveScenario(scenarioKey);
    setInputs(prev => ({
      ...prev,
      financing: {
        ...prev.financing,
        mortgageInterestRate: scenario.interestRate,
      },
      rental: {
        ...prev.rental,
        annualRentGrowthPercent: scenario.rentGrowth,
        vacancyPercent: scenario.vacancy,
      },
      exit: {
        ...prev.exit,
        annualPriceGrowthPercent: scenario.priceGrowth,
      },
    }));
  }, []);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setActiveScenario('base');
  }, []);

  const results = useMemo<ROIResults>(() => {
    const { purchase, financing, rental, expenses, exit } = inputs;
    
    // Calculate deposit and down payment
    const deposit1 = purchase.purchasePrice * (financing.deposit1Percent / 100);
    const deposit2 = purchase.purchasePrice * (financing.deposit2Percent / 100);
    const totalDeposit = deposit1 + deposit2;
    const totalDownPayment = purchase.purchasePrice * (financing.downPaymentPercent / 100);
    const additionalDownPayment = Math.max(0, totalDownPayment - totalDeposit);
    
    // Calculate CMHC insurance (for < 20% down)
    const cmhcInsurance = calculateCMHCInsurance(
      purchase.purchasePrice - totalDownPayment,
      financing.downPaymentPercent
    );
    
    // Calculate mortgage (including CMHC if applicable)
    const mortgageAmount = purchase.purchasePrice - totalDownPayment + cmhcInsurance;
    const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
      mortgageAmount,
      financing.mortgageInterestRate,
      financing.amortizationYears
    );
    
    // Calculate GST rebate for first-time buyers
    const isFirstTimeBuyer = purchase.buyerType === 'firstTimeBuyer';
    const gstRebate = isFirstTimeBuyer && exit.includeGST
      ? calculateGSTRebate(purchase.purchasePrice, exit.gstAmount)
      : 0;
    
    // Calculate closing costs
    const developerCredit = exit.developerCredit || 0;
    const closingCosts = exit.legalFees + 
      (exit.includeGST ? exit.gstAmount : 0) + 
      (exit.includePTT ? exit.pttAmount : 0) + 
      exit.mortgageFees - 
      developerCredit -
      gstRebate;
    
    const totalCashInvested = totalDownPayment + closingCosts;
    
    // Generate 5-year projections
    const yearlyProjections: YearlyProjection[] = [];
    let cumulativeCashflow = 0;
    let currentMortgageBalance = mortgageAmount;
    
    for (let year = 1; year <= 5; year++) {
      // Calculate rent with growth
      const rentGrowthMultiplier = Math.pow(1 + rental.annualRentGrowthPercent / 100, year - 1);
      const monthlyRent = rental.monthlyRentStart * rentGrowthMultiplier;
      const grossRent = monthlyRent * 12;
      const otherIncome = rental.otherIncomeMonthly * 12;
      const vacancyLoss = (grossRent + otherIncome) * (rental.vacancyPercent / 100);
      const effectiveRent = grossRent + otherIncome - vacancyLoss;
      
      // Calculate expenses with growth
      const expenseGrowthMultiplier = Math.pow(1 + 0.03, year - 1); // 3% default growth
      const strataGrowthMultiplier = Math.pow(1 + expenses.strataAnnualGrowthPercent / 100, year - 1);
      const taxGrowthMultiplier = Math.pow(1 + expenses.propertyTaxGrowthPercent / 100, year - 1);
      
      const strataFees = expenses.strataMonthly * 12 * strataGrowthMultiplier;
      const propertyTax = expenses.propertyTaxAnnual * taxGrowthMultiplier;
      const insurance = expenses.insuranceAnnual * expenseGrowthMultiplier;
      const utilities = expenses.utilitiesAnnual * expenseGrowthMultiplier;
      const maintenance = expenses.maintenanceReserveAnnual * expenseGrowthMultiplier;
      const managementFees = effectiveRent * (rental.managementPercent / 100);
      const otherExpenses = expenses.otherExpensesAnnual * expenseGrowthMultiplier;
      
      const totalExpenses = strataFees + propertyTax + insurance + utilities + maintenance + managementFees + otherExpenses;
      
      // Calculate NOI and cashflow
      const noi = effectiveRent - totalExpenses;
      const annualMortgagePayment = monthlyMortgagePayment * 12;
      const netCashflow = noi - annualMortgagePayment;
      cumulativeCashflow += netCashflow;
      
      // Calculate mortgage breakdown (principal vs interest)
      const startBalance = calculateMortgageBalance(
        mortgageAmount,
        financing.mortgageInterestRate,
        financing.amortizationYears,
        (year - 1) * 12
      );
      const endBalance = calculateMortgageBalance(
        mortgageAmount,
        financing.mortgageInterestRate,
        financing.amortizationYears,
        year * 12
      );
      const principalPaydown = startBalance - endBalance;
      const interestPaid = annualMortgagePayment - principalPaydown;
      currentMortgageBalance = endBalance;
      
      // Calculate property value and equity
      const priceGrowthMultiplier = Math.pow(1 + exit.annualPriceGrowthPercent / 100, year);
      const estimatedValue = purchase.purchasePrice * priceGrowthMultiplier;
      const equity = estimatedValue - currentMortgageBalance;
      
      yearlyProjections.push({
        year,
        grossRent,
        otherIncome,
        vacancyLoss,
        effectiveRent,
        strataFees,
        propertyTax,
        insurance,
        utilities,
        maintenance,
        managementFees,
        otherExpenses,
        totalExpenses,
        noi,
        mortgagePayment: annualMortgagePayment,
        principalPaydown,
        interestPaid,
        netCashflow,
        cumulativeCashflow,
        mortgageBalance: currentMortgageBalance,
        estimatedValue,
        equity,
      });
    }
    
    // Calculate return breakdown at year 5
    const year5 = yearlyProjections[4];
    const appreciationReturn = year5.estimatedValue - purchase.purchasePrice;
    const totalPrincipalPaydown = yearlyProjections.reduce((sum, y) => sum + y.principalPaydown, 0);
    const cashflowReturn = year5.cumulativeCashflow;
    
    // Calculate selling proceeds
    const sellingCosts = year5.estimatedValue * (exit.sellingCostPercent / 100);
    const netProceeds = year5.estimatedValue - sellingCosts - year5.mortgageBalance;
    const totalReturnDollars = netProceeds - totalCashInvested + cashflowReturn;
    const totalReturnPercent = (totalReturnDollars / totalCashInvested) * 100;
    
    // Calculate average annual cash-on-cash return
    const totalCashflow = yearlyProjections.reduce((sum, y) => sum + y.netCashflow, 0);
    const averageAnnualCashflow = totalCashflow / 5;
    const averageAnnualCashOnCash = (averageAnnualCashflow / totalCashInvested) * 100;
    
    return {
      totalDeposit,
      totalClosingCosts: closingCosts,
      mortgageAmount,
      monthlyMortgagePayment,
      cmhcInsurance,
      gstRebate,
      totalCashInvested,
      year1NetCashflow: yearlyProjections[0].netCashflow,
      year5NetCashflow: year5.netCashflow,
      estimatedValueYear5: year5.estimatedValue,
      estimatedEquityYear5: year5.equity,
      totalReturnDollars,
      totalReturnPercent,
      averageAnnualCashOnCash,
      yearlyProjections,
      appreciationReturn,
      cashflowReturn,
      principalPaydownReturn: totalPrincipalPaydown,
    };
  }, [inputs]);

  return {
    inputs,
    results,
    activeScenario,
    updateInputs,
    applyScenario,
    resetInputs,
    setInputs,
  };
}
