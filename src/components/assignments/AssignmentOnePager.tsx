/**
 * AssignmentOnePager — 612px wide print-safe template for html2canvas capture.
 * No CSS Grid, no overflow:hidden. All layout uses block/inline-block/flex.
 */
import { forwardRef } from "react";
import logoWhite from "@/assets/logo-white.png";

interface ListingRow {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  assignment_price: number;
  original_price: number | null;
  deposit_to_lock: number | null;
  buyer_agent_commission: string | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  exterior_sqft: number | null;
  floor_level: number | null;
  exposure: string | null;
  parking: string | null;
  has_locker: boolean;
  unit_number: string | null;
  unit_type: string | null;
  floor_plan_url: string | null;
  floor_plan_name: string | null;
  featured_image: string | null;
  photos: string[] | null;
  estimated_completion: string | null;
  developer_approval_required: boolean;
}

interface ProjectRow {
  name: string;
  city: string;
  neighborhood: string;
  developer_name: string | null;
  featured_image: string | null;
  highlights: string[] | null;
  amenities: string[] | null;
  deposit_structure: string | null;
  deposit_percent: number | null;
  completion_year: number | null;
  completion_month: number | null;
  strata_fees: string | null;
}

interface Props {
  listing: ListingRow;
  project: ProjectRow | null;
  heroImage: string | undefined;
  completionDisplay: string;
}

const fmt = (p: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(p);

const GOLD = "#c9a84c";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT = "#f9fafb";
const WHITE = "#ffffff";

export const AssignmentOnePager = forwardRef<HTMLDivElement, Props>(
  ({ listing, project, heroImage, completionDisplay }, ref) => {
    const discount =
      listing.original_price && listing.original_price > listing.assignment_price
        ? listing.original_price - listing.assignment_price
        : null;

    const highlights = project?.highlights?.slice(0, 6) || [];
    const amenities = project?.amenities?.slice(0, 8) || [];

    return (
      <div
        ref={ref}
        style={{
          width: 612,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: WHITE,
          display: "block",
          position: "relative",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            backgroundColor: DARK,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <img src={logoWhite} alt="PresaleProperties" style={{ height: 28, display: "block" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Assignment Sale
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>
              presaleproperties.ca
            </div>
          </div>
        </div>

        {/* ── HERO IMAGE ── */}
        {heroImage && (
          <div style={{ width: 612, height: 240, display: "block", overflow: "hidden", position: "relative" }}>
            <img
              src={heroImage}
              alt={listing.title}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Dark gradient overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
              }}
            />
            {/* Price pill */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                backgroundColor: GOLD,
                color: WHITE,
                fontSize: 22,
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: 6,
                letterSpacing: "-0.02em",
              }}
            >
              {fmt(listing.assignment_price)}
            </div>
            {discount && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 20,
                  backgroundColor: "#16a34a",
                  color: WHITE,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 6,
                }}
              >
                Save {fmt(discount)}
              </div>
            )}
          </div>
        )}

        {/* ── TITLE BLOCK ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid #e5e7eb` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: DARK, lineHeight: 1.2 }}>{listing.title}</div>
          <div style={{ fontSize: 13, color: GRAY, marginTop: 4 }}>
            {listing.project_name}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
            {`, ${listing.city}`}
          </div>

          {/* Specs row */}
          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            {[
              { label: "Beds", val: `${listing.beds}` },
              { label: "Baths", val: `${listing.baths}` },
              listing.interior_sqft ? { label: "Interior", val: `${listing.interior_sqft.toLocaleString()} sqft` } : null,
              listing.exterior_sqft ? { label: "Outdoor", val: `${listing.exterior_sqft.toLocaleString()} sqft` } : null,
              listing.floor_level ? { label: "Floor", val: `${listing.floor_level}` } : null,
              listing.exposure ? { label: "Exposure", val: listing.exposure } : null,
            ]
              .filter(Boolean)
              .map((s: any) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: GRAY, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
          </div>
        </div>

        {/* ── TWO-COLUMN BODY ── */}
        <div style={{ display: "flex", padding: "0 0 0 0" }}>
          {/* Left column */}
          <div style={{ flex: 1, padding: "16px 20px 20px 24px", borderRight: `1px solid #e5e7eb` }}>

            {/* Pricing details */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Pricing Details
              </div>
              {[
                listing.original_price ? ["Original Price", fmt(listing.original_price)] : null,
                ["Assignment Price", fmt(listing.assignment_price)],
                discount ? ["Savings", fmt(discount)] : null,
                listing.deposit_to_lock ? ["Deposit to Lock", fmt(listing.deposit_to_lock)] : null,
                listing.buyer_agent_commission ? ["Buyer Commission", listing.buyer_agent_commission] : null,
              ]
                .filter(Boolean)
                .map(([k, v]: any) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: DARK }}>
                    <span style={{ color: GRAY }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
            </div>

            {/* Unit info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Unit Info
              </div>
              {[
                listing.unit_number ? ["Unit #", listing.unit_number] : null,
                listing.unit_type ? ["Type", listing.unit_type] : null,
                ["Est. Completion", completionDisplay],
                ["Parking", listing.parking || "Not included"],
                ["Locker", listing.has_locker ? "Included" : "Not included"],
                ["Dev. Approval", listing.developer_approval_required ? "Required" : "Not required"],
              ]
                .filter(Boolean)
                .map(([k, v]: any) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: DARK }}>
                    <span style={{ color: GRAY }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
            </div>

            {/* Deposit structure */}
            {project?.deposit_structure && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Deposit Structure
                </div>
                <div style={{ fontSize: 11, color: GRAY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {project.deposit_structure}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ width: 220, padding: "16px 24px 20px 20px" }}>

            {/* Project highlights */}
            {highlights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Highlights
                </div>
                {highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginTop: 4, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: DARK, lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Amenities
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {amenities.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        backgroundColor: LIGHT,
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        padding: "2px 7px",
                        color: DARK,
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strata fees */}
            {project?.strata_fees && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Strata Fees
                </div>
                <div style={{ fontSize: 12, color: DARK }}>{project.strata_fees}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            backgroundColor: DARK,
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.5 }}>
            Pricing & availability subject to change. Information for agent use only.
          </div>
          <div style={{ color: GOLD, fontSize: 10, fontWeight: 600 }}>
            presaleproperties.ca
          </div>
        </div>
      </div>
    );
  }
);
AssignmentOnePager.displayName = "AssignmentOnePager";
