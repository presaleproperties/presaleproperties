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
 * "Add Admin App" — installs a dedicated home-screen icon that opens
 * directly to /admin/leads. Triggers the admin manifest swap and either
 * fires the native beforeinstallprompt (Android/Chrome) or shows iOS
 * Safari instructions.
 */

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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

export function InstallAdminAppButton() {
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
        title: "Admin app installed",
        description: "Open it from your home screen to jump straight to leads.",
      });
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [toast]);

  const ensureAdminManifest = () => {
    // Force the admin manifest to be active right now so iOS/Chrome
    // pick up the correct start_url + name when the user installs.
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) {
      const target = "/manifest-admin.json";
      const absolute = new URL(target, window.location.origin).href;
      if (link.href !== absolute) link.setAttribute("href", target);
    }
  };

  const handleClick = async () => {
    ensureAdminManifest();

    if (installed) {
      toast({
        title: "Already installed",
        description: "Open the Admin app from your home screen.",
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
          toast({ title: "Installing Admin app…" });
        }
        setBip(null);
      } catch (err) {
        console.error("Install prompt failed", err);
        toast({
          title: "Install failed",
          description: "Try using your browser's install option in the address bar.",
          variant: "destructive",
        });
      }
      return;
    }

    // Fallback: no native prompt available (e.g. desktop Safari, Firefox)
    toast({
      title: "Install from your browser menu",
      description:
        "In Chrome/Edge use the install icon in the address bar. On iPhone open in Safari and tap Share → Add to Home Screen.",
    });
  };

  if (installed) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Check className="h-4 w-4 text-emerald-600" />
        Admin app installed
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick} className="gap-2">
        <Download className="h-4 w-4" />
        Add Admin App
      </Button>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Install the Admin app</DialogTitle>
            <DialogDescription className="text-center">
              Adds a home-screen icon that opens directly to{" "}
              <span className="font-medium text-foreground">/admin/leads</span>.
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
                Confirm the name <strong>"Admin"</strong> and tap{" "}
                <strong>Add</strong>. Open the new icon to land on the leads
                dashboard.
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
