import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { VIPHero } from "@/components/vip/VIPHero";
import { VIPValueProposition } from "@/components/vip/VIPValueProposition";
import { VIPBenefitsGrid } from "@/components/vip/VIPBenefitsGrid";
import { VIPClosingCredit } from "@/components/vip/VIPClosingCredit";
import { VIPMembershipForm } from "@/components/vip/VIPMembershipForm";
import { VIPFAQ } from "@/components/vip/VIPFAQ";
import { useEffect } from "react";
import { trackPageView } from "@/lib/tracking/events";

const VIPMembership = () => {
  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <>
      <Helmet>
        <title>VIP Membership | Exclusive Access to Vancouver Presales | Presale Properties</title>
        <meta
          name="description"
          content="Join our VIP membership for exclusive early access to presale projects, VIP pricing, and a $1,500 closing credit when you purchase. For serious buyers and investors."
        />
        <meta name="keywords" content="VIP presale access, Vancouver presale, exclusive inventory, presale specialist, off-market condos, investor" />
        <link rel="canonical" href="https://presaleproperties.com/vip" />
        <meta property="og:title" content="VIP Membership | Exclusive Presale Access" />
        <meta property="og:description" content="Get exclusive early access to presale projects, VIP pricing, and a $1,500 closing credit." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/vip" />
      </Helmet>

      <ConversionHeader />
      <main className="min-h-screen">
        <VIPHero />
        <VIPValueProposition />
        <VIPBenefitsGrid />
        <VIPClosingCredit />
        <VIPMembershipForm />
        <VIPFAQ />
      </main>
      <Footer />
    </>
  );
};

export default VIPMembership;
