import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * preview-system-emails
 * ─────────────────────────────────────────────────────────────
 * Returns rendered HTML previews of all hardcoded auto-generated
 * system emails (the ones living inside Edge Functions, not in
 * the email_templates DB table).
 *
 * Usage: GET → returns { templates: [{ key, name, category, subject, description, html }] }
 */

const ACCENT = "#C9A55A";
const DARK = "#111111";
const F = "'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif";
const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

const SAMPLE_AGENT = {
  full_name: "Uzair Muhammad",
  title: "Presale Specialist",
  photo_url: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1772579582217-unijnf.jpg",
  phone: "778-231-3592",
  email: "info@presaleproperties.com",
};

const SAMPLE_PROJECT = {
  name: "The Belmont Residences",
  city: "Surrey",
  neighborhood: "Morgan Crossing",
  developer_name: "Marcon",
  featured_image: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/project-images/sample-hero.jpg",
  price_range: "From $589,900",
  starting_price: 589900,
  deposit_structure: "5% + 5% + 10%",
  deposit_percent: 20,
  completion_year: 2027,
  completion_month: 9,
  slug: "belmont-residences",
  brochure_files: ["https://example.com/brochure.pdf"],
  floorplan_files: ["https://example.com/floorplans.pdf"],
  pricing_sheets: ["https://example.com/pricing.pdf"],
};

function emailShell(content: string, previewText: string, subjectLine: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subjectLine}</title><style>body{margin:0;padding:0;background:#faf8f4;font-family:${F};}</style></head><body style="margin:0;padding:0;background:#faf8f4;"><span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${previewText}</span><table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;"><tr><td align="center" style="padding:24px 0;"><table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;">${content}</table></td></tr></table></body></html>`;
}

function agentCard(agent: typeof SAMPLE_AGENT, city?: string): string {
  return `
<tr><td style="height:2px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:0;background:#ffffff;">
<table cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" style="padding:28px 24px 12px;"><img src="${agent.photo_url}" width="80" height="80" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${ACCENT};" /></td></tr>
<tr><td align="center" style="padding:0 24px 8px;text-align:center;">
<p style="margin:0 0 4px;font-family:${F};font-size:18px;font-weight:800;color:${DARK};">${agent.full_name}</p>
<p style="margin:0 0 12px;font-family:${F};font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${ACCENT};">${agent.title}</p>
<p style="margin:0 0 4px;font-family:${F};font-size:14px;color:#555;">${agent.phone}</p>
<p style="margin:0;font-family:${F};font-size:13px;color:#8a7e6b;">${agent.email}</p>
</td></tr>
<tr><td align="center" style="padding:16px 24px 24px;border-top:1px solid #e8e2d6;"><img src="${LOGO_EMAIL_URL}" width="110" style="width:110px;" /></td></tr>
</table></td></tr>
<tr><td style="padding:20px 40px;background:#111;"><p style="margin:0 0 4px;font-family:${F};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">PRESALE PROPERTIES · ${(city || "VANCOUVER").toUpperCase()}, BC</p><p style="margin:0;font-family:${F};font-size:12px;color:#888;">presaleproperties.com · ${agent.phone}</p></td></tr>`;
}

// ── Template builders ────────────────────────────────────────

function leadMagnetEmail(): string {
  const subject = "Your Free Guide: 7 Costly Mistakes Presale Buyers Make";
  const body = `
<tr><td style="padding:48px 40px 24px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">YOUR FREE GUIDE</p>
<p style="margin:0 0 24px;font-family:${F};font-size:30px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">7 Costly Mistakes Presale Buyers Make</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah,</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Thanks for grabbing the guide. I put this together because I see the same mistakes <strong>cost buyers tens of thousands of dollars</strong> on presale purchases in Metro Vancouver every year.</p>
<p style="margin:0 0 28px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Inside you'll learn how to <strong>read assignment clauses</strong>, what really happens between deposit and completion, and the questions every buyer should ask <strong>before</strong> signing.</p>
</td></tr>
<tr><td style="padding:0 40px 32px;background:#fff;"><table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">DOWNLOAD YOUR GUIDE (PDF)</a></td></tr></table></td></tr>
<tr><td style="padding:0 40px 44px;background:#fff;border-top:1px solid #e8e2d6;padding-top:28px;">
<p style="margin:0 0 14px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Once you've had a read, I'd love to hear what stood out. Reply directly &mdash; no pressure.</p>
<p style="margin:0;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Talk soon,<br/><strong>Uzair</strong></p>
</td></tr>
${agentCard(SAMPLE_AGENT)}`;
  return emailShell(body, subject, subject);
}

