import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type CopyType = "email_subject" | "email_body" | "social_caption" | "flyer_headline" | "listing_description";

const COPY_TYPES: { id: CopyType; label: string; description: string; placeholder: string }[] = [
  { id: "email_subject", label: "Email Subject Line", description: "High-converting email subject lines", placeholder: "What project/topic is this email about?" },
  { id: "email_body", label: "Email Body Copy", description: "Persuasive email body content", placeholder: "Describe the project and key selling points..." },
  { id: "social_caption", label: "Social Media Caption", description: "Engaging captions for Instagram/Facebook", placeholder: "What project or topic? Any hashtags to include?" },
  { id: "flyer_headline", label: "Flyer Headline & Tagline", description: "Attention-grabbing print headlines", placeholder: "Describe the project and target audience..." },
  { id: "listing_description", label: "Listing Description", description: "Compelling property descriptions", placeholder: "Key features: bedrooms, location, amenities, price range..." },
];

const TONE_OPTIONS = [
  { id: "luxury", label: "Luxury & Premium" },
  { id: "urgent", label: "Urgency & FOMO" },
  { id: "informative", label: "Informative & Professional" },
  { id: "friendly", label: "Friendly & Approachable" },
];

export function AiCopyAssistant() {
  const [copyType, setCopyType] = useState<CopyType>("email_subject");
  const [tone, setTone] = useState("luxury");
  const [context, setContext] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const currentType = COPY_TYPES.find(t => t.id === copyType)!;

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("Please provide some context first");
      return;
    }

    setGenerating(true);
    setResults([]);

    const toneLabel = TONE_OPTIONS.find(t => t.id === tone)?.label || "Professional";

    const systemPrompt = `You are a premium real estate marketing copywriter specializing in Vancouver presale condos and townhomes. You write compelling, high-converting copy for real estate agents.

Tone: ${toneLabel}
Output format: Return exactly 5 variations, numbered 1-5. Each variation on its own line. No extra explanation.`;

    const prompts: Record<CopyType, string> = {
      email_subject: `Write 5 email subject lines for a real estate email about: ${context}. Keep each under 60 characters. Make them compelling with curiosity, urgency, or exclusivity.`,
      email_body: `Write 5 short email body paragraphs (2-3 sentences each) for a presale real estate email about: ${context}. Include a clear call-to-action.`,
      social_caption: `Write 5 Instagram/Facebook captions for a presale real estate post about: ${context}. Include relevant emojis and 3-5 hashtags at the end of each.`,
      flyer_headline: `Write 5 print flyer headlines with taglines for a presale project: ${context}. Format each as "HEADLINE — Tagline". Keep headlines under 6 words.`,
      listing_description: `Write 5 short property listing descriptions (3-4 sentences each) for: ${context}. Highlight lifestyle benefits and investment potential.`,
    };

    try {
      const { data, error } = await supabase.functions.invoke("ai-copy-generator", {
        body: {
          systemPrompt,
          userPrompt: prompts[copyType],
        },
      });

      if (error) throw error;

      const text = data?.text || data?.content || "";
      const lines = text
        .split("\n")
        .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((l: string) => l.length > 10);
      
      setResults(lines.slice(0, 5));
      
      if (lines.length === 0) {
        toast.error("No results generated — try again with more context");
      }
    } catch (err: any) {
      console.error("AI copy generation failed:", err);
      // Fallback: generate template-based suggestions
      const fallbackResults = generateFallback(copyType, context, toneLabel);
      setResults(fallbackResults);
      toast.info("Using template-based suggestions");
    }

    setGenerating(false);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI Copy Assistant</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">Generate marketing copy for emails, social media & flyers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground">What do you need?</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Copy type pills */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Copy Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COPY_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setCopyType(t.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                        copyType === t.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Context</Label>
                <Textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder={currentType.placeholder}
                  className="text-sm mt-1 min-h-[100px]"
                />
              </div>

              <Button className="w-full gap-1.5" onClick={handleGenerate} disabled={generating || !context.trim()}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate {currentType.label}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                {results.length > 0 ? `${results.length} Variations` : "Results"}
              </p>
              {results.length > 0 && (
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={handleGenerate}>
                  <RotateCcw className="h-2.5 w-2.5" /> Regenerate
                </Button>
              )}
            </div>
            {results.length === 0 ? (
              <div className="p-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Enter context and generate copy</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">You'll get 5 variations to choose from</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((result, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold text-primary/60 mt-0.5 flex-shrink-0">{i + 1}</span>
                      <p className="text-xs leading-relaxed flex-1">{result}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => handleCopy(result)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback template-based suggestions when AI is unavailable
function generateFallback(type: CopyType, context: string, tone: string): string[] {
  const words = context.split(" ").slice(0, 3).join(" ");
  const templates: Record<CopyType, string[]> = {
    email_subject: [
      `🏠 Exclusive Preview: ${words} — Limited Units Available`,
      `Don't Miss Out: ${words} Presale Pricing Ends Soon`,
      `Your Private Invitation: ${words} VIP Preview`,
      `Just Listed: ${words} — Starting From the Low $400s`,
      `⚡ ${words}: Only 12 Units Remaining`,
    ],
    email_body: [
      `We're thrilled to announce an exclusive opportunity at ${words}. With premium finishes, unbeatable location, and limited availability, this is your chance to secure your ideal home at presale pricing. Book your private preview today.`,
      `${words} is redefining luxury living in the heart of the city. Featuring thoughtfully designed floor plans and world-class amenities, this is an investment opportunity you won't want to miss. Reply to schedule a walkthrough.`,
      `Act now — ${words} is selling fast. Our VIP buyers have already reserved over 60% of available units. Don't miss your chance to get in at today's pricing before the public launch.`,
      `Looking for your next smart investment? ${words} offers exceptional value with strong rental yields and projected appreciation. Let me show you the numbers — book a 15-minute call today.`,
      `I wanted to personally invite you to explore ${words}. This boutique collection of homes combines premium design with an unbeatable location. Limited units remain — let's connect this week.`,
    ],
    social_caption: [
      `✨ Introducing ${words} — Where luxury meets lifestyle. Presale pricing available now for a limited time. DM us for exclusive access. 🏠 #Presale #VancouverRealEstate #LuxuryLiving`,
      `🔥 Just launched: ${words}! Premium finishes, rooftop amenities, and a walk score of 90+. Who's ready to call this home? 🏗️ #NewDevelopment #Presale #InvestSmart`,
      `📍 Location, location, location. ${words} puts you in the heart of it all. Starting from the $400s. Link in bio for floor plans! 🔑 #PresaleProperties #VancouverCondos`,
      `🚀 Don't sleep on ${words}! Early buyers are already seeing value. Secure your unit before public launch. DM "INFO" for details. 💰 #RealEstateInvesting #Presale`,
      `🏡 Dream home alert! ${words} offers the perfect blend of style, comfort, and investment potential. Book your preview today. ✅ #HomeBuyer #PresaleCondo #VancouverLiving`,
    ],
    flyer_headline: [
      `LIVE ELEVATED — Presale Pricing Now Available at ${words}`,
      `YOUR NEXT CHAPTER — Discover ${words} Starting From the $400s`,
      `INVEST SMARTER — ${words} Presale Event This Weekend`,
      `REDEFINE HOME — Luxury Living at ${words}`,
      `ACT NOW — Limited Units at ${words} Won't Last`,
    ],
    listing_description: [
      `Welcome to ${words}, a stunning new development offering the pinnacle of urban living. Featuring premium finishes, floor-to-ceiling windows, and designer kitchens, every detail has been carefully curated. Enjoy rooftop amenities and a Walk Score of 90+.`,
      `${words} presents an exceptional investment opportunity in one of the city's most sought-after neighborhoods. With strong rental demand and projected appreciation, this presale offers both lifestyle and financial returns.`,
      `Step into the future of luxury at ${words}. This boutique collection features thoughtfully designed floor plans ranging from studios to spacious 3-bedrooms. EV-ready parking and smart home technology come standard.`,
      `Experience elevated living at ${words}. Located steps from transit, dining, and parks, this development combines convenience with sophistication. Completion expected 2026 — secure your unit at today's pricing.`,
      `${words} is where modern design meets timeless elegance. Every residence features engineered hardwood, quartz countertops, and spa-inspired bathrooms. Amenities include a fitness center, co-working lounge, and landscaped courtyard.`,
    ],
  };
  return templates[type];
}
