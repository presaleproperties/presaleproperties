import { Helmet } from "react-helmet-async";
import { VIPHeader } from "@/components/vip/VIPHeader";
import { VIPHero } from "@/components/vip/VIPHero";
import { VIPCreditSection } from "@/components/vip/VIPCreditSection";
import { VIPRealValue } from "@/components/vip/VIPRealValue";
import { VIPBenefits } from "@/components/vip/VIPBenefits";
import { VIPComparison } from "@/components/vip/VIPComparison";
import { VIPTestimonials } from "@/components/vip/VIPTestimonials";
import { VIPApplicationForm } from "@/components/vip/VIPApplicationForm";
import { VIPFAQ } from "@/components/vip/VIPFAQ";
import { VIPFinalCTA } from "@/components/vip/VIPFinalCTA";
import { VIPFooter } from "@/components/vip/VIPFooter";
import { VIPExitPopup } from "@/components/vip/VIPExitPopup";
import { useEffect } from "react";
import { trackPageView } from "@/lib/tracking/events";

const VIPMembership = () => {
  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <>
      <Helmet>
        <title>VIP Elite Membership | $1,500 Credit + Exclusive Presale Access | Presale Properties</title>
        <meta
          name="description"
          content="Join VIP Elite and claim your $1,500 closing credit. Get exclusive off-market inventory, VIP pricing (save $10K-$25K), and white-glove service from signing to completion."
        />
        <meta name="keywords" content="VIP presale access, Vancouver presale, $1500 credit, exclusive inventory, presale specialist, off-market condos" />
        <link rel="canonical" href="https://presaleproperties.com/vip" />
        <meta property="og:title" content="VIP Elite Membership | $1,500 Credit + Exclusive Access" />
        <meta property="og:description" content="Join 400+ smart buyers getting exclusive inventory, VIP pricing, and $1,500 at closing." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/vip" />
      </Helmet>

      <VIPHeader />
      <main>
        <VIPHero />
        <VIPCreditSection />
        <VIPRealValue />
        <VIPBenefits />
        <VIPComparison />
        <VIPTestimonials />
        <VIPApplicationForm />
        <VIPFAQ />
        <VIPFinalCTA />
      </main>
      <VIPFooter />
      <VIPExitPopup />
    </>
  );
};

export default VIPMembership;