function projectInquiryWithDocs(): string {
  const p = SAMPLE_PROJECT;
  const subject = `${p.name} — Your Requested Floor Plans & Details`;
  const body = `
<tr><td style="padding:0;line-height:0;"><img src="${p.featured_image}" width="600" style="display:block;width:100%;height:auto;"/></td></tr>
<tr><td style="padding:40px 40px 28px;background:#fff;">
<p style="margin:0 0 6px;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">${p.city.toUpperCase()} · ${p.developer_name.toUpperCase()}</p>
<p style="margin:0;font-family:${F};font-size:36px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1px;">${p.name}</p>
</td></tr>
<tr><td style="padding:0;border-top:1px solid #e8e2d6;border-bottom:1px solid #e8e2d6;background:#faf8f4;">
<table width="100%"><tr>
<td style="padding:18px 20px;border-right:1px solid #e8e2d6;"><p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:800;color:${DARK};">${p.price_range}</p><p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Starting From</p></td>
<td style="padding:18px 20px;border-right:1px solid #e8e2d6;"><p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:800;color:${DARK};">${p.deposit_structure}</p><p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Deposit</p></td>
<td style="padding:18px 20px;"><p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:800;color:${DARK};">Sep ${p.completion_year}</p><p style="margin:0;font-family:${F};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Completion</p></td>
</tr></table></td></tr>
<tr><td style="padding:36px 40px 20px;background:#fff;">
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah,</p>
<p style="margin:0;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Thank you for your interest in <strong>${p.name}</strong> in <strong>${p.city}</strong> by ${p.developer_name}. Here are the documents you requested.</p>
</td></tr>
<tr><td style="padding:0 40px 28px;background:#fff;">
<table width="100%" style="background:#faf8f4;border-radius:8px;border:1px solid #e8e2d6;"><tr><td style="padding:20px 24px;">
<p style="margin:0 0 14px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">YOUR REQUESTED DOCUMENTS</p>
<table width="100%" style="margin-bottom:8px;"><tr><td style="background:${DARK};border-radius:8px;padding:14px 20px;text-align:center;"><a href="#" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">📄 &nbsp; VIEW BROCHURE</a></td></tr></table>
<table width="100%" style="margin-bottom:8px;"><tr><td style="background:${DARK};border-radius:8px;padding:14px 20px;text-align:center;"><a href="#" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">📐 &nbsp; VIEW FLOOR PLANS</a></td></tr></table>
<table width="100%"><tr><td style="background:${DARK};border-radius:8px;padding:14px 20px;text-align:center;"><a href="#" style="font-family:${F};font-size:13px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">💰 &nbsp; VIEW PRICING</a></td></tr></table>
</td></tr></table></td></tr>
<tr><td style="padding:0 40px 44px;background:#fff;"><table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">CALL NOW &nbsp; ${SAMPLE_AGENT.phone}</a></td></tr></table></td></tr>
${agentCard(SAMPLE_AGENT, p.city)}`;
  return emailShell(body, subject, subject);
}

