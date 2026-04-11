// ROI Calculator Types

export type CompletionSeason = 'spring' | 'summer' | 'fall' | 'winter';

export interface PurchaseDetails {
  purchasePrice: number;
  closingYear: number;
  closingSeason: CompletionSeason;
  city: string;
  propertyType: 'condo' | 'townhome';
  unitSizeSqft: number | null;
  buyerType: 'investor' | 'firstTimeBuyer';
}

export interface FinancingDetails {
  depositStructure: 'standard' | 'custom';
  deposit1Percent: number;
  deposit1Months: number;
  deposit2Percent: number;
  deposit2Months: number;
  downPaymentPercent: number;
  mortgageInterestRate: number;
  amortizationYears: number;
  mortgageTermYears: number;
}

export interface RentalIncomeDetails {
  monthlyRentStart: number;
  annualRentGrowthPercent: number;
  vacancyPercent: number;
  otherIncomeMonthly: number;
  managementPercent: number;
}

export interface OperatingExpenses {
  strataMonthly: number;
  strataAnnualGrowthPercent: number;
  propertyTaxAnnual: number;
  propertyTaxGrowthPercent: number;
  insuranceAnnual: number;
  utilitiesAnnual: number;
  maintenanceReserveAnnual: number;
  otherExpensesAnnual: number;
}

export interface ExitAssumptions {
  legalFees: number;
  includeGST: boolean;
  gstAmount: number;
  includePTT: boolean;
  pttAmount: number;
  mortgageFees: number;
  annualPriceGrowthPercent: number;
  sellingCostPercent: number;
  showTaxEstimate: boolean;
  marginalTaxRate: number;
  developerCredit: number;
}

export interface ROIInputs {
  purchase: PurchaseDetails;
  financing: FinancingDetails;
  rental: RentalIncomeDetails;
  expenses: OperatingExpenses;
  exit: ExitAssumptions;
}

export interface YearlyProjection {
  year: number;
  grossRent: number;
  otherIncome: number;
  vacancyLoss: number;
  effectiveRent: number;
  strataFees: number;
  propertyTax: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  managementFees: number;
  otherExpenses: number;
  totalExpenses: number;
  noi: number;
  mortgagePayment: number;
  principalPaydown: number;
  interestPaid: number;
  netCashflow: number;
  cumulativeCashflow: number;
  mortgageBalance: number;
  estimatedValue: number;
  equity: number;
}

export interface ROIResults {
  // Initial investment
  totalDeposit: number;
  totalClosingCosts: number;
  mortgageAmount: number;
  monthlyMortgagePayment: number;
  cmhcInsurance: number;
  gstRebate: number;
  
  // Summary metrics
  totalCashInvested: number;
  year1NetCashflow: number;
  year5NetCashflow: number;
  estimatedValueYear5: number;
  estimatedEquityYear5: number;
  totalReturnDollars: number;
  totalReturnPercent: number;
  averageAnnualCashOnCash: number;
  
  // Yearly projections
  yearlyProjections: YearlyProjection[];
  
  // Return breakdown
  appreciationReturn: number;
  cashflowReturn: number;
  principalPaydownReturn: number;
}

export interface Scenario {
  name: string;
  priceGrowth: number;
  rentGrowth: number;
  vacancy: number;
  interestRate: number;
}

export const DEFAULT_SCENARIOS: Record<string, Scenario> = {
  conservative: {
    name: 'Conservative',
    priceGrowth: 2,
    rentGrowth: 2,
    vacancy: 8,
    interestRate: 5.5,
  },
  base: {
    name: 'Base',
    priceGrowth: 4,
    rentGrowth: 3,
    vacancy: 5,
    interestRate: 4.5,
  },
  aggressive: {
    name: 'Aggressive',
    priceGrowth: 6,
    rentGrowth: 5,
    vacancy: 3,
    interestRate: 4.0,
  },
};

export const DEFAULT_INPUTS: ROIInputs = {
  purchase: {
    purchasePrice: 499000,
    closingYear: 2027,
    closingSeason: 'fall',
    city: 'Vancouver',
    propertyType: 'condo',
    unitSizeSqft: 550,
    buyerType: 'investor',
  },
  financing: {
    depositStructure: 'standard',
    deposit1Percent: 5,
    deposit1Months: 0,
    deposit2Percent: 5,
    deposit2Months: 6,
    downPaymentPercent: 20,
    mortgageInterestRate: 4.5,
    amortizationYears: 25,
    mortgageTermYears: 5,
  },
  rental: {
    monthlyRentStart: 2650, // 2025 CMHC Vancouver 2BR average
    annualRentGrowthPercent: 2.5,
    vacancyPercent: 3, // 2025 CMHC Vancouver CMA vacancy 3.7%
    otherIncomeMonthly: 0,
    managementPercent: 0,
  },
  expenses: {
    strataMonthly: 275,
    strataAnnualGrowthPercent: 3,
    propertyTaxAnnual: 1440,
    propertyTaxGrowthPercent: 3,
    insuranceAnnual: 600,
    utilitiesAnnual: 0,
    maintenanceReserveAnnual: 500,
    otherExpensesAnnual: 0,
  },
  exit: {
    legalFees: 2000,
    includeGST: true,
    gstAmount: 32500,
    includePTT: true,
    pttAmount: 11000,
    mortgageFees: 500,
    annualPriceGrowthPercent: 4,
    sellingCostPercent: 3.5,
    showTaxEstimate: false,
    marginalTaxRate: 40,
    developerCredit: 0,
  },
};

export const BC_CITIES = [
  'Vancouver',
  'Burnaby',
  'Coquitlam',
  'Surrey',
  'Langley',
  'Delta',
  'Abbotsford',
  'Richmond',
  'New Westminster',
  'Port Moody',
  'Other',
];
