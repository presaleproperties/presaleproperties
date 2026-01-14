import { Helmet } from 'react-helmet-async';
import { ConversionHeader } from '@/components/conversion/ConversionHeader';
import { Footer } from '@/components/layout/Footer';
import { InvestmentSnapshot } from '@/components/calculators/InvestmentSnapshot';

export default function InvestmentSnapshotPage() {
  return (
    <>
      <Helmet>
        <title>Calculator | Quick Condo Cash Flow Tool</title>
        <meta 
          name="description" 
          content="Instantly calculate your condo investment cash flow. Simple one-page tool to project monthly income, expenses, and returns for BC real estate." 
        />
      </Helmet>

      <ConversionHeader />
      
      <main className="min-h-screen bg-secondary/30 py-8 px-4">
        <div className="max-w-lg mx-auto mb-6 text-center">
          <p className="text-muted-foreground text-sm">
            Plug in your numbers and instantly see your investment cash flow
          </p>
        </div>
        
        <InvestmentSnapshot />
        
        <div className="max-w-lg mx-auto mt-8 text-center">
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
