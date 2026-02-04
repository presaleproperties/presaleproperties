import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useTheme, ThemeSettings } from "@/components/theme/ThemeProvider";
import { ThemeColorPicker } from "@/components/admin/ThemeColorPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Type, 
  RotateCcw, 
  Save, 
  Eye, 
  Sparkles,
  Sun,
  AlertCircle,
  CheckCircle,
  Info,
  CircleDot
} from "lucide-react";
import { toast } from "sonner";

const FONT_OPTIONS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Modern" },
  { value: "Inter", label: "Inter", category: "Modern" },
  { value: "DM Sans", label: "DM Sans", category: "Modern" },
  { value: "Outfit", label: "Outfit", category: "Modern" },
  { value: "Manrope", label: "Manrope", category: "Modern" },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Modern" },
  { value: "Poppins", label: "Poppins", category: "Friendly" },
  { value: "Nunito", label: "Nunito", category: "Friendly" },
  { value: "Lato", label: "Lato", category: "Classic" },
  { value: "Open Sans", label: "Open Sans", category: "Classic" },
  { value: "Roboto", label: "Roboto", category: "Classic" },
  { value: "Source Sans 3", label: "Source Sans 3", category: "Classic" },
  { value: "Playfair Display", label: "Playfair Display", category: "Elegant" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", category: "Elegant" },
  { value: "Libre Baskerville", label: "Libre Baskerville", category: "Elegant" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "None (Sharp)" },
  { value: "0.25rem", label: "Extra Small" },
  { value: "0.5rem", label: "Small" },
  { value: "0.75rem", label: "Medium (Default)" },
  { value: "1rem", label: "Large" },
  { value: "1.5rem", label: "Extra Large" },
  { value: "9999px", label: "Full (Pill)" },
];

