import { useEffect, useState } from "react";
import { Smartphone, Share, Plus, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/**
 * Generic "Add to Home Screen" install button.
 *
 * Forces a specific manifest to be active at install-time so the resulting
 * home-screen icon uses the correct name + start_url. Handles iOS Safari
 * (instructions modal) and Chromium (native beforeinstallprompt).
 */

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export interface InstallAppButtonProps {
  /** App label shown in the button + dialog (e.g. "Admin", "Agent"). */
  appName: string;
  /** Manifest path to activate before install (e.g. "/manifest-admin.json"). */
  manifestPath: string;
  /** Path the icon will deep-link to (informational, shown in iOS dialog). */
  startUrl: string;
  /** Visible label override; defaults to `Add ${appName} App`. */
  label?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function InstallAppButton({
  appName,
  manifestPath,
  startUrl,
  label,
  variant = "outline",
  size = "sm",
  className,
}: InstallAppButtonProps) {
  const { toast } = useToast();
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setBip(null);
      toast({
        title: `${appName} app installed`,
        description: "Open it from your home screen any time.",
      });
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [appName, toast]);

  const ensureManifest = () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    const absolute = new URL(manifestPath, window.location.origin).href;
    if (link.href !== absolute) link.setAttribute("href", manifestPath);
  };

  const handleClick = async () => {
    ensureManifest();

    if (installed) {
      toast({
        title: "Already installed",
        description: `Open the ${appName} app from your home screen.`,
      });
      return;
    }

    if (isIOS()) {
      setIosOpen(true);
      return;
    }

    if (bip) {
      try {
        await bip.prompt();
        const choice = await bip.userChoice;
        if (choice.outcome === "accepted") {
          toast({ title: `Installing ${appName} app…` });
        }
        setBip(null);
      } catch (err) {
        console.error("Install prompt failed", err);
        toast({
          title: "Install failed",
          description: "Try the install icon in your browser's address bar.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Install from your browser menu",
      description:
        "Chrome/Edge: address bar install icon. iPhone: open in Safari → Share → Add to Home Screen.",
    });
  };

  if (installed) {
    return (
      <Button variant="outline" size={size} disabled className={`gap-2 ${className ?? ""}`}>
        <Check className="h-4 w-4 text-emerald-600" />
        {appName} app installed
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick} className={`gap-2 ${className ?? ""}`}>
        <Download className="h-4 w-4" />
        {label ?? `Add ${appName} App`}
      </Button>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Install the {appName} app</DialogTitle>
            <DialogDescription className="text-center">
              Adds a home-screen icon that opens directly to{" "}
              <span className="font-medium text-foreground">{startUrl}</span>.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                1
              </span>
              <span className="flex-1">
                Tap the <Share className="mx-1 inline h-4 w-4 align-text-bottom" />{" "}
                <strong>Share</strong> button at the bottom of Safari.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                2
              </span>
              <span className="flex-1">
                Choose <Plus className="mx-1 inline h-4 w-4 align-text-bottom" />{" "}
                <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                3
              </span>
              <span className="flex-1">
                Confirm the suggested name and tap <strong>Add</strong>. Open the
                new icon to land on your dashboard.
              </span>
            </li>
          </ol>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Make sure you're using <strong>Safari</strong> — Chrome on iPhone
            can't install web apps.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
