import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackCTAClick } from "@/hooks/useLoftyTracking";

type TimePeriod = "early_afternoon" | "mid_afternoon" | "late_afternoon";

interface InlineSchedulerProps {
  projectId: string;
  projectName: string;
  projectCity?: string;
  projectNeighborhood?: string;
  onRequestTour: (date: Date, timePeriod: TimePeriod) => void;
}

interface AvailabilitySlot {
  day_of_week: number;
  is_active: boolean;
}

interface SchedulerSettings {
  advance_booking_days: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string; subLabel: string }[] = [
  { value: "early_afternoon", label: "12 - 1 PM", subLabel: "EARLY" },
  { value: "mid_afternoon", label: "2 - 3 PM", subLabel: "MID" },
  { value: "late_afternoon", label: "4 - 5 PM", subLabel: "LATE" },
];

export function InlineScheduler({
  projectId,
  projectName,
  onRequestTour,
}: InlineSchedulerProps) {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [settings, setSettings] = useState<SchedulerSettings | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("mid_afternoon");

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const fetchSchedulerData = async () => {
    setLoading(true);
    try {
      const [availabilityRes, settingsRes, blockedRes] = await Promise.all([
        supabase.from("scheduler_availability").select("day_of_week, is_active").eq("is_active", true),
        supabase.from("scheduler_settings").select("advance_booking_days").single(),
        supabase.from("scheduler_blocked_dates").select("blocked_date"),
      ]);

      if (availabilityRes.data) setAvailability(availabilityRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data.map(d => new Date(d.blocked_date)));
    } catch (error) {
      console.error("Error fetching scheduler data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate available dates
  const availableDates = useMemo(() => {
    if (!settings) return [];
    const dates: Date[] = [];
    const today = new Date();
    const maxDate = addDays(today, settings.advance_booking_days);

    for (let d = addDays(today, 1); d <= maxDate; d = addDays(d, 1)) {
      const dayOfWeek = getDay(d);
      const isAvailable = availability.some(a => a.day_of_week === dayOfWeek && a.is_active);
      const isBlocked = blockedDates.some(bd => isSameDay(bd, d));
      
      if (isAvailable && !isBlocked) {
        dates.push(d);
      }
    }
    return dates;
  }, [availability, blockedDates, settings]);

  // Set initial selected date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Get visible dates (3 at a time)
  const visibleDates = useMemo(() => {
    const start = dateOffset;
    return availableDates.slice(start, start + 3);
  }, [availableDates, dateOffset]);

  const canGoBack = dateOffset > 0;
  const canGoForward = dateOffset + 3 < availableDates.length;

  const handlePrev = () => {
    if (canGoBack) setDateOffset(prev => prev - 1);
  };

  const handleNext = () => {
    if (canGoForward) setDateOffset(prev => prev + 1);
  };

  const handleRequestTour = () => {
    if (selectedDate) {
      // Track CTA click
      trackCTAClick({
        cta_type: "request_tour",
        cta_label: "Request a Tour",
        cta_location: "inline_scheduler",
        project_id: projectId,
        project_name: projectName,
      });
      onRequestTour(selectedDate, selectedPeriod);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xl overflow-hidden">
        <div className="flex items-center justify-center py-6 lg:py-8">
          <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-elevated overflow-hidden hover:shadow-premium transition-shadow duration-300">
      {/* Header - Premium gradient */}
      <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-4 py-3 md:px-5 md:py-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <h3 className="text-base md:text-lg lg:text-xl font-bold text-background relative">Schedule a Tour</h3>
        <p className="text-xs md:text-sm text-background/70 mt-0.5 relative">Tour with a buyer's agent</p>
      </div>

      {/* Content - Optimized spacing for mobile */}
      <div className="p-4 md:p-5">
        {/* Date Selection - Larger touch targets on mobile */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-3 md:mb-4">
          <button
            onClick={handlePrev}
            disabled={!canGoBack}
            className={cn(
              "p-2 rounded-full transition-colors",
              canGoBack ? "hover:bg-muted text-foreground active:bg-muted/80" : "text-muted-foreground/30 cursor-not-allowed"
            )}
            aria-label="Previous dates"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-1.5 md:gap-2">
            {visibleDates.map((date) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center justify-center w-[68px] h-[68px] md:w-[72px] md:h-[72px] lg:w-20 lg:h-20 rounded-xl border-2 transition-all active:scale-95",
                    isSelected
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {format(date, "EEE")}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-foreground">
                    {format(date, "d")}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    {format(date, "MMM")}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={!canGoForward}
            className={cn(
              "p-2 rounded-full transition-colors",
              canGoForward ? "hover:bg-muted text-foreground active:bg-muted/80" : "text-muted-foreground/30 cursor-not-allowed"
            )}
            aria-label="Next dates"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Time Period Selection - Better mobile spacing */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3 md:mb-4">
          {TIME_PERIODS.map((period) => {
            const isSelected = selectedPeriod === period.value;
            return (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 md:py-2.5 px-1 md:px-2 rounded-xl border-2 transition-all active:scale-95",
                  isSelected
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <span className="text-xs font-semibold text-foreground">
                  {period.label}
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  {period.subLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA Button - Full height for better touch */}
        <Button
          onClick={handleRequestTour}
          disabled={!selectedDate}
          className="w-full h-12 text-sm font-bold uppercase tracking-wide bg-foreground hover:bg-foreground/90 text-background shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Request a Tour
        </Button>
      </div>
    </div>
  );
}
