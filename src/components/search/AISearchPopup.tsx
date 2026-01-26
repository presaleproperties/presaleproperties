import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Search, Loader2, MapPin, Building2, DollarSign, Calendar, ArrowRight, RotateCcw, MessageSquare, Mic, MicOff, Check, Scale, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AICompareModal } from "./AICompareModal";

interface TypeaheadSuggestion {
  type: "project" | "city" | "neighborhood";
  label: string;
  sublabel?: string;
  slug?: string;
  city?: string;
}

interface AISearchPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  property_type: string;
  unit_type: string;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  assignment_price: number;
  completion_year: number | null;
  featured_image: string | null;
  match_reasons: string[];
}

interface ParsedFilters {
  city?: string;
  neighborhood?: string;
  project_type?: string;
  property_type?: string;
  unit_type?: string;
  max_price?: number;
  min_price?: number;
  max_deposit_percent?: number;
  completion_year?: number;
  near_skytrain?: boolean;
  beds?: number;
  min_sqft?: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  filters?: ParsedFilters;
  projects?: Project[];
  listings?: Listing[];
}

interface SearchResult {
  projects?: Project[];
  listings?: Listing[];
  explanation: string;
  filters_applied: ParsedFilters;
  clarification_needed?: string;
  conversation_context?: string;
  search_mode: "projects" | "resale";
}

type SearchMode = "projects" | "resale";

// Web Speech API types
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

const PROJECT_EXAMPLE_QUERIES = [
  "1 bedroom condo in Langley under $600k",
  "Townhouse for a family in Surrey",
  "Investment condo near SkyTrain with 10% deposit",
  "2 bed in Burnaby completing in 2026",
];

const ASSIGNMENT_EXAMPLE_QUERIES = [
  "2 bedroom condo in Surrey under $700k",
  "1 bed assignment in Langley",
  "Large condo over 800 sqft in Burnaby",
  "Townhouse assignment in Coquitlam",
];

const PROJECT_FOLLOWUP_SUGGESTIONS = [
  "Show me cheaper options",
  "Only near SkyTrain",
  "What about townhouses?",
  "In Surrey instead",
];

const ASSIGNMENT_FOLLOWUP_SUGGESTIONS = [
  "Show me cheaper options",
  "What about 2 bedrooms?",
  "Larger units please",
  "In Vancouver instead",
];