export default function AdminThemeManager() {
  const { theme, updateTheme, resetTheme, isLoading } = useTheme();
  const [localTheme, setLocalTheme] = useState<ThemeSettings>(theme);
  const [hasChanges, setHasChanges] = useState(false);

  const handleColorChange = (key: keyof ThemeSettings, value: string) => {
    setLocalTheme((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateTheme(localTheme);
    setHasChanges(false);
    toast.success("Theme saved successfully!");
  };

  const handleReset = async () => {
    await resetTheme();
    setLocalTheme(theme);
    setHasChanges(false);
    toast.success("Theme reset to defaults");
  };

  const handlePreview = () => {
    // Apply theme temporarily for preview
    const root = document.documentElement;
    Object.entries(localTheme).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      if (typeof value === "string" && !["fontFamily", "headingFontFamily"].includes(key)) {
        root.style.setProperty(`--${cssVar}`, value);
      }
    });
    toast.info("Preview applied - save to keep changes");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Theme Manager
            </h1>
            <p className="text-muted-foreground">
              Customize colors, fonts, and styling across the entire website
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Unsaved changes
              </Badge>
            )}
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Theme
            </Button>
          </div>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Brand Colors
                </CardTitle>
                <CardDescription>
                  Primary brand colors used throughout the site for buttons, links, and accents
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <ThemeColorPicker
                  label="Primary"
                  description="Main brand color"
                  value={localTheme.primary}
                  onChange={(v) => handleColorChange("primary", v)}
                />
                <ThemeColorPicker
                  label="Primary Glow"
                  description="Lighter brand variant"
                  value={localTheme.primaryGlow}
                  onChange={(v) => handleColorChange("primaryGlow", v)}
                />
                <ThemeColorPicker
                  label="Primary Deep"
                  description="Darker brand variant"
                  value={localTheme.primaryDeep}
                  onChange={(v) => handleColorChange("primaryDeep", v)}
                />
                <ThemeColorPicker
                  label="Accent"
                  description="Secondary accent color"
                  value={localTheme.accent}
                  onChange={(v) => handleColorChange("accent", v)}
                />
                <ThemeColorPicker
                  label="Accent Foreground"
                  description="Text on accent backgrounds"
                  value={localTheme.accentForeground}
                  onChange={(v) => handleColorChange("accentForeground", v)}
                />
              </CardContent>
            </Card>

            {/* Base Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Base Colors
                </CardTitle>
                <CardDescription>
                  Background, text, and surface colors that form the foundation of the design
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <ThemeColorPicker
                  label="Background"
                  description="Page background"
                  value={localTheme.background}
                  onChange={(v) => handleColorChange("background", v)}
                />
                <ThemeColorPicker
                  label="Foreground"
                  description="Main text color"
                  value={localTheme.foreground}
                  onChange={(v) => handleColorChange("foreground", v)}
                />
                <ThemeColorPicker
                  label="Card"
                  description="Card backgrounds"
                  value={localTheme.card}
                  onChange={(v) => handleColorChange("card", v)}
                />
                <ThemeColorPicker
                  label="Card Foreground"
                  description="Card text color"
                  value={localTheme.cardForeground}
                  onChange={(v) => handleColorChange("cardForeground", v)}
                />
                <ThemeColorPicker
                  label="Muted"
                  description="Subtle backgrounds"
                  value={localTheme.muted}
                  onChange={(v) => handleColorChange("muted", v)}
                />
                <ThemeColorPicker
                  label="Muted Foreground"
                  description="Secondary text"
                  value={localTheme.mutedForeground}
                  onChange={(v) => handleColorChange("mutedForeground", v)}
                />
                <ThemeColorPicker
                  label="Border"
                  description="Borders & dividers"
                  value={localTheme.border}
                  onChange={(v) => handleColorChange("border", v)}
                />
              </CardContent>
            </Card>

            {/* Status Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Status Colors
                </CardTitle>
                <CardDescription>
                  Colors for success, warning, error, and informational states
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <ThemeColorPicker
                  label="Success"
                  description="Success states"
                  value={localTheme.success}
                  onChange={(v) => handleColorChange("success", v)}
                />
                <ThemeColorPicker
                  label="Warning"
                  description="Warning states"
                  value={localTheme.warning}
                  onChange={(v) => handleColorChange("warning", v)}
                />
                <ThemeColorPicker
                  label="Destructive"
                  description="Error & delete"
                  value={localTheme.destructive}
                  onChange={(v) => handleColorChange("destructive", v)}
                />
                <ThemeColorPicker
                  label="Info"
                  description="Informational"
                  value={localTheme.info}
                  onChange={(v) => handleColorChange("info", v)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Font Settings
                </CardTitle>
                <CardDescription>
                  Choose fonts for body text and headings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Body Font</Label>
                    <Select
                      value={localTheme.fontFamily}
                      onValueChange={(v) => {
                        setLocalTheme((prev) => ({ ...prev, fontFamily: v }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({font.category})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for paragraphs and general text
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Heading Font</Label>
                    <Select
                      value={localTheme.headingFontFamily}
                      onValueChange={(v) => {
                        setLocalTheme((prev) => ({ ...prev, headingFontFamily: v }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({font.category})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for titles and section headings
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Select
                    value={localTheme.radius}
                    onValueChange={(v) => {
                      setLocalTheme((prev) => ({ ...prev, radius: v }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 bg-primary"
                              style={{ borderRadius: option.value }}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls the roundness of buttons, cards, and inputs
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Font Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Font Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div style={{ fontFamily: localTheme.headingFontFamily }}>
                  <h1 className="text-4xl font-bold mb-2">Heading Font Preview</h1>
                  <h2 className="text-2xl font-semibold mb-2">Subheading Example</h2>
                  <h3 className="text-xl font-medium">Section Title</h3>
                </div>
                <Separator />
                <div style={{ fontFamily: localTheme.fontFamily }}>
                  <p className="text-base mb-2">
                    Body text preview: The quick brown fox jumps over the lazy dog. 
                    This sentence contains every letter of the alphabet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Secondary text example with smaller size and muted color.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Component Preview</CardTitle>
                <CardDescription>
                  See how your theme looks on common UI components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buttons */}
                <div className="space-y-2">
                  <Label>Buttons</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                <Separator />

                {/* Badges */}
                <div className="space-y-2">
                  <Label>Badges</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="success">Success</Badge>
                  </div>
                </div>

                <Separator />

                {/* Status Icons */}
                <div className="space-y-2">
                  <Label>Status Indicators</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span>Success</span>
                    </div>
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="h-5 w-5" />
                      <span>Warning</span>
                    </div>
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span>Error</span>
                    </div>
                    <div className="flex items-center gap-2 text-info">
                      <Info className="h-5 w-5" />
                      <span>Info</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Elements */}
                <div className="space-y-2">
                  <Label>Form Elements</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Text input example..." />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                        <SelectItem value="2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Card Example */}
                <div className="space-y-2">
                  <Label>Card Example</Label>
                  <Card className="max-w-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5 text-primary" />
                        Sample Card
                      </CardTitle>
                      <CardDescription>
                        This is how cards appear with your theme
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Card content with muted text styling for secondary information.
                      </p>
                      <Button className="mt-4" size="sm">
                        Card Action
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
