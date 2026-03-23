INSERT INTO public.blog_posts (
  title, slug, excerpt, content, category, featured_image,
  is_published, is_featured, publish_date, seo_title, seo_description, tags
) VALUES (
  'Presale Condo Financials: Deposits, Mortgages, and Hidden Costs',
  'presale-condo-financials-deposits-mortgages-hidden-costs',
  'How much deposit is needed for a presale condo in BC? Do you pay GST? What are the exact closing costs? This guide breaks down every dollar you need to prepare for before buying a new build in Surrey or the Fraser Valley.',
  $HTMLCONTENT$<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; background: #f8f6f1; font-family: Georgia, serif; }
  .hero { position: relative; width: 100%; height: 520px; overflow: hidden; }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.20) 55%, transparent 100%); }
  .hero-text { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 48px; }
  .hero-category { display: inline-block; background: #b8860b; color: #fff; font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 14px; border-radius: 3px; margin-bottom: 14px; }
  .hero-title { font-family: Georgia, serif; font-size: 40px; font-weight: 700; color: #fff; line-height: 1.15; margin: 0 0 16px; text-shadow: 0 2px 12px rgba(0,0,0,0.45); }
  .hero-meta { font-family: Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.75); }
  .hero-meta span { margin-right: 18px; }
  .article-body { max-width: 800px; margin: 0 auto; padding: 52px 24px 72px; }
  .author-card { display: flex; align-items: center; gap: 16px; background: #fff; border: 1px solid #e8e2d9; border-radius: 12px; padding: 20px 24px; margin-bottom: 44px; }
  .author-name { font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 3px; }
  .author-title-text { font-family: Arial, sans-serif; font-size: 13px; color: #888; margin: 0; }
  .verified { display: inline-block; background: #b8860b; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; }
  p { font-size: 18px; line-height: 1.8; color: #2c2c2c; margin: 0 0 26px; }
  h2 { font-family: Georgia, serif; font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 52px 0 20px; padding-left: 18px; border-left: 4px solid #b8860b; line-height: 1.25; }
  strong { color: #1a1a1a; font-weight: 700; }
  ol { margin: 0 0 28px; padding-left: 0; list-style: none; counter-reset: steps; }
  ol li { counter-increment: steps; display: flex; gap: 18px; margin-bottom: 24px; font-size: 18px; line-height: 1.75; color: #2c2c2c; }
  ol li::before { content: counter(steps); display: flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; border-radius: 50%; background: #b8860b; color: #fff; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; margin-top: 3px; flex-shrink: 0; }
  .callout { background: #1a1a1a; color: #f0ead8; border-radius: 14px; padding: 32px 36px; margin: 44px 0; }
  .callout-title { font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #b8860b; margin: 0 0 12px; }
  .callout p { color: #e8dfc8; font-size: 17px; margin: 0; line-height: 1.75; }
  .cost-table { width: 100%; border-collapse: collapse; margin: 36px 0; font-family: Arial, sans-serif; }
  .cost-table thead tr { background: #b8860b; }
  .cost-table thead th { color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 16px; text-align: left; }
  .cost-table tbody tr:nth-child(even) { background: #fdf9f2; }
  .cost-table tbody tr:nth-child(odd) { background: #fff; }
  .cost-table tbody td { font-size: 15px; color: #2c2c2c; padding: 13px 16px; border-bottom: 1px solid #ede8e0; vertical-align: top; }
  .cost-table tbody tr:last-child td { border-bottom: none; font-weight: 700; color: #1a1a1a; }
  .cost-table .amt { font-weight: 700; color: #b8860b; white-space: nowrap; }
  .cost-table .note { font-size: 13px; color: #888; margin-top: 3px; }
  .deposit-timeline { background: #fff; border: 1px solid #e8e2d9; border-radius: 12px; padding: 28px 32px; margin: 36px 0; }
  .deposit-timeline-title { font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #b8860b; margin: 0 0 22px; }
  .timeline-item { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 20px; }
  .timeline-item:last-child { margin-bottom: 0; }
  .timeline-dot { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #b8860b; color: #fff; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .timeline-label { font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; color: #b8860b; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 3px; }
  .timeline-desc { font-size: 15px; color: #2c2c2c; margin: 0; line-height: 1.55; }
  .timeline-amount { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
  .bottom-line { background: linear-gradient(135deg, #1a1a1a 0%, #2d2410 100%); border-radius: 16px; padding: 40px 44px; margin-top: 56px; text-align: center; }
  .bottom-line h3 { font-family: Georgia, serif; color: #f0ead8; font-size: 24px; margin: 0 0 14px; }
  .bottom-line p { color: rgba(240,234,216,0.8); font-size: 16px; margin: 0; }
</style>
</head>
<body>

<div class="hero">
  <img src="https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/blog-images/presale-condo-financials-deposits-mortgages-hidden-costs.jpg" alt="Mortgage document, calculator, Canadian cash and condo building model on a glass desk" />
  <div class="hero-overlay"></div>
  <div class="hero-text">
    <div class="hero-category">Financial Guide</div>
    <h1 class="hero-title">Presale Condo Financials: Deposits,<br>Mortgages, and Hidden Costs</h1>
    <div class="hero-meta">
      <span>By Uzair Muhammad</span>
      <span>March 23, 2026</span>
      <span>10 min read</span>
    </div>
  </div>
</div>

<div class="article-body">

  <div class="author-card">
    <div style="display:flex;width:52px;height:52px;border-radius:50%;background:#b8860b;color:#fff;font-size:20px;font-weight:700;align-items:center;justify-content:center;flex-shrink:0;">U</div>
    <div>
      <div class="author-name">Uzair Muhammad <span class="verified">Verified</span></div>
      <div class="author-title-text">Presale Specialist &middot; PresaleProperties.com</div>
    </div>
  </div>

  <p>You are ready to enter the BC real estate market, but the financial mechanics of buying a new build feel overwhelming. You are looking at your bank account and trying to determine if you actually have the cash required to secure a unit.</p>

  <p>The questions we hear every day are: How much deposit is needed for a presale condo in BC? Do I need a mortgage right away? What are the exact closing costs, and how does GST work on new construction?</p>

  <p>At Presale Properties, we believe in complete financial transparency. If you are looking at new developments in Surrey or the Fraser Valley, you need to understand the exact costs involved before you walk into a presentation centre.</p>

  <h2>The Reality of Presale Deposits and Financing</h2>

  <p>When you purchase a presale condo, you are not buying the physical property today; you are securing the right to buy it in the future. Because of this, you do not need a mortgage on day one.</p>

  <p>Instead, you are required to pay a deposit, which is typically broken down into installments over 12 to 24 months. While 20% used to be the standard, many developers in today&#39;s market are offering more flexible structures, such as 10% or 15% total deposit. You might pay 5% when you sign the contract, another 5% in six months, and the final 5% a year later.</p>

  <p>You only need to finalize your mortgage and pay the remaining balance when the building is finished and you take possession. This structure gives you years to save additional funds, increase your income, and prepare for closing.</p>

  <div class="deposit-timeline">
    <div class="deposit-timeline-title">Example Deposit Schedule &mdash; $700K Surrey Condo</div>
    <div class="timeline-item">
      <div class="timeline-dot">1</div>
      <div>
        <div class="timeline-label">At Signing</div>
        <div class="timeline-amount">$35,000 &mdash; 5%</div>
        <div class="timeline-desc">Due immediately upon contract execution. Must be certified funds.</div>
      </div>
    </div>
    <div class="timeline-item">
      <div class="timeline-dot">2</div>
      <div>
        <div class="timeline-label">90 Days</div>
        <div class="timeline-amount">$35,000 &mdash; 5%</div>
        <div class="timeline-desc">Second installment. Set a calendar reminder &mdash; late payment can void your contract.</div>
      </div>
    </div>
    <div class="timeline-item">
      <div class="timeline-dot">3</div>
      <div>
        <div class="timeline-label">180 Days</div>
        <div class="timeline-amount">$35,000 &mdash; 5%</div>
        <div class="timeline-desc">Final deposit installment. Held in lawyer&#39;s trust until completion.</div>
      </div>
    </div>
    <div class="timeline-item" style="margin-bottom:0;">
      <div class="timeline-dot" style="background:#1a1a1a;">M</div>
      <div>
        <div class="timeline-label" style="color:#1a1a1a;">Completion (2&ndash;4 Years)</div>
        <div class="timeline-amount">$595,000 &mdash; Mortgage</div>
        <div class="timeline-desc">Remaining balance financed. GST and closing costs also due at this stage.</div>
      </div>
    </div>
  </div>

  <h2>Why This Matters to You</h2>

  <p>If you are a first-time buyer, understanding the deposit timeline is crucial. It allows you to enter the market without needing a massive lump sum immediately. However, you must ensure you have the cash flow to meet each deposit milestone, or you risk breaching your contract.</p>

  <p>If you are an investor, the deposit structure dictates your leverage. A lower deposit requirement means less of your capital is tied up during the construction phase. However, investors must also accurately project their final closing costs to ensure the property will be cash-flow positive upon completion.</p>

  <div class="callout">
    <div class="callout-title">The Biggest Trap</div>
    <p>Many buyers budget perfectly for the deposit but fail to account for the taxes and fees due on closing day. GST alone on a $700K condo is $35,000 &mdash; that is a number that surprises a lot of buyers who did not plan for it.</p>
  </div>

  <h2>How to Prepare Your Finances</h2>

  <p>Here is the exact breakdown of the costs you need to prepare for:</p>

  <ol>
    <li><div><strong>Understand the Deposit Structure.</strong> How much deposit is needed for a presale condo in BC? Expect between 10% and 20%. Always ask the developer for a clear, written schedule of when each payment is due, and ensure those funds are liquid and accessible.</div></li>
    <li><div><strong>Account for GST.</strong> Do you pay GST on presale condos in BC? Yes, all new construction is subject to 5% GST. If you plan to live in the unit and it is under $450,000, you may qualify for a partial rebate. Investors must pay GST upfront but can often claim a rebate if they rent the unit on a long-term lease.</div></li>
    <li><div><strong>Calculate Your Closing Costs.</strong> What are the exact closing costs on a new build? You should budget approximately 1.5% to 2% of the purchase price to cover legal fees, appraisal fees, and strata move-in fees.</div></li>
    <li><div><strong>Factor in Property Transfer Tax (PTT).</strong> Unless you qualify for specific exemptions (like the first-time buyer or newly built home exemption), you will be required to pay PTT upon closing. This can be a significant sum on higher-priced properties.</div></li>
    <li><div><strong>Secure a Rate Hold.</strong> Do I need a mortgage right away for a presale? No, but you should speak with a mortgage broker to get a pre-approval or a builder&#39;s cap rate. This protects you if interest rates rise before your completion date.</div></li>
  </ol>

  <table class="cost-table">
    <thead>
      <tr>
        <th>Cost Item</th>
        <th>Estimate on $700K Condo</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Deposit (15%)</td>
        <td class="amt">$105,000</td>
        <td><div class="note">Staggered over 12&ndash;18 months. Held in trust.</div></td>
      </tr>
      <tr>
        <td>GST (5%)</td>
        <td class="amt">$35,000</td>
        <td><div class="note">Due at completion. Partial rebate may apply for owner-occupiers.</div></td>
      </tr>
      <tr>
        <td>Property Transfer Tax</td>
        <td class="amt">$12,000</td>
        <td><div class="note">First-time buyers and new build exemptions may apply.</div></td>
      </tr>
      <tr>
        <td>Legal Fees</td>
        <td class="amt">$2,000 &ndash; $3,500</td>
        <td><div class="note">Real estate lawyer for contract review and title transfer.</div></td>
      </tr>
      <tr>
        <td>Strata Move-In Fee</td>
        <td class="amt">$200 &ndash; $500</td>
        <td><div class="note">Charged by the strata corporation on possession day.</div></td>
      </tr>
      <tr>
        <td>Home Inspection / Deficiency Walk</td>
        <td class="amt">$400 &ndash; $600</td>
        <td><div class="note">Strongly recommended before accepting keys.</div></td>
      </tr>
      <tr>
        <td><strong>Total Estimated Cash Required at Closing</strong></td>
        <td class="amt">~$155,000+</td>
        <td><div class="note">Excludes mortgage down payment (included in deposit above).</div></td>
      </tr>
    </tbody>
  </table>

  <div class="bottom-line">
    <h3>The Bottom Line</h3>
    <p>The financial reality of buying a presale condo is highly structured. You do not need a mortgage today, but you must have a clear plan for your deposit installments, the 5% GST, and your final closing costs. By understanding these numbers upfront, you can use the presale timeline to your advantage and enter the market with confidence.</p>
  </div>

</div>
</body>
</html>$HTMLCONTENT$,
  'Financial Guide',
  'https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/blog-images/presale-condo-financials-deposits-mortgages-hidden-costs.jpg',
  true,
  false,
  '2026-03-23',
  'Presale Condo Financials: Deposits, Mortgages & Hidden Costs BC',
  'How much deposit for a presale condo in BC? Do you pay GST? Get the exact closing cost breakdown — deposits, PTT, GST, legal fees — before you buy a new build in Surrey or Fraser Valley.',
  ARRAY['presale deposit BC','presale condo GST BC','closing costs new build BC','presale mortgage BC','property transfer tax BC','how much deposit presale condo','Surrey presale financials']
)
ON CONFLICT (slug) DO NOTHING;