function projectInquiryAgentFollowup(): string {
  const p = SAMPLE_PROJECT;
  const subject = `${p.name} — We'll Be in Touch Shortly`;
  const body = `
<tr><td style="padding:0;line-height:0;"><img src="${p.featured_image}" width="600" style="display:block;width:100%;height:auto;"/></td></tr>
<tr><td style="padding:40px 40px 28px;background:#fff;">
<p style="margin:0 0 6px;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">${p.city.toUpperCase()} · ${p.developer_name.toUpperCase()}</p>
<p style="margin:0;font-family:${F};font-size:36px;font-weight:800;color:${DARK};line-height:1.1;letter-spacing:-1px;">${p.name}</p>
</td></tr>
<tr><td style="padding:36px 40px 16px;background:#fff;">
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah,</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Thank you for your interest in <strong>${p.name}</strong> in <strong>${p.city}</strong>.</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">The detailed floor plans and pricing for this project are <strong>not publicly available</strong> at this time. The developer has restricted distribution to authorized agents only.</p>
</td></tr>
<tr><td style="padding:0 40px 28px;background:#fff;">
<table width="100%" style="background:#faf8f4;border-radius:8px;border-left:3px solid ${ACCENT};"><tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">WHAT HAPPENS NEXT</p>
<p style="margin:0;font-family:${F};font-size:15px;color:#444;line-height:1.7;">An agent from our team will personally reach out to you with exclusive access to the floor plans, pricing, and any available incentives for <strong>${p.name}</strong>.</p>
</td></tr></table></td></tr>
<tr><td style="padding:0 40px 44px;background:#fff;"><table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">CALL NOW &nbsp; ${SAMPLE_AGENT.phone}</a></td></tr></table></td></tr>
${agentCard(SAMPLE_AGENT, p.city)}`;
  return emailShell(body, subject, subject);
}

function pitchDeckEmail(): string {
  const p = SAMPLE_PROJECT;
  const subject = `Your Exclusive Pricing for ${p.name} is Ready`;
  const body = `
<tr><td style="padding:0;line-height:0;"><img src="${p.featured_image}" width="600" style="display:block;width:100%;height:auto;"/></td></tr>
<tr><td style="padding:40px 40px 28px;background:#fff;text-align:center;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">EXCLUSIVE OFFERING · UNLOCKED</p>
<p style="margin:0;font-family:${F};font-size:32px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">${p.name}</p>
<p style="margin:8px 0 0;font-family:${F};font-size:14px;color:#777;">${p.city} · By ${p.developer_name}</p>
</td></tr>
<tr><td style="padding:0 40px 32px;background:#fff;">
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah,</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Your private pricing deck for ${p.name} is now available. This includes <strong>floor plans, exclusive credits, deposit structure</strong>, and net pricing after our negotiated incentives.</p>
<table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">VIEW MY PRIVATE DECK</a></td></tr></table>
</td></tr>
${agentCard(SAMPLE_AGENT, p.city)}`;
  return emailShell(body, subject, subject);
}

function bookingConfirmationEmail(): string {
  const subject = "Your Appointment is Confirmed — Presale Properties";
  const body = `
<tr><td style="padding:48px 40px 24px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">APPOINTMENT CONFIRMED</p>
<p style="margin:0 0 24px;font-family:${F};font-size:28px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">You're all set, Sarah 👋</p>
<p style="margin:0 0 24px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Thanks for booking a consultation with us. Here are your appointment details:</p>
<table width="100%" style="background:#faf8f4;border-radius:8px;border-left:3px solid ${ACCENT};margin-bottom:24px;"><tr><td style="padding:20px 24px;">
<p style="margin:0 0 6px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">DATE & TIME</p>
<p style="margin:0 0 14px;font-family:${F};font-size:16px;color:${DARK};font-weight:600;">Friday, May 2, 2026 at 2:00 PM</p>
<p style="margin:0 0 6px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">TYPE</p>
<p style="margin:0 0 14px;font-family:${F};font-size:16px;color:${DARK};font-weight:600;">Phone Consultation</p>
<p style="margin:0 0 6px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">PROJECT</p>
<p style="margin:0;font-family:${F};font-size:16px;color:${DARK};font-weight:600;">The Belmont Residences</p>
</td></tr></table>
<p style="margin:0;font-family:${F};font-size:15px;color:#444;line-height:1.75;">If you need to reschedule, just reply to this email or text me directly.</p>
</td></tr>
${agentCard(SAMPLE_AGENT)}`;
  return emailShell(body, subject, subject);
}

