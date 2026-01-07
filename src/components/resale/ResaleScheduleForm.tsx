import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ResaleScheduleFormProps {
  listingId: string;
  listingAddress: string;
  listingCity: string;
}

type TimeSlot = "morning" | "afternoon" | "evening";

const TIME_SLOTS: { value: TimeSlot; label: string; time: string }[] = [
  { value: "morning", label: "MORNING", time: "8AM TO 12PM" },
  { value: "afternoon", label: "AFTERNOON", time: "12PM TO 4PM" },
  { value: "evening", label: "EVENING", time: "4PM TO 8PM" },
];

export function ResaleScheduleForm({ listingId, listingAddress, listingCity }: ResaleScheduleFormProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    hasAgent: "",
    message: "",
  });

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i + 1));
  const visibleDates = dates.slice(startIndex, startIndex + 3);

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + 3 < dates.length;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };

  const handleRequestTour = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    setShowContactForm(true);
    setShowQuestionForm(false);
  };

  const handleAskQuestion = () => {
    setShowQuestionForm(true);
    setShowContactForm(false);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM params from session storage
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;

      if (showContactForm && selectedDate) {
        // Submit as booking
        const timeSlotMap = {
          morning: "10:00",
          afternoon: "14:00",
          evening: "17:00",
        };

        await supabase.from("bookings").insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          project_name: `Resale: ${listingAddress}`,
          project_city: listingCity,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTimeSlot ? timeSlotMap[selectedTimeSlot] : "14:00",
          appointment_type: "showing",
          buyer_type: formData.hasAgent === "yes" ? "other" : "first_time",
          timeline: "0_3_months",
          notes: `Time preference: ${selectedTimeSlot || "Flexible"}. Working with agent: ${formData.hasAgent || "Not specified"}`,
          lead_source: "resale_tour_request",
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        });

        toast.success("Tour request submitted! We'll confirm your appointment soon.");
      } else {
        // Submit as general inquiry
        await supabase.from("project_leads").insert({
          id: crypto.randomUUID(),
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message,
          lead_source: "resale_inquiry",
          agent_status: formData.hasAgent === "yes" ? "Working with agent" : formData.hasAgent === "no" ? "No agent" : null,
          landing_page: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        });

        toast.success("Question submitted! We'll get back to you soon.");
      }

      // Reset form
      setFormData({ name: "", phone: "", email: "", hasAgent: "", message: "" });
      setShowContactForm(false);
      setShowQuestionForm(false);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showContactForm || showQuestionForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {showContactForm ? "Contact Details" : "Ask a Question"}
          </h3>
          <button 
            onClick={() => {
              setShowContactForm(false);
              setShowQuestionForm(false);
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        </div>

        {showContactForm && selectedDate && (
          <p className="text-sm text-muted-foreground">
            Tour request for {format(selectedDate, "EEEE, MMM d")}
            {selectedTimeSlot && ` · ${TIME_SLOTS.find(s => s.value === selectedTimeSlot)?.time}`}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name*"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-12"
              required
            />
          </div>
          <div>
            <Input
              type="tel"
              placeholder="Mobile Phone*"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="h-12"
              required
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email*"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12"
              required
            />
          </div>

          {showQuestionForm && (
            <div>
              <textarea
                placeholder="Your question..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full h-24 px-3 py-2 border rounded-lg resize-none text-sm"
              />
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Are you working with a real estate agent?
            </p>
            <RadioGroup 
              value={formData.hasAgent} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, hasAgent: v }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="agent-yes" />
                <Label htmlFor="agent-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="agent-no" />
                <Label htmlFor="agent-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : showContactForm ? "SUBMIT TOUR REQUEST" : "SEND MESSAGE"}
          </Button>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            By proceeding, you consent to receive communications from PresaleProperties about your inquiry 
            and other home-related matters, but not as a condition of any purchase.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Schedule a tour</h3>
        <p className="text-sm text-muted-foreground mt-1">Tour with a buyer's agent</p>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
          disabled={!canGoBack}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoBack ? "hover:bg-muted" : "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex-1 grid grid-cols-3 gap-2">
          {visibleDates.map((date) => {
            const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  "flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {format(date, "EEE")}
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {format(date, "d")}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {format(date, "MMM")}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStartIndex(Math.min(dates.length - 3, startIndex + 1))}
          disabled={!canGoForward}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoForward ? "hover:bg-muted" : "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedTimeSlot === slot.value;
          return (
            <button
              key={slot.value}
              onClick={() => handleTimeSelect(slot.value)}
              className={cn(
                "py-3 px-2 rounded-lg border-2 transition-all text-center",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <span className="block text-xs font-semibold text-foreground">
                {slot.label}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {slot.time}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={handleRequestTour}
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold"
        >
          REQUEST A TOUR
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">OR</div>
        
        <Button 
          variant="outline" 
          onClick={handleAskQuestion}
          className="w-full h-12 font-semibold"
        >
          ASK A QUESTION
        </Button>
      </div>
    </div>
  );
}
