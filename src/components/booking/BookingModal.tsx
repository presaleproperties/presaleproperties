import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay, getDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle, Loader2, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type BuyerType = "first_time" | "investor" | "upgrader" | "other";
type Timeline = "0_3_months" | "3_6_months" | "6_12_months" | "12_plus_months";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectCity?: string;
  projectNeighborhood?: string;
  projectUrl?: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface SchedulerSettings {
  slot_duration_minutes: number;
  buffer_minutes: number;
  max_bookings_per_slot: number;
  advance_booking_days: number;
}

interface ExistingBooking {
  appointment_date: string;
  appointment_time: string;
}

const BUYER_TYPES: { value: BuyerType; label: string }[] = [
  { value: "first_time", label: "First-time buyer" },
  { value: "investor", label: "Investor" },
  { value: "upgrader", label: "Upgrading" },
  { value: "other", label: "Other" },
];

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "0_3_months", label: "0-3 months" },
  { value: "3_6_months", label: "3-6 months" },
  { value: "6_12_months", label: "6-12 months" },
  { value: "12_plus_months", label: "12+ months" },
];

export function BookingModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectCity,
  projectNeighborhood,
  projectUrl,
}: BookingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [buyerType, setBuyerType] = useState<BuyerType>("first_time");
  const [timeline, setTimeline] = useState<Timeline>("0_3_months");
  const [notes, setNotes] = useState("");

  // Data state
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [settings, setSettings] = useState<SchedulerSettings | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch availability data
  useEffect(() => {
    if (open) {
      fetchSchedulerData();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime("");
      setName("");
      setEmail("");
      setPhone("");
      setBuyerType("first_time");
      setTimeline("0_3_months");
      setNotes("");
      setIsSuccess(false);
    }
  }, [open]);

  const fetchSchedulerData = async () => {
    setLoading(true);
    try {
      const [availabilityRes, settingsRes, blockedRes, bookingsRes] = await Promise.all([
        supabase.from("scheduler_availability").select("*").eq("is_active", true),
        supabase.from("scheduler_settings").select("*").single(),
        supabase.from("scheduler_blocked_dates").select("blocked_date"),
        supabase.from("bookings").select("appointment_date, appointment_time")
          .in("status", ["pending", "confirmed"]),
      ]);

      if (availabilityRes.data) setAvailability(availabilityRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data.map(d => new Date(d.blocked_date)));
      if (bookingsRes.data) setExistingBookings(bookingsRes.data);
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

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !settings) return [];
    
    const dayOfWeek = getDay(selectedDate);
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvailability) return [];

    const slots: string[] = [];
    const [startHour, startMin] = dayAvailability.start_time.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.end_time.split(":").map(Number);
    
    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    const slotDuration = settings.slot_duration_minutes + settings.buffer_minutes;

    while (current + settings.slot_duration_minutes <= end) {
      const hour = Math.floor(current / 60);
      const min = current % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      
      // Check if slot is already booked
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const bookedCount = existingBookings.filter(
        b => b.appointment_date === dateStr && b.appointment_time === timeStr + ":00"
      ).length;
      
      if (bookedCount < settings.max_bookings_per_slot) {
        slots.push(timeStr);
      }
      
      current += slotDuration;
    }

    return slots;
  }, [selectedDate, availability, settings, existingBookings]);

  const isDateDisabled = (date: Date) => {
    return !availableDates.some(d => isSameDay(d, date));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsSubmitting(true);
    try {
      // Get UTM params and referrer
      const urlParams = new URLSearchParams(window.location.search);
      
      const bookingData = {
        appointment_type: "showing" as const,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime + ":00",
        project_id: projectId,
        project_name: projectName,
        project_url: projectUrl || window.location.href,
        project_city: projectCity,
        project_neighborhood: projectNeighborhood,
        name,
        email,
        phone,
        buyer_type: buyerType,
        timeline,
        notes: notes || null,
        utm_source: urlParams.get("utm_source"),
        utm_medium: urlParams.get("utm_medium"),
        utm_campaign: urlParams.get("utm_campaign"),
        referrer: document.referrer || null,
      };

      const { error } = await supabase.from("bookings").insert(bookingData);

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-booking-notification", {
        body: {
          ...bookingData,
          formattedDate: format(selectedDate, "EEEE, MMMM d, yyyy"),
          formattedTime: format(new Date(`2000-01-01T${selectedTime}`), "h:mm a"),
        },
      });

      // Track analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "booking_completed", {
          event_category: "engagement",
          project_name: projectName,
          appointment_type: "showing",
          buyer_type: buyerType,
          timeline,
        });
      }

      setIsSuccess(true);
      toast({
        title: "Booking request submitted!",
        description: "We'll confirm your appointment soon.",
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedDate;
      case 2:
        return !!selectedTime;
      case 3:
        return name.trim() && email.trim() && phone.trim();
      default:
        return false;
    }
  };

  const formatTimeDisplay = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), "h:mm a");
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              We've received your showing request for {projectName}. 
              You'll receive a confirmation email with the address once approved.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left text-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTime && formatTimeDisplay(selectedTime)}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-left text-sm mb-6">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span className="text-blue-800">
                  Sales centre address will be provided upon confirmation
                </span>
              </div>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === 1 && "Select a Date"}
            {step === 2 && "Select a Time"}
            {step === 3 && "Your Information"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{projectName}</p>
          <p className="text-xs text-muted-foreground">
            Tour the sales centre and display suite in person
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-4">
            {/* Step 1: Date Selection */}
            {step === 1 && (
              <div>
                <div className="flex justify-center mb-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    fromDate={addDays(new Date(), 1)}
                    toDate={settings ? addDays(new Date(), settings.advance_booking_days) : undefined}
                    className="rounded-md border"
                  />
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  Mon–Thu & Sat–Sun, 12:00 PM – 5:00 PM
                </div>
              </div>
            )}

            {/* Step 2: Time Selection */}
            {step === 2 && (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.length === 0 ? (
                  <p className="col-span-3 text-center text-muted-foreground py-8">
                    No available times for this date
                  </p>
                ) : (
                  timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="text-sm"
                    >
                      {formatTimeDisplay(time)}
                    </Button>
                  ))
                )}
              </div>
            )}

            {/* Step 3: Contact Info */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(604) 555-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am a... *</Label>
                  <RadioGroup value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
                    <div className="grid grid-cols-2 gap-2">
                      {BUYER_TYPES.map((type) => (
                        <Label
                          key={type.value}
                          className={cn(
                            "flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors",
                            buyerType === type.value && "border-primary bg-primary/5"
                          )}
                        >
                          <RadioGroupItem value={type.value} />
                          {type.label}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Timeline to Purchase *</Label>
                  <RadioGroup value={timeline} onValueChange={(v) => setTimeline(v as Timeline)}>
                    <div className="grid grid-cols-2 gap-2">
                      {TIMELINES.map((t) => (
                        <Label
                          key={t.value}
                          className={cn(
                            "flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors",
                            timeline === t.value && "border-primary bg-primary/5"
                          )}
                        >
                          <RadioGroupItem value={t.value} />
                          {t.label}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific questions or requirements?"
                    rows={2}
                  />
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Sales centre address will be provided upon confirmation</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {!loading && (
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canProceed() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Step indicator */}
        {!loading && (
          <div className="flex justify-center gap-1.5 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
