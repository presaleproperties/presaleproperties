import { Flame, TrendingUp, Clock } from "lucide-react";

interface DeckScarcityBannerProps {
  unitsRemaining?: number | null;
  nextPriceIncrease?: string | null;
}

export function DeckScarcityBanner({ unitsRemaining, nextPriceIncrease }: DeckScarcityBannerProps) {
  if (!unitsRemaining && !nextPriceIncrease) return null;

  return (
    <div className="relative overflow-hidden bg-destructive/5 border-y border-destructive/20">
      {/* subtle pulse line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">

          {unitsRemaining !== null && unitsRemaining !== undefined && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/15 shrink-0">
                <Flame className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] text-destructive/70 uppercase tracking-widest font-semibold leading-none mb-0.5">
                  Limited Availability
                </p>
                <p className="text-sm font-bold text-destructive leading-none">
                  {unitsRemaining === 1
                    ? "Only 1 unit remaining at this price"
                    : `Only ${unitsRemaining} units remaining at this price`}
                </p>
              </div>
            </div>
          )}

          {unitsRemaining !== null && unitsRemaining !== undefined && nextPriceIncrease && (
            <div className="hidden sm:block w-px h-8 bg-destructive/20" />
          )}

          {nextPriceIncrease && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 shrink-0">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest font-semibold leading-none mb-0.5">
                  Upcoming Price Increase
                </p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 leading-none">
                  Next price is {nextPriceIncrease} more
                </p>
              </div>
            </div>
          )}

          {/* Urgency pulse dot — far right */}
          <div className="sm:ml-auto flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Act Now
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />
    </div>
  );
}
