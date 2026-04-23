import { Facebook, Twitter, Linkedin, Link2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";


interface SocialShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  hashtags?: string[];
  className?: string;
  variant?: "default" | "compact" | "vertical";
}

export function SocialShareButtons({ 
  title, 
  description = "",
  url,
  image,
  hashtags = ["presale", "realestate", "vancouver"],
  className = "",
  variant = "default"
}: SocialShareButtonsProps) {
  // Share the real site URL so the share sheet shows presaleproperties.com +
  // favicon. Crawlers fetching this URL get the right per-page OG card.
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagString = hashtags.join(",");

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtagString}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400,scrollbars=yes");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const buttonSize = variant === "compact" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4";

  const buttons = [
    { key: "facebook", icon: Facebook, label: "Share on Facebook", action: () => handleShare("facebook"), color: "hover:text-[#1877F2]" },
    { key: "twitter", icon: Twitter, label: "Share on X (Twitter)", action: () => handleShare("twitter"), color: "hover:text-foreground" },
    { key: "linkedin", icon: Linkedin, label: "Share on LinkedIn", action: () => handleShare("linkedin"), color: "hover:text-[#0A66C2]" },
    { key: "whatsapp", icon: MessageCircle, label: "Share on WhatsApp", action: () => handleShare("whatsapp"), color: "hover:text-[#25D366]" },
    { key: "email", icon: Mail, label: "Share via Email", action: () => handleShare("email"), color: "hover:text-primary" },
    { key: "copy", icon: Link2, label: "Copy Link", action: handleCopyLink, color: "hover:text-primary" },
  ];

  return (
    <TooltipProvider>
      <div className={`flex ${variant === "vertical" ? "flex-col" : "flex-row flex-wrap"} items-center gap-1.5 ${className}`}>
        {buttons.map(({ key, icon: Icon, label, action, color }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`${buttonSize} ${color} transition-colors`}
                onClick={action}
                aria-label={label}
              >
                <Icon className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={variant === "vertical" ? "right" : "top"}>
              <p className="text-xs">{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
