import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Presale Properties</title>
        <meta name="description" content="Terms of Service for PresaleProperties.com. Read our terms governing the use of our presale real estate platform." />
        <link rel="canonical" href="https://presaleproperties.com/terms-of-service" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <ConversionHeader />

        <main className="flex-1 container max-w-3xl py-12 md:py-16 px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: March 26, 2026</p>

          <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using PresaleProperties.com (the "Website"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Website. We reserve the right to modify these Terms at any time, and your continued use of the Website constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use of Website</h2>
              <p>
                The Website provides information about presale condos, townhomes, and new construction real estate in Metro Vancouver and the Fraser Valley, British Columbia. All content is for informational purposes only and does not constitute real estate, legal, financial, or investment advice. You agree to use the Website only for lawful purposes and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of the Website by, any third party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Accuracy of Information</h2>
              <p>
                While we strive to ensure that the information on this Website is accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of any information, products, services, or related graphics. Pricing, availability, floor plans, and project details are subject to change without notice. Always verify details directly with the developer or your licensed real estate professional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
              <p>
                All content on this Website, including but not limited to text, graphics, logos, images, data compilations, and software, is the property of PresaleProperties.com or its content suppliers and is protected by Canadian and international copyright, trademark, and intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. User Accounts & Submissions</h2>
              <p>
                If you create an account or submit information through the Website, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information and to update it as necessary. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Third-Party Links</h2>
              <p>
                The Website may contain links to third-party websites or services that are not owned or controlled by PresaleProperties.com. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by or in connection with the use of any such content or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by applicable law, PresaleProperties.com, its owners, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or in connection with your access to or use of the Website, whether based on warranty, contract, tort, or any other legal theory.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless PresaleProperties.com and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Website or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Province of British Columbia and the federal laws of Canada applicable therein, without regard to conflict of law principles. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of British Columbia, Canada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2">
                <strong>PresaleProperties.com</strong><br />
                666 Burrard St, Suite 500<br />
                Vancouver, BC V6C 3P6<br />
                Email: <a href="mailto:info@presaleproperties.com" className="text-primary hover:underline">info@presaleproperties.com</a><br />
                Phone: <a href="tel:+16722581100" className="text-primary hover:underline">(672) 258-1100</a>
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
