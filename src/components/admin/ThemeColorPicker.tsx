import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pipette, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeColorPickerProps {
  label: string;
  description?: string;
  value: string; // HSL string like "43 96% 56%"
  onChange: (value: string) => void;
}

// Convert HSL string to hex for display
function hslToHex(hslString: string): string {
  const [h, s, l] = hslString.split(" ").map((v) => parseFloat(v));
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSL string
function hexToHsl(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeColorPicker({ label, description, value, onChange }: ThemeColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hexValue, setHexValue] = useState(() => {
    try {
      return hslToHex(value);
    } catch {
      return "#ffb600";
    }
  });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
    try {
      setHexValue(hslToHex(value));
    } catch {
      // Keep existing hex if conversion fails
    }
  }, [value]);

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const hsl = hexToHsl(hex);
      setLocalValue(hsl);
      onChange(hsl);
    }
  };

  const handleHslChange = (hsl: string) => {
    setLocalValue(hsl);
    onChange(hsl);
    try {
      setHexValue(hslToHex(hsl));
    } catch {
      // Keep existing hex if conversion fails
    }
  };

  const handleEyeDropper = async () => {
    if (!("EyeDropper" in window)) {
      alert("EyeDropper API is not supported in your browser. Try Chrome, Edge, or Opera.");
      return;
    }

    try {
      // @ts-ignore - EyeDropper API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      handleHexChange(result.sRGBHex);
    } catch (e) {
      // User cancelled
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-10 w-10 rounded-lg border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer flex-shrink-0"
              style={{ backgroundColor: `hsl(${localValue})` }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Color Preview</Label>
                <div
                  className="h-20 rounded-lg border"
                  style={{ backgroundColor: `hsl(${localValue})` }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Hex Color</Label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="color"
                    value={hexValue}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="h-9 w-12 p-1 cursor-pointer"
                  />
                  <Input
                    value={hexValue}
                    onChange={(e) => handleHexChange(e.target.value)}
                    placeholder="#ffb600"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">HSL Value</Label>
                <Input
                  value={localValue}
                  onChange={(e) => handleHslChange(e.target.value)}
                  placeholder="43 96% 56%"
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleEyeDropper}
                >
                  <Pipette className="h-4 w-4 mr-2" />
                  Pick Color
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Input
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-28 font-mono text-sm"
          placeholder="#ffb600"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleEyeDropper}
          className="flex-shrink-0"
          title="Pick color from screen"
        >
          <Pipette className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
