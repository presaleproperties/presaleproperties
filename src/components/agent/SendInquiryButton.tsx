import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendInquiryButtonProps {
  listingId: string;
  toAgentId: string;
  projectName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SendInquiryButton({
  listingId,
  toAgentId,
  projectName,
  variant = "outline",
  size = "default",
  className
}: SendInquiryButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const sendInquiry = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!message.trim()) throw new Error("Please enter a message");

      const { error } = await (supabase as any)
        .from("assignment_inquiries")
        .insert({
          listing_id: listingId,
          from_agent_id: user.id,
          to_agent_id: toAgentId,
          message: message.trim(),
          status: "pending"
        });

      if (error) throw error;

      // Trigger notification email (async, don't wait)
      supabase.functions.invoke("send-inquiry-notification", {
        body: { listingId, fromAgentId: user.id, toAgentId, message: message.trim() }
      }).catch(console.error);
    },
    onSuccess: () => {
      toast.success("Inquiry sent successfully!");
      setMessage("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agent-inquiries-sent"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send inquiry");
    }
  });

  // Don't show button if user is the listing agent
  if (user?.id === toAgentId) return null;

  // Don't show button if user is not logged in
  if (!user) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => toast.info("Please log in to contact the listing agent")}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Contact Agent
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Inquiry</DialogTitle>
          <DialogDescription>
            Send a message to the listing agent about {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Textarea
            placeholder="Hi, I'm interested in learning more about this assignment. Do you have any additional details about the unit or the deposit structure?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => sendInquiry.mutate()}
              disabled={sendInquiry.isPending || !message.trim()}
            >
              {sendInquiry.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Inquiry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
