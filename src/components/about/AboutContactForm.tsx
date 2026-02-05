import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Send, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  agent_id: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
}

interface AboutContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgentId?: string | null;
  selectedAgentName?: string | null;
}

export function AboutContactForm({
  open,
  onOpenChange,
  selectedAgentId,
  selectedAgentName,
}: AboutContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name, title")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      agent_id: selectedAgentId || "",
      message: "",
    },
  });

  // Update agent_id when selectedAgentId changes
  if (selectedAgentId && form.getValues("agent_id") !== selectedAgentId) {
    form.setValue("agent_id", selectedAgentId);
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Get selected agent name for the booking
      const selectedAgent = teamMembers.find((m) => m.id === data.agent_id);
      
      const { error } = await supabase.from("bookings").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.message || null,
        project_name: selectedAgent
          ? `Request to work with ${selectedAgent.full_name}`
          : "General Consultation Request",
        appointment_type: "showing" as const,
        buyer_type: "first_time" as const,
        timeline: "3_6_months" as const,
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: "10:00",
        lead_source: "about_page",
      });

      if (error) throw error;

      toast.success("Request submitted! We'll be in touch shortly.");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = selectedAgentName
    ? `Work with ${selectedAgentName}`
    : "Book a Free Consultation";

  const description = selectedAgentName
    ? `Connect directly with ${selectedAgentName} for personalized guidance on your real estate journey.`
    : "Get expert advice on presale condos, townhomes, and new construction in Metro Vancouver & Fraser Valley.";

  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(604) 555-0123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!selectedAgentId && teamMembers.length > 0 && (
          <FormField
            control={form.control}
            name="agent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Agent (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any available agent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any available agent</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} — {member.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about what you're looking for..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Request</span>
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Free consultation • No obligation • Response within 24 hours
        </p>
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {selectedAgentName ? (
                  <User className="h-5 w-5 text-primary" />
                ) : (
                  <Calendar className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-left">{title}</DialogTitle>
                <DialogDescription className="text-left text-sm">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="text-left px-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {selectedAgentName ? (
                <User className="h-5 w-5 text-primary" />
              ) : (
                <Calendar className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription className="text-sm">
                {description}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        {FormContent}
      </DrawerContent>
    </Drawer>
  );
}
