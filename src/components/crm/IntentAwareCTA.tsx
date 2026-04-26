/**
 * IntentAwareCTA — drop-in wrapper that swaps a generic CTA for a direct
 * WhatsApp-to-assigned-agent link when the CRM identifies the visitor as
 * a hot lead or carries a high-intent tag.
 *
 * Usage:
 *   <IntentAwareCTA
 *     projectName="The Mason"
 *     fallback={<Button>Contact Us</Button>}
 *   />
 *
 * Resolution rules (any one triggers the swap):
 *   - identity.hot_lead === true
 *   - identity.tags includes "high_intent" | "hot_lead" | "vip" | "vip_approved"
 *   - identity.lifecycle_stage in ("opportunity","sql","customer","vip")
 *
 * Falls back silently to the provided child CTA when the visitor is
 * unknown, has no assigned agent, or no agent phone is on file.
 */

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrmIdentity } from "@/hooks/useCrmIdentity";
import { trackCTAClick } from "@/lib/tracking";

const HIGH_INTENT_TAGS = new Set([
  "high_intent",
  "hot_lead",
  "vip",
  "vip_approved",
  "ready_to_buy",
]);

const HIGH_INTENT_STAGES = new Set([
  "opportunity",
  "sql",
  "customer",
  "vip",
]);

interface IntentAwareCTAProps {
  /** What to render when the visitor is anonymous or low-intent. */
  fallback: React.ReactNode;
  /** Optional project context — included in the WhatsApp prefilled message. */
  projectName?: string;
  /** Optional override of the default WhatsApp message. */
  whatsappMessage?: string;
  /** Optional className applied to the rendered Button. */
  className?: string;
}

function buildWhatsAppUrl(phone: string, message: string): string {
  // Strip everything but digits — wa.me requires an international number.
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function IntentAwareCTA({
  fallback,
  projectName,
  whatsappMessage,
  className,
}: IntentAwareCTAProps) {
  const { identity, loading } = useCrmIdentity();

  // While resolving, render the fallback to avoid layout shift.
  if (loading || !identity?.known) return <>{fallback}</>;

  const agent = identity.assigned_agent;
  if (!agent?.phone) return <>{fallback}</>;

  const isHot =
    identity.hot_lead === true ||
    (identity.tags ?? []).some((t) => HIGH_INTENT_TAGS.has(t)) ||
    (identity.lifecycle_stage
      ? HIGH_INTENT_STAGES.has(identity.lifecycle_stage)
      : false);

  if (!isHot) return <>{fallback}</>;

  const message =
    whatsappMessage ??
    (projectName
      ? `Hi ${agent.name.split(" ")[0]}, I'd like to chat about ${projectName}.`
      : `Hi ${agent.name.split(" ")[0]}, I have a quick question.`);

  const href = buildWhatsAppUrl(agent.phone, message);

  return (
    <Button
      asChild
      size="lg"
      className={className ?? "w-full font-bold bg-[#25D366] hover:bg-[#1ebe5a] text-white"}
      onClick={() =>
        trackCTAClick({
          cta_name: "intent_aware_whatsapp",
          cta_location: "intent_aware_cta",
          destination: href,
        })
      }
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp {agent.name.split(" ")[0]} directly
      </a>
    </Button>
  );
}
