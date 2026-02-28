import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { ConversionHeader } from '@/components/conversion/ConversionHeader';
import { Footer } from '@/components/layout/Footer';
import { InvestmentSnapshot } from '@/components/calculators/InvestmentSnapshot';
import { CalculatorLeadCapture } from '@/components/conversion/CalculatorLeadCapture';

const CANONICAL_URL = "https://presaleproperties.com/calculator";

export default function InvestmentSnapshotPage() {
  const [searchParams] = useSearchParams();
  const hasParams = searchParams.toString().length > 0;
  
  return (
    <>
      <Helmet>
        <title>Calculator | Quick Condo Cash Flow Tool</title>
        <meta 
          name="description" 
          content="Instantly calculate your condo investment cash flow. Simple one-page tool to project monthly income, expenses, and returns for BC real estate." 
        />
        {/* Always point to clean canonical URL */}
        <link rel="canonical" href={CANONICAL_URL} />
        {/* Noindex if query params are present */}
        {hasParams && <meta name="robots" content="noindex, follow" />}
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-secondary/30 py-8 px-4">
        <div className="max-w-lg mx-auto mb-6 text-center">
          <p className="text-muted-foreground text-sm">
            Plug in your numbers and instantly see your investment cash flow
          </p>
        </div>
        
        <InvestmentSnapshot />

        {/* Lead capture below calculator - high-intent visitors */}
        <div className="max-w-lg mx-auto mt-8">
          <CalculatorLeadCapture
            calculatorData={{
              calculatorType: "roi",
              summary: "Investment Snapshot Calculator - Condo Cash Flow",
            }}
          />
        </div>
        
        <div className="max-w-lg mx-auto mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            *This calculator provides estimates only. Actual costs may vary. 
            Consult with a financial advisor for personalized advice.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
