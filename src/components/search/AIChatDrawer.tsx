import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, MapPin, DollarSign, ArrowRight, Mic, MicOff, X, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import zaraHeadshot from "@/assets/zara-headshot.png";

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  project_type: string;
  starting_price: number | null;
  deposit_percent: number | null;
  completion_year: number | null;
  status: string;
  featured_image: string | null;
  match_reasons: string[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  projects?: Project[];
}

const QUICK_REPLIES = [
  "Looking to invest",
  "First home buyer",
  "Surrey projects",
  "Under $600K",
  "Langley condos",
  "Book a call",
];

const GREETING: ConversationMessage = {
  role: "assistant",
  content:
    "Hi! I'm Zara, reaching out from the Presale Properties office in Surrey. Happy to help you find the right new construction project in Metro Vancouver. Are you looking to invest or find your first home?",
};

interface AIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatDrawer({ open, onOpenChange }: AIChatDrawerProps) {
  const navigate = useNavigate();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([GREETING]);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const initSpeech = useCallback(() => {
    if (!isSpeechSupported) return null;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => { setMessage(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    return r;
  }, [isSpeechSupported]);

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    if (!recognitionRef.current) recognitionRef.current = initSpeech();
    recognitionRef.current?.start();
    setIsListening(true);
  };

  const handleSend = async (text?: string) => {
    const q = text || message;
    if (!q.trim() || q.length < 2) return;
    setIsLoading(true);
    setMessage("");
    setConversation(prev => [...prev, { role: "user", content: q }]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-project-search", {
        body: { query: q, searchMode: "projects" },
      });
      if (error) throw error;
      setConversation(prev => [...prev, { role: "assistant", content: data.explanation, projects: data.projects }]);
    } catch {
      setConversation(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (p: number | null) => {
    if (!p) return "TBD";
    return p >= 1000000 ? `$${(p / 1000000).toFixed(1)}M` : `$${(p / 1000).toFixed(0)}K`;
  };

  if (!open) return null;

  const Header = ({ onMinimize }: { onMinimize?: () => void }) => (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <img
          src={zaraHeadshot}
          alt="Zara"
          className="w-11 h-11 rounded-full object-cover object-top ring-2 ring-primary/30 shadow-sm"
        />
        {/* Online indicator dot */}
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[hsl(142,71%,45%)] ring-2 ring-card shadow-sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight tracking-tight">Zara</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: "hsl(142,71%,35%)" }}>Online now · Presale Properties</p>
      </div>

      <div className="flex items-center gap-0.5">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-2 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onOpenChange(false)}
          className="p-2 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  const Messages = () => (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
      {conversation.map((msg, i) => (
        <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start items-end")}>
          {msg.role === "assistant" && (
            <img src={zaraHeadshot} alt="Zara" className="w-6 h-6 rounded-full object-cover object-top shrink-0 mb-0.5" />
          )}
          <div className={cn(
            "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted/70 text-foreground border border-border/40 rounded-bl-sm"
          )}>
            <p className="whitespace-pre-line">{msg.content}</p>
            {msg.projects && msg.projects.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.projects.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onOpenChange(false); navigate(`/presale-projects/${p.slug}`); }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-background border border-border/60 hover:border-primary/50 hover:shadow-sm transition-all text-left group"
                  >
                    {p.featured_image ? (
                      <img src={p.featured_image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>
                        <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{formatPrice(p.starting_price)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
                {msg.projects.length > 4 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">+{msg.projects.length - 4} more results</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex items-end gap-2 justify-start">
          <img src={zaraHeadshot} alt="Zara" className="w-6 h-6 rounded-full object-cover object-top shrink-0 mb-0.5" />
          <div className="bg-muted/70 border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const QuickReplies = () => (
    conversation.length <= 1 ? (
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/60 hover:bg-primary/5 hover:text-primary transition-all text-muted-foreground bg-background/80 disabled:opacity-40 font-medium"
          >
            {q}
          </button>
        ))}
      </div>
    ) : null
  );

  const InputBar = () => (
    <div className="px-4 pt-2 pb-4 border-t border-border/60 bg-background/50">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about presale projects..."
            className={cn(
              "w-full pl-4 pr-10 py-2.5 rounded-full border border-border/60 text-sm bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/70",
              isListening && "border-destructive/60 focus:ring-destructive/30"
            )}
            disabled={isLoading}
          />
          {isSpeechSupported && (
            <button
              onClick={toggleVoice}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors",
                isListening ? "text-destructive animate-pulse" : "text-muted-foreground/60"
              )}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={isLoading || message.length < 2}
          className="h-10 w-10 rounded-full shrink-0 shadow-sm"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-2.5 tracking-wide">
        AI assistant · Licensed advice: Uzair Khalil, REALTOR®
      </p>
    </div>
  );

  // Minimized desktop bar
  if (!isMobileOrTablet && isMinimized) {
    return (
      <div className="fixed right-6 bottom-6 z-50 w-[340px] bg-card rounded-2xl shadow-2xl border border-border/60 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative shrink-0">
            <img src={zaraHeadshot} alt="Zara" className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-primary/20" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Zara</p>
            <p className="text-xs text-emerald-600 font-medium">Online now</p>
          </div>
          <button onClick={() => setIsMinimized(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop panel
  if (!isMobileOrTablet) {
    return (
      <div className="fixed right-6 z-50 w-[380px] bg-card rounded-2xl shadow-2xl border border-border/60 flex flex-col animate-in slide-in-from-right duration-300"
        style={{ top: "80px", bottom: "24px" }}
      >
        <Header onMinimize={() => setIsMinimized(true)} />
        <Messages />
        <QuickReplies />
        <InputBar />
      </div>
    );
  }

  // Mobile bottom sheet
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <Header />
        <div className="flex-1 overflow-y-auto min-h-0">
          <Messages />
        </div>
        <QuickReplies />
        <InputBar />
      </div>
    </div>
  );
}