function welcomeEmail(): string {
  const subject = "Welcome to Presale Properties 🏙️";
  const body = `
<tr><td style="padding:48px 40px 24px;background:#fff;">
<p style="margin:0 0 24px;font-family:${F};font-size:30px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">Welcome aboard, Sarah!</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">You're now part of our VIP list — meaning you'll get early access to new presale releases, exclusive incentives, and off-market opportunities before they go public.</p>
<p style="margin:0 0 24px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Here's what to expect from us:</p>
<ul style="margin:0 0 24px;padding-left:20px;font-family:${F};font-size:15px;color:#444;line-height:1.85;">
<li>Weekly drops on new launches in Metro Vancouver</li>
<li>Pricing & deposit info before public release</li>
<li>Exclusive credits and incentives available only to our clients</li>
</ul>
<table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">BROWSE PRESALES</a></td></tr></table>
</td></tr>
${agentCard(SAMPLE_AGENT)}`;
  return emailShell(body, subject, subject);
}

function propertyAlertEmail(): string {
  const subject = "3 New Properties Match Your Search";
  const body = `
<tr><td style="padding:48px 40px 24px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">NEW MATCHES · DOWNTOWN VANCOUVER</p>
<p style="margin:0 0 24px;font-family:${F};font-size:28px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">3 new properties match your search</p>
<p style="margin:0 0 24px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah, here are the latest listings matching your "Downtown 2-bed under $1.2M" search:</p>
${[1,2,3].map(i => `
<table width="100%" style="border:1px solid #e8e2d6;border-radius:8px;margin-bottom:14px;overflow:hidden;"><tr><td style="padding:0;line-height:0;"><img src="${SAMPLE_PROJECT.featured_image}" width="520" style="width:100%;display:block;height:180px;object-fit:cover;"/></td></tr><tr><td style="padding:18px 20px;background:#fff;">
<p style="margin:0 0 4px;font-family:${F};font-size:18px;font-weight:700;color:${DARK};">${i === 1 ? "1234 Robson Street #1801" : i === 2 ? "888 Beach Ave #2204" : "555 Pacific Blvd #1502"}</p>
<p style="margin:0 0 8px;font-family:${F};font-size:14px;color:#777;">2 bed · 2 bath · ${850 + i * 50} sqft</p>
<p style="margin:0;font-family:${F};font-size:20px;font-weight:800;color:${ACCENT};">$${(1050000 + i * 25000).toLocaleString()}</p>
</td></tr></table>`).join("")}
<table width="100%" style="margin-top:20px;"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:18px 32px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">VIEW ALL MATCHES</a></td></tr></table>
</td></tr>
${agentCard(SAMPLE_AGENT)}`;
  return emailShell(body, subject, subject);
}

function dripEmail(): string {
  const subject = "Still looking? Here's what's hot in Vancouver this week";
  const body = `
<tr><td style="padding:48px 40px 24px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">WEEKLY MARKET UPDATE</p>
<p style="margin:0 0 24px;font-family:${F};font-size:28px;font-weight:800;color:${DARK};line-height:1.15;letter-spacing:-0.8px;">This week's top presales in Vancouver</p>
<p style="margin:0 0 18px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Hi Sarah, hope you're well! A few new releases worth knowing about this week:</p>
${[1,2,3].map(() => `<div style="border:1px solid #e8e2d6;border-radius:8px;overflow:hidden;margin-bottom:15px;"><img src="${SAMPLE_PROJECT.featured_image}" style="width:100%;height:150px;object-fit:cover;display:block;"/><div style="padding:16px;background:#fff;"><p style="margin:0 0 4px;font-family:${F};font-size:17px;font-weight:700;color:${DARK};">${SAMPLE_PROJECT.name}</p><p style="margin:0 0 8px;font-family:${F};font-size:13px;color:#777;">${SAMPLE_PROJECT.city} · ${SAMPLE_PROJECT.developer_name}</p><p style="margin:0;font-family:${F};font-size:14px;color:${ACCENT};font-weight:600;">From $589,900</p></div></div>`).join("")}
<p style="margin:18px 0 0;font-family:${F};font-size:15px;color:#444;line-height:1.75;">Want me to send the full pricing breakdown for any of these? Just reply.</p>
</td></tr>
${agentCard(SAMPLE_AGENT)}`;
  return emailShell(body, subject, subject);
}

