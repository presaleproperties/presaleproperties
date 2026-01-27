import { ROIInputs, ROIResults } from "@/types/roi";
import { generateROIPdf } from "@/lib/generateROIPdf";
import { CalculatorLeadCapture, CalculatorLeadData } from "@/components/conversion/CalculatorLeadCapture";

interface ROILeadCaptureProps {
  inputs: ROIInputs;
  results: ROIResults;
  onTrackEvent?: (event: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
};

export function ROILeadCapture({ inputs, results, onTrackEvent }: ROILeadCaptureProps) {
  const calculatorData: CalculatorLeadData = {
    calculatorType: "roi",
    summary: `- Purchase Price: ${formatCurrency(inputs.purchase.purchasePrice)}
- City: ${inputs.purchase.city}
- Property Type: ${inputs.purchase.propertyType}
- Total Investment: ${formatCurrency(results.totalCashInvested)}
- 5-Year Return: ${results.totalReturnPercent.toFixed(1)}%`,
  };

  const handleDownloadPdf = () => {
    try {
      generateROIPdf(inputs, results);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <CalculatorLeadCapture
      calculatorData={calculatorData}
      onTrackEvent={onTrackEvent}
      onDownloadPdf={handleDownloadPdf}
      showPdfButton={true}
    />
  );
}
