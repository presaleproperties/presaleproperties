import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ROIInputs, ROIResults } from "@/types/roi";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatSeason = (season: string) => {
  return season.charAt(0).toUpperCase() + season.slice(1);
};

export function generateROIPdf(inputs: ROIInputs, results: ROIResults): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const darkText: [number, number, number] = [31, 41, 55];
  const mutedText: [number, number, number] = [107, 114, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Presale ROI Analysis", 14, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-CA")}`, 14, 28);
  doc.text("PresaleProperties.com", pageWidth - 14, 28, { align: "right" });

  yPos = 45;

  // Property Details Section
  doc.setTextColor(...darkText);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Property Details", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["Purchase Price", formatCurrency(inputs.purchase.purchasePrice)],
      ["City", inputs.purchase.city],
      ["Property Type", inputs.purchase.propertyType === "condo" ? "Condo" : "Townhome"],
      ["Expected Completion", `${formatSeason(inputs.purchase.closingSeason)} ${inputs.purchase.closingYear}`],
      ["Unit Size", inputs.purchase.unitSizeSqft ? `${inputs.purchase.unitSizeSqft} sq ft` : "N/A"],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Investment Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Investment Summary", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["Total Deposit", formatCurrency(results.totalDeposit)],
      ["Closing Costs", formatCurrency(results.totalClosingCosts)],
      ["Total Cash Invested", formatCurrency(results.totalCashInvested)],
      ["Mortgage Amount", formatCurrency(results.mortgageAmount)],
      ["Monthly Payment", formatCurrency(results.monthlyMortgagePayment)],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Key Metrics Section with colored boxes
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("5-Year Investment Returns", 14, yPos);
  yPos += 8;

  // Metrics boxes
  const boxWidth = 55;
  const boxHeight = 25;
  const metrics = [
    { label: "Est. Value (Yr 5)", value: formatCurrency(results.estimatedValueYear5) },
    { label: "Est. Equity (Yr 5)", value: formatCurrency(results.estimatedEquityYear5) },
    { label: "Total Return", value: `${formatCurrency(results.totalReturnDollars)} (${formatPercent(results.totalReturnPercent)})` },
  ];

  metrics.forEach((metric, i) => {
    const x = 14 + (i * (boxWidth + 5));
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, "F");
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, "S");
    
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, x + 3, yPos + 8);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + 3, yPos + 18);
  });

  yPos += boxHeight + 15;

  // Return Breakdown
  doc.setTextColor(...darkText);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Return Breakdown", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["Appreciation", formatCurrency(results.appreciationReturn)],
      ["Cashflow", formatCurrency(results.cashflowReturn)],
      ["Principal Paydown", formatCurrency(results.principalPaydownReturn)],
      ["Total Return", formatCurrency(results.totalReturnDollars)],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Cashflow Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Annual Cashflow Summary", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["Year 1 Net Cashflow", formatCurrency(results.year1NetCashflow)],
      ["Year 5 Net Cashflow", formatCurrency(results.year5NetCashflow)],
      ["Avg. Cash-on-Cash Return", formatPercent(results.averageAnnualCashOnCash) + "/year"],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  // New page for Proforma Table
  doc.addPage();
  yPos = 20;

  doc.setTextColor(...darkText);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("5-Year Proforma", 14, yPos);
  yPos += 10;

  // Proforma Table
  const proformaData = results.yearlyProjections.map((proj) => [
    `Year ${proj.year}`,
    formatCurrency(proj.grossRent),
    formatCurrency(proj.vacancyLoss),
    formatCurrency(proj.effectiveRent),
    formatCurrency(proj.totalExpenses),
    formatCurrency(proj.noi),
    formatCurrency(proj.mortgagePayment),
    formatCurrency(proj.netCashflow),
    formatCurrency(proj.estimatedValue),
    formatCurrency(proj.equity),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Year", "Gross Rent", "Vacancy", "Eff. Rent", "Expenses", "NOI", "Mortgage", "Net Cash", "Value", "Equity"]],
    body: proformaData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "right",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
    },
    margin: { left: 10, right: 10 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Detailed Expenses Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Annual Expenses", 14, yPos);
  yPos += 8;

  const expenseData = results.yearlyProjections.map((proj) => [
    `Year ${proj.year}`,
    formatCurrency(proj.strataFees),
    formatCurrency(proj.propertyTax),
    formatCurrency(proj.insurance),
    formatCurrency(proj.maintenance),
    formatCurrency(proj.managementFees),
    formatCurrency(proj.totalExpenses),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Year", "Strata", "Property Tax", "Insurance", "Maintenance", "Mgmt Fees", "Total"]],
    body: expenseData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "right",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Mortgage Amortization Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Mortgage Summary by Year", 14, yPos);
  yPos += 8;

  const mortgageData = results.yearlyProjections.map((proj) => [
    `Year ${proj.year}`,
    formatCurrency(proj.mortgagePayment),
    formatCurrency(proj.principalPaydown),
    formatCurrency(proj.interestPaid),
    formatCurrency(proj.mortgageBalance),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Year", "Total Payment", "Principal", "Interest", "Balance"]],
    body: mortgageData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      halign: "right",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Check if we need a new page for disclaimer
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Disclaimer
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, "F");
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, "S");

  doc.setTextColor(146, 64, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Important Disclaimer", 20, yPos + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const disclaimerText = "These calculations are estimates only and should not be considered financial, legal, or tax advice. Market conditions, interest rates, and rental demand can change significantly. Always consult with licensed professionals before making investment decisions.";
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 40);
  doc.text(splitDisclaimer, 20, yPos + 18);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by PresaleProperties.com`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `roi-analysis-${inputs.purchase.city.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  doc.save(fileName);
}