function inquiryNotificationEmail(): string {
  const subject = "🔔 New Lead: Sarah Johnson — The Belmont Residences";
  const body = `
<tr><td style="padding:40px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#dc2626;">NEW LEAD ALERT</p>
<p style="margin:0 0 24px;font-family:${F};font-size:24px;font-weight:800;color:${DARK};">Sarah Johnson</p>
<table width="100%" style="background:#faf8f4;border-radius:8px;margin-bottom:20px;"><tr><td style="padding:20px;">
<p style="margin:0 0 12px;font-family:${F};font-size:14px;color:#444;"><strong>Email:</strong> sarah.j@example.com</p>
<p style="margin:0 0 12px;font-family:${F};font-size:14px;color:#444;"><strong>Phone:</strong> (604) 555-0142</p>
<p style="margin:0 0 12px;font-family:${F};font-size:14px;color:#444;"><strong>Project:</strong> The Belmont Residences</p>
<p style="margin:0 0 12px;font-family:${F};font-size:14px;color:#444;"><strong>Source:</strong> Project Inquiry Form</p>
<p style="margin:0;font-family:${F};font-size:14px;color:#444;"><strong>Message:</strong> Hi, I'd love to get the latest floor plans and pricing for the 2-bedroom units. Looking to buy in Q3 2026.</p>
</td></tr></table>
<table width="100%"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:16px 28px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">VIEW IN ADMIN</a></td></tr></table>
</td></tr>`;
  return emailShell(body, subject, subject);
}

function blogDraftEmail(): string {
  const subject = "📝 New Blog Drafts Ready for Review";
  const body = `
<tr><td style="padding:40px;background:#fff;">
<p style="margin:0 0 8px;font-family:${F};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">CONTENT REVIEW</p>
<p style="margin:0 0 24px;font-family:${F};font-size:24px;font-weight:800;color:${DARK};">3 new blog drafts ready</p>
<p style="margin:0 0 20px;font-family:${F};font-size:16px;color:#444;line-height:1.75;">Your AI content engine just generated 3 new blog drafts:</p>
${["Top 5 Surrey Presales Launching This Spring","Vancouver Market Update: April 2026","First-Time Buyer Guide: Navigating Presale Contracts"].map(t => `<div style="border:1px solid #e8e2d6;border-radius:8px;padding:16px 20px;margin-bottom:12px;"><p style="margin:0 0 4px;font-family:${F};font-size:16px;font-weight:700;color:${DARK};">${t}</p><p style="margin:0;font-family:${F};font-size:13px;color:#777;">Status: Draft · Ready for review</p></div>`).join("")}
<table width="100%" style="margin-top:20px;"><tr><td align="center" style="background:${DARK};border-radius:50px;padding:16px 28px;"><a href="#" style="font-family:${F};font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fff;text-decoration:none;">REVIEW DRAFTS</a></td></tr></table>
</td></tr>`;
  return emailShell(body, subject, subject);
}

// ── Manifest ─────────────────────────────────────────────────

