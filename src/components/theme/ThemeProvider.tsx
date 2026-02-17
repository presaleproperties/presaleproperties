import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeSettings {
  // Core colors
  primary: string;
  primaryGlow: string;
  primaryDeep: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  // Status colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  // Radius
  radius: string;
}

const defaultTheme: ThemeSettings = {
  primary: "43 96% 56%",
  primaryGlow: "40 90% 50%",
  primaryDeep: "38 95% 42%",
  background: "30 20% 99%",
  foreground: "220 20% 10%",
  card: "0 0% 100%",
  cardForeground: "220 20% 10%",
  muted: "30 10% 96%",
  mutedForeground: "220 8% 46%",
  border: "30 10% 90%",
  accent: "43 96% 56%",
  accentForeground: "0 0% 100%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 100%",
  success: "142 76% 36%",
  successForeground: "0 0% 100%",
  warning: "43 96% 56%",
  warningForeground: "0 0% 100%",
  info: "199 89% 48%",
  infoForeground: "0 0% 100%",
  fontFamily: "Plus Jakarta Sans",
  headingFontFamily: "Plus Jakarta Sans",
  radius: "0.75rem",
};

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => Promise<void>;
  resetTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS variables to document
  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Core colors
    root.style.setProperty("--primary", settings.primary);
    root.style.setProperty("--primary-glow", settings.primaryGlow);
    root.style.setProperty("--primary-deep", settings.primaryDeep);
    root.style.setProperty("--background", settings.background);
    root.style.setProperty("--foreground", settings.foreground);
    root.style.setProperty("--card", settings.card);
    root.style.setProperty("--card-foreground", settings.cardForeground);
    root.style.setProperty("--muted", settings.muted);
    root.style.setProperty("--muted-foreground", settings.mutedForeground);
    root.style.setProperty("--border", settings.border);
    root.style.setProperty("--input", settings.border);
    root.style.setProperty("--ring", settings.primary);
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--accent-foreground", settings.accentForeground);
    root.style.setProperty("--destructive", settings.destructive);
    root.style.setProperty("--destructive-foreground", settings.destructiveForeground);
    
    // Status colors
    root.style.setProperty("--success", settings.success);
    root.style.setProperty("--success-foreground", settings.successForeground);
    root.style.setProperty("--warning", settings.warning);
    root.style.setProperty("--warning-foreground", settings.warningForeground);
    root.style.setProperty("--info", settings.info);
    root.style.setProperty("--info-foreground", settings.infoForeground);
    
    // Secondary (derived from muted)
    root.style.setProperty("--secondary", settings.muted);
    root.style.setProperty("--secondary-foreground", settings.foreground);
    
    // Popover
    root.style.setProperty("--popover", settings.card);
    root.style.setProperty("--popover-foreground", settings.cardForeground);
    
    // Sidebar
    root.style.setProperty("--sidebar-background", settings.background);
    root.style.setProperty("--sidebar-foreground", settings.mutedForeground);
    root.style.setProperty("--sidebar-primary", settings.primary);
    root.style.setProperty("--sidebar-primary-foreground", settings.foreground);
    root.style.setProperty("--sidebar-accent", settings.muted);
    root.style.setProperty("--sidebar-accent-foreground", settings.foreground);
    root.style.setProperty("--sidebar-border", settings.border);
    root.style.setProperty("--sidebar-ring", settings.primary);
    
    // Radius
    root.style.setProperty("--radius", settings.radius);
    
    // Font family
    root.style.setProperty("--font-sans", `"${settings.fontFamily}", system-ui, sans-serif`);
  };

  // Load theme from database
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "theme_settings")
          .maybeSingle();

        if (error) throw error;

        if (data?.value) {
          const savedTheme = { ...defaultTheme, ...(data.value as object) };
          setTheme(savedTheme);
          applyTheme(savedTheme);
        } else {
          applyTheme(defaultTheme);
        }
      } catch (err) {
        console.error("Error loading theme:", err);
        applyTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const updateTheme = async (newTheme: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    applyTheme(updatedTheme);

    try {
      // Check if setting exists first
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "theme_settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("app_settings")
          .update({
            value: updatedTheme,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "theme_settings");
      } else {
        await supabase
          .from("app_settings")
          .insert([{
            key: "theme_settings",
            value: updatedTheme,
          }]);
      }
    } catch (err) {
      console.error("Error saving theme:", err);
    }
  };

  const resetTheme = async () => {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);

    try {
      await supabase
        .from("app_settings")
        .delete()
        .eq("key", "theme_settings");
    } catch (err) {
      console.error("Error resetting theme:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
