import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, X, Send, Loader2, MapPin, Building2, DollarSign, 
  Calendar, ArrowRight, Mic, MicOff, ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  completion_month: number | null;
  status: string;
  featured_image: string | null;
  short_description: string | null;
  match_reasons: string[];
}

interface ParsedFilters {
  city?: string;
  neighborhood?: string;
  project_type?: string;
  max_price?: number;
  min_price?: number;
  max_deposit_percent?: number;
  completion_year?: number;
  near_skytrain?: boolean;
  beds?: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  projects?: Project[];
  timestamp: Date;
}

interface SearchResult {
  projects?: Project[];
  explanation: string;
  filters_applied: ParsedFilters;
}

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

const GREETING_MESSAGE: ConversationMessage = {
  role: "assistant",
  content: "Hey there! 👋 I'm your presale helper. Tell me what you're looking for — like \"2 bedroom in Surrey under $600k\" — and I'll find the perfect matches for you!",
  timestamp: new Date()
};

const QUICK_SUGGESTIONS = [
  "2 bed condo in Surrey",
  "Townhouse under $900k",
  "Low deposit projects",
  "Completing in 2026"
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
  const [conversation, setConversation] = useState<ConversationMessage[]>([GREETING_MESSAGE]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSpeechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (!isSpeechSupported) return null;
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (final) {
        setMessage(prev => prev + final);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };
    
    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");
      
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone access needed",
          description: "Please allow microphone access to use voice.",
          variant: "destructive",
        });
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };
    
    return recognition;
  }, [isSpeechSupported, toast]);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  }, [isListening, initSpeechRecognition]);

  const handleSend = async (customMessage?: string) => {
    const text = customMessage || message;
    if (!text.trim() || text.length < 3) return;

    setIsLoading(true);
    setMessage("");

    // Add user message
    const userMsg: ConversationMessage = { 
      role: "user", 
      content: text,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMsg]);

    // Track event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_chat_message", { query: text });
    }

    try {
      // Build conversation history
      const conversationHistory = conversation
        .filter(m => m.role === "user" || (m.role === "assistant" && !m.projects))
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error: fnError } = await supabase.functions.invoke("ai-project-search", {
        body: { 
          query: text,
          conversation: conversationHistory,
          searchMode: "projects"
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const result = data as SearchResult;

      // Add assistant response
      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: result.explanation,
        projects: result.projects,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: "Oops! Something went wrong. Could you try asking again? 🙏",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    onOpenChange(false);
    navigate(`/presale-projects/${project.slug}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "TBD";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isListening) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] focus:outline-none">
        {/* Header */}
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-base font-semibold">Presale Assistant</DrawerTitle>
                <p className="text-xs text-muted-foreground">Ask me anything about presales!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px] max-h-[50vh]">
          {conversation.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-md" 
                  : "bg-muted rounded-bl-md"
              )}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Project Cards */}
                {msg.projects && msg.projects.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.projects.slice(0, 5).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className="w-full text-left p-3 rounded-xl bg-background border border-border hover:border-primary hover:shadow-md transition-all group"
                      >
                        <div className="flex gap-3">
                          {project.featured_image && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                              <img 
                                src={project.featured_image} 
                                alt={project.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {project.name}
                              </h4>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {project.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatPrice(project.starting_price)}
                              </span>
                              {project.deposit_percent && (
                                <span>{project.deposit_percent}% dep</span>
                              )}
                              {project.completion_year && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {project.completion_year}
                                </span>
                              )}
                            </div>
                            {project.match_reasons && project.match_reasons.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {project.match_reasons.slice(0, 2).map((reason, ridx) => (
                                  <span 
                                    key={ridx} 
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  >
                                    ✓ {reason}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {msg.projects.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground pt-1">
                        +{msg.projects.length - 5} more matches. Ask me to narrow it down!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions (only show if no user messages yet) */}
        {conversation.length === 1 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={isListening ? message + interimTranscript : message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className={cn(
                  "w-full pl-4 pr-12 py-3 rounded-full border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm",
                  isListening && "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                )}
                disabled={isLoading}
              />
              
              {isSpeechSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full",
                    isListening && "text-red-500 animate-pulse"
                  )}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={isLoading || (message + interimTranscript).length < 3 || isListening}
              className="h-11 w-11 rounded-full flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {isListening && (
            <p className="text-xs text-red-500 mt-2 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening... tap mic to stop
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