const TEMPLATES = [
  {
    key: "lead_magnet_guide",
    name: "7 Mistakes Guide Delivery",
    category: "Lead Magnet",
    subject: "Your Free Guide: 7 Costly Mistakes Presale Buyers Make",
    description: "Sent instantly when someone submits the exit-intent popup or 7 Mistakes Guide form. Contains the PDF download link.",
    triggers: ["Exit-intent popup", "7 Mistakes Guide form", "Newsletter signup with no project"],
    edgeFunction: "send-lead-autoresponse",
    html: leadMagnetEmail(),
  },
  {
    key: "project_inquiry_with_docs",
    name: "Project Inquiry — With Floor Plans",
    category: "Project Inquiry",
    subject: "{Project Name} — Your Requested Floor Plans & Details",
    description: "Sent when a lead requests info on a project that HAS brochures/floor plans uploaded. Includes direct download buttons.",
    triggers: ["Project inquiry form (project has files)"],
    edgeFunction: "send-lead-autoresponse",
    html: projectInquiryWithDocs(),
  },
  {
    key: "project_inquiry_followup",
    name: "Project Inquiry — Agent Follow-Up",
    category: "Project Inquiry",
    subject: "{Project Name} — We'll Be in Touch Shortly",
    description: "Sent when a lead requests info on a project that does NOT have public docs. Promises personal agent outreach.",
    triggers: ["Project inquiry form (no files available)"],
    edgeFunction: "send-lead-autoresponse",
    html: projectInquiryAgentFollowup(),
  },
  {
    key: "pitch_deck_unlock",
    name: "Pitch Deck Unlock",
    category: "Pitch Deck",
    subject: "Your Exclusive Pricing for {Project Name} is Ready",
    description: "Sent after a lead unlocks the private pricing deck via SMS verification. Contains the deck link with exclusive pricing & credits.",
    triggers: ["Pitch deck pricing unlock"],
    edgeFunction: "send-deck-email",
    html: pitchDeckEmail(),
  },
  {
    key: "booking_confirmation",
    name: "Booking Confirmation",
    category: "Bookings",
    subject: "Your Appointment is Confirmed — Presale Properties",
    description: "Sent when a consultation/showing booking is confirmed. Includes date, time, type, and rescheduling instructions.",
    triggers: ["Booking form submission", "Booking status changed to 'confirmed'"],
    edgeFunction: "send-booking-status-update",
    html: bookingConfirmationEmail(),
  },
  {
    key: "welcome_vip",
    name: "VIP Welcome Email",
    category: "Onboarding",
    subject: "Welcome to Presale Properties 🏙️",
    description: "Sent when a new buyer signs up to the VIP list. Sets expectations for what they'll receive.",
    triggers: ["New buyer signup", "VIP portal registration"],
    edgeFunction: "send-welcome-email",
    html: welcomeEmail(),
  },
  {
    key: "property_alert",
    name: "Property Match Alert",
    category: "Saved Searches",
    subject: "{N} New Properties Match Your Search",
    description: "Sent automatically when new MLS listings match a client's saved search criteria. Includes property cards.",
    triggers: ["Saved search has new matches (daily/weekly)"],
    edgeFunction: "send-property-alerts",
    html: propertyAlertEmail(),
  },
  {
    key: "buyer_drip",
    name: "Buyer Drip — Weekly Update",
    category: "Drip Campaigns",
    subject: "Still looking? Here's what's hot in Vancouver this week",
    description: "Part of the automated buyer drip sequence. Sent weekly to nurture leads who haven't converted yet.",
    triggers: ["Buyer drip schedule (next_drip_at)"],
    edgeFunction: "process-buyer-drip",
    html: dripEmail(),
  },
  {
    key: "inquiry_notification",
    name: "Internal — New Lead Alert",
    category: "Internal Notifications",
    subject: "🔔 New Lead: {Name} — {Project Name}",
    description: "Internal notification sent to the admin/agent team whenever a new lead comes in. Includes contact info & message.",
    triggers: ["Any lead form submission"],
    edgeFunction: "send-inquiry-notification",
    html: inquiryNotificationEmail(),
  },
  {
    key: "blog_draft_notification",
    name: "Internal — Blog Drafts Ready",
    category: "Internal Notifications",
    subject: "📝 New Blog Drafts Ready for Review",
    description: "Internal notification sent when the AI content engine generates new blog drafts that need admin review.",
    triggers: ["Scheduled AI content generation completes"],
    edgeFunction: "send-blog-draft-notification",
    html: blogDraftEmail(),
  },
];

Deno.serve((req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return new Response(JSON.stringify({ templates: TEMPLATES }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