export function AISearchPopup({ open, onOpenChange }: AISearchPopupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("projects");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<TypeaheadSuggestion[]>([]);
  const [isLoadingTypeahead, setIsLoadingTypeahead] = useState(false);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const typeaheadDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check if speech recognition is supported
  const isSpeechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

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
        setQuery(prev => prev + final);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimTranscript("");
      
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice search.",
          variant: "destructive",
        });
      } else if (event.error !== "aborted") {
        toast({
          title: "Voice input error",
          description: "Could not understand. Please try again.",
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

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        
        // Track voice search usage
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "ai_voice_search_started");
        }
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  }, [isListening, initSpeechRecognition]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Don't reset conversation when reopening - allow users to continue
    } else {
      setQuery("");
      setError(null);
      // Stop listening when modal closes
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }
  }, [open, isListening]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [conversation]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeaheadDebounceRef.current) {
        clearTimeout(typeaheadDebounceRef.current);
      }
    };
  }, []);

  // Available cities for typeahead
  const availableCities = useMemo(() => [
    "Vancouver", "Burnaby", "Surrey", "South Surrey", "Langley", 
    "Coquitlam", "Richmond", "New Westminster", "Port Moody", 
    "Delta", "Abbotsford", "North Vancouver", "Whiterock"
  ], []);

  // Fetch typeahead suggestions
  const fetchTypeahead = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setTypeaheadSuggestions([]);
      setShowTypeahead(false);
      return;
    }

    setIsLoadingTypeahead(true);
    
    try {
      const suggestions: TypeaheadSuggestion[] = [];
      const lowerSearch = searchTerm.toLowerCase();

      // Match cities
      const matchedCities = availableCities.filter(city => 
        city.toLowerCase().includes(lowerSearch) ||
        city.toLowerCase().startsWith(lowerSearch)
      );
      
      matchedCities.slice(0, 3).forEach(city => {
        suggestions.push({
          type: "city",
          label: city,
          sublabel: "City",
          city
        });
      });

      // Fetch matching projects from database
      const { data: projects, error } = await supabase
        .from("presale_projects")
        .select("name, slug, city, neighborhood")
        .eq("is_published", true)
        .or(`name.ilike.%${searchTerm}%,neighborhood.ilike.%${searchTerm}%`)
        .limit(5);

      if (!error && projects) {
        // Add project suggestions
        projects.forEach(project => {
          suggestions.push({
            type: "project",
            label: project.name,
            sublabel: `${project.neighborhood}, ${project.city}`,
            slug: project.slug,
            city: project.city
          });
        });

        // Extract unique neighborhoods
        const neighborhoods = [...new Set(projects.map(p => p.neighborhood))];
        neighborhoods.slice(0, 2).forEach(neighborhood => {
          if (neighborhood.toLowerCase().includes(lowerSearch)) {
            const project = projects.find(p => p.neighborhood === neighborhood);
            if (project && !suggestions.some(s => s.type === "neighborhood" && s.label === neighborhood)) {
              suggestions.push({
                type: "neighborhood",
                label: neighborhood,
                sublabel: `Neighborhood in ${project.city}`,
                city: project.city
              });
            }
          }
        });
      }

      setTypeaheadSuggestions(suggestions.slice(0, 6));
      setShowTypeahead(suggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (err) {
      console.error("Typeahead error:", err);
    } finally {
      setIsLoadingTypeahead(false);
    }
  }, [availableCities]);

  // Debounced typeahead
  useEffect(() => {
    if (typeaheadDebounceRef.current) {
      clearTimeout(typeaheadDebounceRef.current);
    }

    if (query.length >= 2 && conversation.length === 0) {
      typeaheadDebounceRef.current = setTimeout(() => {
        fetchTypeahead(query);
      }, 150);
    } else {
      setTypeaheadSuggestions([]);
      setShowTypeahead(false);
    }
  }, [query, conversation.length, fetchTypeahead]);

  // Handle typeahead suggestion click
  const handleSuggestionClick = (suggestion: TypeaheadSuggestion) => {
    setShowTypeahead(false);
    
    if (suggestion.type === "project" && suggestion.slug) {
      // Navigate directly to project
      onOpenChange(false);
      navigate(`/presale-projects/${suggestion.slug}`);
    } else if (suggestion.type === "city") {
      // Search for projects in this city
      handleSearch(`projects in ${suggestion.label}`);
    } else if (suggestion.type === "neighborhood") {
      // Search for projects in this neighborhood
      handleSearch(`projects in ${suggestion.label}`);
    }
  };

  // Handle keyboard navigation in typeahead
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showTypeahead || typeaheadSuggestions.length === 0) {
      if (e.key === "Enter" && !isListening) {
        handleSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < typeaheadSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionClick(typeaheadSuggestions[selectedSuggestionIndex]);
      } else if (!isListening) {
        setShowTypeahead(false);
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setShowTypeahead(false);
    }
  };


  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || q.length < 3) return;

    setIsLoading(true);
    setError(null);
    setQuery("");

    // Add user message to conversation
    const userMessage: ConversationMessage = { role: "user", content: q };
    setConversation(prev => [...prev, userMessage]);

    // Track AI search used
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_search_used", { 
        query: q,
        is_followup: conversation.length > 0
      });
    }

    try {
      // Build conversation history for context
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content,
        filters: msg.filters
      }));

      const { data, error: fnError } = await supabase.functions.invoke("ai-project-search", {
        body: { 
          query: q,
          conversation: conversationHistory,
          searchMode
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Search failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const result = data as SearchResult;

      // Add assistant response to conversation
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: result.explanation,
        filters: result.filters_applied,
        projects: result.projects,
        listings: result.listings
      };
      setConversation(prev => [...prev, assistantMessage]);

      // Track results
      const resultCount = searchMode === "projects" 
        ? (result.projects?.length || 0)
        : (result.listings?.length || 0);
      
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "ai_filters_extracted", {
          filters: JSON.stringify(result.filters_applied),
          search_mode: searchMode
        });
        (window as any).gtag("event", resultCount > 0 ? "ai_results_count" : "ai_no_results", {
          count: resultCount,
          search_mode: searchMode
        });
      }
    } catch (err: any) {
      console.error("AI search error:", err);
      setError(err.message || "Search failed. Please try again.");
      // Remove the user message if there was an error
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_project_click", {
        project_id: project.id,
        project_name: project.name,
      });
    }
    onOpenChange(false);
    navigate(`/presale-projects/${project.slug}`);
  };

  const handleListingClick = (listing: Listing) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ai_listing_click", {
        listing_id: listing.id,
        listing_title: listing.title,
      });
    }
    onOpenChange(false);
    navigate(`/properties/${listing.id}`);
  };

  const handleModeChange = (mode: SearchMode) => {
    if (mode !== searchMode) {
      setSearchMode(mode);
      setConversation([]);
      setError(null);
      setQuery("");
      setSelectedProjects([]);
      setSelectedListings([]);
    }
  };

  const handleNewSearch = () => {
    setConversation([]);
    setError(null);
    setQuery("");
    setSelectedProjects([]);
    setSelectedListings([]);
    inputRef.current?.focus();
  };

  const toggleProjectSelection = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjects(prev => {
      const isSelected = prev.some(p => p.id === project.id);
      if (isSelected) {
        return prev.filter(p => p.id !== project.id);
      }
      if (prev.length >= 4) {
        toast({ title: "Maximum 4 items", description: "Remove one to add another", variant: "destructive" });
        return prev;
      }
      return [...prev, project];
    });
  };

  const toggleListingSelection = (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedListings(prev => {
      const isSelected = prev.some(l => l.id === listing.id);
      if (isSelected) {
        return prev.filter(l => l.id !== listing.id);
      }
      if (prev.length >= 4) {
        toast({ title: "Maximum 4 items", description: "Remove one to add another", variant: "destructive" });
        return prev;
      }
      return [...prev, listing];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    if (searchMode === "projects") {
      setSelectedProjects(prev => prev.filter(p => p.id !== id));
    } else {
      setSelectedListings(prev => prev.filter(l => l.id !== id));
    }
    if ((searchMode === "projects" ? selectedProjects.length : selectedListings.length) <= 2) {
      setShowCompare(false);
    }
  };

  const handleCompareViewProject = (slug: string) => {
    setShowCompare(false);
    onOpenChange(false);
    navigate(`/presale-projects/${slug}`);
  };

  const handleCompareViewListing = (id: string) => {
    setShowCompare(false);
    onOpenChange(false);
    navigate(`/properties/${id}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Pricing TBD";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const formatCompletion = (year: number | null, month: number | null) => {
    if (!year) return "TBD";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month && month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return String(year);
  };

  const lastAssistantMessage = [...conversation].reverse().find(m => m.role === "assistant");
  const hasResults = searchMode === "projects" 
    ? (lastAssistantMessage?.projects && lastAssistantMessage.projects.length > 0)
    : (lastAssistantMessage?.listings && lastAssistantMessage.listings.length > 0);

  const exampleQueries = searchMode === "projects" ? PROJECT_EXAMPLE_QUERIES : ASSIGNMENT_EXAMPLE_QUERIES;
  const followupSuggestions = searchMode === "projects" ? PROJECT_FOLLOWUP_SUGGESTIONS : ASSIGNMENT_FOLLOWUP_SUGGESTIONS;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />

      {/* Mobile-Optimized Search Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative z-10 w-full mx-3 sm:mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col",
          "bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10",
          conversation.length === 0 ? "max-w-md" : "max-w-2xl max-h-[80vh] sm:max-h-[70vh]"
        )}
      >
        {conversation.length === 0 && !isLoading ? (
          <div className="p-4 sm:p-5">
            {/* Close button for mobile */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors sm:hidden"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {/* Friendly Welcome Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Hi! I'm your AI helper 👋
              </h3>
              <p className="text-sm text-muted-foreground">
                Just tell me what you're looking for — like talking to a friend!
              </p>
            </div>
            
            {/* Simple Instructions */}
            <div className="bg-muted/40 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">How it works:</span>{" "}
                Type what you want (like "2 bedroom in Surrey") and I'll find matching homes for you.
              </p>
            </div>
            
            {/* Mobile-Optimized Search Input with Typeahead */}
            <div className="relative">
              <div className={cn(
                "relative flex items-center rounded-xl transition-all",
                "bg-muted/60 border border-border/50",
                "focus-within:border-primary/50 focus-within:bg-muted/80",
                isListening && "border-red-500/50 bg-red-50/30 dark:bg-red-950/20",
                showTypeahead && "rounded-b-none border-b-0"
              )}>
                <Search className="absolute left-3.5 h-5 w-5 text-muted-foreground/60" />
                <input
                  ref={inputRef}
                  type="text"
                  value={isListening ? query + interimTranscript : query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => query.length >= 2 && typeaheadSuggestions.length > 0 && setShowTypeahead(true)}
                  onBlur={() => setTimeout(() => setShowTypeahead(false), 200)}
                  placeholder="What are you looking for?"
                  className="w-full pl-11 pr-24 py-3.5 sm:py-3 rounded-xl bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  disabled={isLoading}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                
                <div className="absolute right-1.5 flex items-center gap-1">
                  {isLoadingTypeahead && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  {isSpeechSupported && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={toggleVoiceInput}
                      disabled={isLoading}
                      className={cn(
                        "h-10 w-10 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-foreground touch-manipulation",
                        isListening && "text-red-500 animate-pulse"
                      )}
                    >
                      {isListening ? <MicOff className="h-5 w-5 sm:h-4 sm:w-4" /> : <Mic className="h-5 w-5 sm:h-4 sm:w-4" />}
                    </Button>
                  )}
                  
                  <Button
                    size="icon"
                    onClick={() => { setShowTypeahead(false); handleSearch(); }}
                    disabled={isLoading || (query + interimTranscript).length < 3 || isListening}
                    className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
                  >
                    <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {/* Typeahead Suggestions Dropdown */}
              {showTypeahead && typeaheadSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 bg-background/98 backdrop-blur-lg border border-t-0 border-border/50 rounded-b-xl shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {typeaheadSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.label}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "w-full px-4 py-3.5 sm:py-2.5 flex items-center gap-3 text-left transition-colors touch-manipulation active:bg-muted",
                        "hover:bg-muted/70 border-b border-border/30 last:border-b-0",
                        selectedSuggestionIndex === index && "bg-muted"
                      )}
                    >
                      {suggestion.type === "project" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {suggestion.type === "city" && (
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                      {suggestion.type === "neighborhood" && (
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Home className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {suggestion.label}
                        </p>
                        {suggestion.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">
                            {suggestion.sublabel}
                          </p>
                        )}
                      </div>
                      {suggestion.type === "project" && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isListening && (
              <p className="text-sm text-red-500 mt-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Listening...
              </p>
            )}

            {/* Quick Search Chips - Scrollable on mobile */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground text-center mb-2.5">
                Or tap one of these to get started:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["2 bedroom in Langley", "Under $600k", "Townhouse", "Surrey condos"].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSearch(example)}
                    className="px-3.5 py-2.5 text-sm rounded-full bg-primary/10 hover:bg-primary/20 active:bg-primary/25 text-primary font-medium transition-colors touch-manipulation"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Expanded State: With Results */
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground flex-1">AI Search</span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSearch}
                className="h-7 px-2 text-xs gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                New
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Conversation Area */}
            <div ref={resultsRef} className="flex-1 overflow-y-auto">
              {/* Conversation Messages */}
              {conversation.map((message, idx) => (
                <div key={idx} className={cn(
                  "px-4 py-3",
                  message.role === "user" ? "bg-muted/30" : "bg-background"
                )}>
                  {message.role === "user" ? (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-foreground/10 flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-foreground" />
                      </div>
                      <p className="text-sm text-foreground pt-0.5">{message.content}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Explanation */}
                      <div className={cn(
                        "p-3 rounded-lg",
                        (message.projects && message.projects.length > 0) || (message.listings && message.listings.length > 0)
                          ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}>
                        <p className="text-sm">{message.content}</p>
                      </div>

                      {/* Listing Cards (Assignments mode) */}
                      {message.listings && message.listings.length > 0 && (
                        <div className="space-y-2">
                          {message.listings.slice(0, 6).map((listing) => {
                            const isSelected = selectedListings.some(l => l.id === listing.id);
                            return (
                              <div
                                key={listing.id}
                                className={cn(
                                  "relative w-full text-left p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group",
                                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                                )}
                              >
                                <button
                                  onClick={(e) => toggleListingSelection(listing, e)}
                                  className={cn(
                                    "absolute top-2 right-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                    isSelected 
                                      ? "bg-primary border-primary text-primary-foreground" 
                                      : "border-muted-foreground/50 hover:border-primary"
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </button>
                                
                                <button
                                  onClick={() => handleListingClick(listing)}
                                  className="w-full text-left"
                                >
                                  <div className="flex gap-3 pr-6">
                                    {listing.featured_image && (
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                        <img src={listing.featured_image} alt={listing.title} className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                          {listing.title}
                                        </h3>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.city}</span>
                                        <span>{listing.beds} bed • {listing.baths} bath</span>
                                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatPrice(listing.assignment_price)}</span>
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap gap-1">
                                        {listing.match_reasons.slice(0, 2).map((reason, ridx) => (
                                          <span key={ridx} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{reason}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                          {message.listings.length > 6 && (
                            <p className="text-xs text-muted-foreground text-center py-2">+{message.listings.length - 6} more. Refine your search.</p>
                          )}
                        </div>
                      )}

                      {/* Project Cards */}
                      {message.projects && message.projects.length > 0 && (
                        <div className="space-y-2">
                          {message.projects.slice(0, 6).map((project) => {
                            const isSelected = selectedProjects.some(p => p.id === project.id);
                            return (
                              <div
                                key={project.id}
                                className={cn(
                                  "relative w-full text-left p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group",
                                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                                )}
                              >
                                <button
                                  onClick={(e) => toggleProjectSelection(project, e)}
                                  className={cn(
                                    "absolute top-2 right-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                    isSelected 
                                      ? "bg-primary border-primary text-primary-foreground" 
                                      : "border-muted-foreground/50 hover:border-primary"
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </button>
                                
                                <button
                                  onClick={() => handleProjectClick(project)}
                                  className="w-full text-left"
                                >
                                  <div className="flex gap-3 pr-6">
                                    {project.featured_image && (
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                        <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                          {project.name}
                                        </h3>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.city}</span>
                                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.project_type === "townhouse" ? "Townhouse" : "Condo"}</span>
                                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatPrice(project.starting_price)}</span>
                                        {project.deposit_percent && <span>{project.deposit_percent}% dep</span>}
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap gap-1">
                                        {project.match_reasons.slice(0, 2).map((reason, ridx) => (
                                          <span key={ridx} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{reason}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                          {message.projects.length > 6 && (
                            <p className="text-xs text-muted-foreground text-center py-2">+{message.projects.length - 6} more. Refine your search.</p>
                          )}
                        </div>
                      )}

                      {/* No results suggestions */}
                      {((message.projects && message.projects.length === 0) || (message.listings && message.listings.length === 0)) && (
                        <div className="text-center py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false);
                              navigate(searchMode === "projects" ? "/presale-projects" : "/resale");
                            }}
                          >
                            Browse All {searchMode === "projects" ? "Projects" : "Resale"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="px-4 py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(query || conversation[conversation.length - 1]?.content)}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>

            {/* Follow-up Suggestions */}
            {hasResults && !isLoading && (
              <div className="px-3 py-2 border-t border-border bg-muted/30 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {followupSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-background flex-shrink-0">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={isListening ? query + interimTranscript : query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isListening && handleSearch()}
                  placeholder="Refine: show me cheaper, larger units..."
                  className={cn(
                    "w-full pl-4 pr-20 py-2.5 rounded-xl border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm",
                    isListening ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : "border-border"
                  )}
                  disabled={isLoading}
                />
                
                {isSpeechSupported && (
                  <Button
                    type="button"
                    size="icon"
                    variant={isListening ? "destructive" : "ghost"}
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                    className={cn(
                      "absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg",
                      isListening && "animate-pulse"
                    )}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </Button>
                )}
                
                <Button
                  size="icon"
                  onClick={() => handleSearch()}
                  disabled={isLoading || (query + interimTranscript).length < 3 || isListening}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Floating Compare Button */}
            {((searchMode === "projects" && selectedProjects.length >= 2) || 
              (searchMode === "resale" && selectedListings.length >= 2)) && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
                <Button
                  onClick={() => setShowCompare(true)}
                  className="shadow-lg gap-2 rounded-full px-4 h-9"
                  size="sm"
                >
                  <Scale className="h-3.5 w-3.5" />
                  Compare ({searchMode === "projects" ? selectedProjects.length : selectedListings.length})
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compare Modal */}
      <AICompareModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        projects={selectedProjects}
        listings={selectedListings}
        mode={searchMode}
        onViewProject={handleCompareViewProject}
        onViewListing={handleCompareViewListing}
        onRemove={handleRemoveFromCompare}
      />
    </div>
  );
}
