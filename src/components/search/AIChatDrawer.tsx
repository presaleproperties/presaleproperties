import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Send, Loader2, MapPin, DollarSign, 
  ArrowRight, Mic, MicOff, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

// Typewriter hook
function useTypewriter(texts: string[], speed = 50, deleteSpeed = 30, pause = 2000) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setTyping(false); }, pause);
      return () => clearTimeout(t);
    }

    if (typing) {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), speed);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
      }
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), deleteSpeed);
        return () => clearTimeout(t);
      } else {
        setIdx((i) => (i + 1) % texts.length);
        setTyping(true);
      }
    }
  }, [text, typing, paused, idx, texts, speed, deleteSpeed, pause]);

  return text;
}

const EXAMPLES = [
  "2 bed in Surrey under $600k",
  "Townhouse with low deposit",
  "Condo near SkyTrain",
  "Completing in 2026",
];

interface AIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatDrawer({ open, onOpenChange }: AIChatDrawerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const typewriterText = useTypewriter(EXAMPLES, 60, 40, 1500);
  const showTypewriter = !focused && message.length === 0 && !isListening && conversation.length === 0;

  const isSpeechSupported = typeof window !== "undefined" && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setMessage(t);
      setIsListening(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    return r;
  }, [isSpeechSupported]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!recognitionRef.current) recognitionRef.current = initSpeech();
    recognitionRef.current?.start();
    setIsListening(true);
  };

  const handleSend = async (text?: string) => {
    const q = text || message;
    if (!q.trim() || q.length < 3) return;

    setIsLoading(true);
    setMessage("");
    setConversation(prev => [...prev, { role: "user", content: q }]);

    try {
      const { data, error } = await supabase.functions.invoke("ai-project-search", {
        body: { query: q, searchMode: "projects" },
      });

      if (error) throw error;

      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: data.explanation,
        projects: data.projects 
      }]);
    } catch {
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: "Something went wrong. Try again!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (p: number | null) => {
    if (!p) return "TBD";
    return p >= 1000000 ? `$${(p / 1000000).toFixed(1)}M` : `$${(p / 1000).toFixed(0)}K`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      
      {/* Chat Panel */}
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Find your presale</span>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] max-h-[45vh]">
          {conversation.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tell me what you're looking for
            </p>
          )}
          
          {conversation.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <p>{msg.content}</p>
                
                {/* Compact Project Cards */}
                {msg.projects && msg.projects.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.projects.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onOpenChange(false); navigate(`/presale-projects/${p.slug}`); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-background border border-border hover:border-primary transition-colors text-left"
                      >
                        {p.featured_image && (
                          <img src={p.featured_image} alt="" className="w-10 h-10 rounded-md object-cover" />
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
              <div className="bg-muted rounded-2xl px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              {showTypewriter && (
                <div className="absolute inset-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground/60">
                    {typewriterText}<span className="animate-pulse ml-0.5 inline-block w-0.5 h-4 bg-primary/50" />
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={focused ? "e.g. 2 bed condo in Surrey..." : ""}
                className={cn(
                  "w-full pl-3 pr-10 py-2.5 rounded-full border text-sm bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  isListening && "border-red-500"
                )}
                disabled={isLoading}
              />
              {isSpeechSupported && (
                <button
                  onClick={toggleVoice}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors",
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
              disabled={isLoading || message.length < 3}
              className="h-10 w-10 rounded-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
