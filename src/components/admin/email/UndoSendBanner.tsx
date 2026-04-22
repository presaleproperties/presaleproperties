/**
 * UndoSendBanner
 * ─────────────────────────────────────────────────────────────────────────
 * 5-second undo window after the user clicks Send. The actual send is
 * delayed by 5s; clicking Undo cancels the timeout and reopens the draft.
 *
 * Renders as a sonner-style toast pinned to the bottom of the viewport.
 */
import { useEffect, useState } from "react";
import { Loader2, Undo2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** Total countdown in ms. */
  duration?: number;
  /** Called when the timer completes (no undo). */
  onComplete: () => void;
  /** Called when the user clicks Undo. */
  onUndo: () => void;
  /** Label shown ("Sending to 12 leads…") */
  label: string;
}

export function UndoSendBanner({ duration = 5000, onComplete, onUndo, label }: Props) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 80);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seconds = Math.ceil(remaining / 1000);
  const pct = (remaining / duration) * 100;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-xs">
            <div className="font-medium text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground">Sending in {seconds}s — undo if needed</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            className="ml-2 h-7 gap-1 text-[11px]"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </Button>
        </div>
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BulkSendProgress({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? (sent / total) * 100 : 0;
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] w-[280px] -translate-x-1/2 rounded-lg border border-border bg-card p-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span className="text-xs font-medium">Sending bulk email</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {sent}/{total}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
