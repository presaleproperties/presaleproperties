import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  const lastUpdated = "February 28, 2026";

  return (
    <>
      <Helmet>
        <title>Privacy Policy | PresaleProperties.com</title>
        <meta name="description" content="Privacy Policy for PresaleProperties.com — how we collect, use, and protect your personal information in compliance with PIPEDA." />
        <link rel="canonical" href="https://presaleproperties.com/privacy" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <ConversionHeader />

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              PresaleProperties.com ("we", "us", "our") is a real estate platform operated by Presale Properties Group,
              based in Metro Vancouver, British Columbia, Canada. We specialize in presale condos, townhomes, and new construction
              homes across BC. You can reach us at{" "}
              <a href="mailto:info@presaleproperties.com" className="text-primary">info@presaleproperties.com</a> or by phone at{" "}
              <a href="tel:+16722581100" className="text-primary">672-258-1100</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information you voluntarily provide when you:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Register for VIP presale access or submit a contact form</li>
              <li>Request floor plans, pricing, or project information</li>
              <li>Subscribe to our newsletter or market updates</li>
              <li>Create a buyer account or agent profile</li>
              <li>Book a property preview or consultation</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              This may include your name, email address, phone number, property preferences, and agent status.
              We also automatically collect technical data such as IP address, browser type, pages visited,
              and referral source through cookies and similar technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>To respond to your inquiries and provide presale property information</li>
              <li>To send you relevant project updates, pricing, and floor plans you requested</li>
              <li>To send market updates and newsletters (you can unsubscribe at any time)</li>
              <li>To connect you with our licensed real estate team</li>
              <li>To improve our platform and user experience</li>
              <li>To comply with legal obligations under PIPEDA and BC privacy law</li>
              <li>To analyze website usage using Google Analytics 4 and Meta Pixel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and tracking pixels for analytics and advertising purposes, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-3">
              <li><strong>Google Analytics 4</strong> — to understand how visitors use our site (anonymized)</li>
              <li><strong>Meta Pixel</strong> — to measure ad performance and build relevant audiences on Facebook/Instagram</li>
              <li><strong>Session cookies</strong> — to remember your preferences during a visit</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can opt out of Google Analytics at{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary" target="_blank" rel="noopener noreferrer">
                tools.google.com/dlpage/gaoptout
              </a>{" "}
              and manage Meta ad preferences at{" "}
              <a href="https://www.facebook.com/adpreferences" className="text-primary" target="_blank" rel="noopener noreferrer">
                facebook.com/adpreferences
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sharing Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share it with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-3">
              <li>Our licensed real estate agents who assist with your inquiry</li>
              <li>Developers and project marketers when you request specific project information</li>
              <li>Service providers (Supabase, Resend, Zapier) who help us operate the platform under strict data agreements</li>
              <li>Law enforcement if required by applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes described in this policy,
              or as required by law. You may request deletion of your data at any time by emailing us at{" "}
              <a href="mailto:info@presaleproperties.com" className="text-primary">info@presaleproperties.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights Under PIPEDA</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Withdraw consent for marketing communications at any time</li>
              <li>Request deletion of your data</li>
              <li>File a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:info@presaleproperties.com" className="text-primary">info@presaleproperties.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures including encrypted connections (HTTPS/TLS), 
              row-level security on our database, and restricted access controls to protect your information. 
              No method of transmission over the internet is 100% secure, but we take reasonable steps to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to developer websites, MLS listings, and other third-party platforms.
              We are not responsible for the privacy practices of those sites. We encourage you to review their
              privacy policies before providing personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will post the updated policy on this page with a
              revised date. Continued use of our platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions, requests, or complaints, contact us at:
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg text-sm text-muted-foreground space-y-1">
              <p><strong>Presale Properties Group</strong></p>
              <p>Metro Vancouver, BC, Canada</p>
              <p>Email: <a href="mailto:info@presaleproperties.com" className="text-primary">info@presaleproperties.com</a></p>
              <p>Phone: <a href="tel:+16722581100" className="text-primary">672-258-1100</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
