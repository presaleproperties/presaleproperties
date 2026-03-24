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
    "Hi! I am Zara, reaching out from the Presale Properties office in Surrey. Happy to help you find the right new construction project in Metro Vancouver. Are you looking to invest or find your first home?",
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
      setConversation(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again!" }]);
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
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card rounded-t-2xl">
      <div className="relative shrink-0">
        <img src={zaraHeadshot} alt="Zara" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary" />
        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight">Zara</p>
        <p className="text-xs text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Online now · Presale Properties Office
        </p>
      </div>
      <div className="flex items-center gap-1">
        {onMinimize && (
          <button onClick={onMinimize} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Minimize">
            <Minus className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Close">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );

  const Messages = () => (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {conversation.map((msg, i) => (
        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
          <div className={cn(
            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
            msg.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}>
            <p>{msg.content}</p>
            {msg.projects && msg.projects.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {msg.projects.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onOpenChange(false); navigate(`/presale-projects/${p.slug}`); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-background border border-border hover:border-primary transition-colors text-left"
                  >
                    {p.featured_image && (
                      <img src={p.featured_image} alt={p.name} className="w-10 h-10 rounded-md object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>
                        <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{formatPrice(p.starting_price)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
                {msg.projects.length > 4 && (
                  <p className="text-[10px] text-muted-foreground text-center">+{msg.projects.length - 4} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Zara is typing...</span>
          </div>
        </div>
      )}
    </div>
  );

  const QuickReplies = () => (
    <div className="px-4 pb-2 flex flex-wrap gap-1.5">
      {QUICK_REPLIES.map((q) => (
        <button
          key={q}
          onClick={() => handleSend(q)}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground bg-background disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );

  const Disclaimer = () => (
    <p className="text-[11px] text-muted-foreground text-center px-4 pb-1">
      AI assistant · Licensed advice: Uzair Khalil, REALTOR®
    </p>
  );

  const InputBar = () => (
    <div className="px-3 pb-3 pt-2 border-t border-border">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything about presale"
            className={cn(
              "w-full pl-4 pr-10 py-3 rounded-full border border-border text-sm bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground",
              isListening && "border-red-500"
            )}
            disabled={isLoading}
          />
          {isSpeechSupported && (
            <button
              onClick={toggleVoice}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors",
                isListening && "text-red-500 animate-pulse"
              )}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
        </div>
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={isLoading || message.length < 2}
          className="h-11 w-11 rounded-full shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-2">Powered by Presale Properties Group</p>
    </div>
  );

  // Minimized desktop bar
  if (!isMobileOrTablet && isMinimized) {
    return (
      <div className="fixed right-4 bottom-4 z-50 w-[360px] bg-card rounded-2xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <img src={zaraHeadshot} alt="Zara" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Zara</p>
            {conversation.length > 1 && (
              <p className="text-xs text-muted-foreground">{conversation.length - 1} message{conversation.length > 2 ? "s" : ""}</p>
            )}
          </div>
          <button onClick={() => setIsMinimized(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop panel
  if (!isMobileOrTablet) {
    return (
      <div className="fixed right-4 top-20 bottom-4 z-50 w-[380px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col animate-in slide-in-from-right duration-300">
        <Header onMinimize={() => setIsMinimized(true)} />
        <Messages />
        <QuickReplies />
        <Disclaimer />
        <InputBar />
      </div>
    );
  }

  // Mobile bottom sheet
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto min-h-[120px] max-h-[50vh]">
          <Messages />
        </div>
        <QuickReplies />
        <Disclaimer />
        <InputBar />
      </div>
    </div>
  );
}
