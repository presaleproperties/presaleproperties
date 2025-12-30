import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimePeriod = "morning" | "afternoon" | "evening";

interface InlineSchedulerProps {
  projectId: string;
  projectName: string;
  projectCity?: string;
  projectNeighborhood?: string;
  onRequestTour: (date: Date, timePeriod: TimePeriod) => void;
  onAskQuestion: () => void;
}

interface AvailabilitySlot {
  day_of_week: number;
  is_active: boolean;
}

interface SchedulerSettings {
  advance_booking_days: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string; subLabel: string }[] = [
  { value: "morning", label: "MORNING", subLabel: "8AM TO 12PM" },
  { value: "afternoon", label: "AFTERNOON", subLabel: "12PM TO 4PM" },
  { value: "evening", label: "EVENING", subLabel: "4PM TO 8PM" },
];

export function InlineScheduler({
  projectId,
  projectName,
  onRequestTour,
  onAskQuestion,
}: InlineSchedulerProps) {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [settings, setSettings] = useState<SchedulerSettings | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("afternoon");

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
      onRequestTour(selectedDate, selectedPeriod);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-lg">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-xl md:text-2xl font-bold text-foreground">Schedule a tour</h3>
        <p className="text-sm text-muted-foreground mt-1">Tour with a buyer's agent</p>
      </div>

      {/* Date Selection */}
      <div className="flex items-center justify-center gap-1 mb-5">
        <button
          onClick={handlePrev}
          disabled={!canGoBack}
          className={cn(
            "p-1 rounded-full transition-colors",
            canGoBack ? "hover:bg-muted text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="Previous dates"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          {visibleDates.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(date, "EEE")}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {format(date, "d")}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">
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
            "p-1 rounded-full transition-colors",
            canGoForward ? "hover:bg-muted text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="Next dates"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Time Period Selection */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TIME_PERIODS.map((period) => {
          const isSelected = selectedPeriod === period.value;
          return (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <span className="text-[10px] md:text-xs font-semibold text-foreground">
                {period.label}
              </span>
              <span className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                {period.subLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleRequestTour}
          disabled={!selectedDate}
          className="w-full h-12 text-sm font-bold uppercase tracking-wide bg-foreground hover:bg-foreground/90 text-background"
        >
          Request a Tour
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          variant="outline"
          onClick={onAskQuestion}
          className="w-full h-12 text-sm font-bold uppercase tracking-wide border-2"
        >
          Ask a Question
        </Button>
      </div>
    </div>
  );
}
