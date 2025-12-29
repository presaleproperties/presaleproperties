import { useState, useRef } from "react";
import { GripVertical, Trash2, Settings, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { BlockType } from "./EmailBlockPalette";

export interface EmailBlockData {
  id: string;
  type: BlockType;
  content: Record<string, any>;
}

interface EmailBlockProps {
  block: EmailBlockData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: Record<string, any>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

export function EmailBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: EmailBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `email-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("email-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("email-assets")
        .getPublicUrl(filePath);

      onUpdate({ ...block.content, src: urlData.publicUrl });
      toast({ title: "Image uploaded", description: "Your image has been uploaded successfully." });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "heading":
        const HeadingTag = block.content.level as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            style={{ textAlign: block.content.align }}
            className="font-bold"
          >
            {block.content.text}
          </HeadingTag>
        );
      case "text":
        return (
          <p style={{ textAlign: block.content.align }} className="whitespace-pre-wrap">
            {block.content.text}
          </p>
        );
      case "image":
        return block.content.src ? (
          <img
            src={block.content.src}
            alt={block.content.alt}
            style={{ width: block.content.width }}
            className="max-w-full mx-auto"
          />
        ) : (
          <div className="bg-muted h-32 flex items-center justify-center rounded text-muted-foreground">
            Click settings to add image URL
          </div>
        );
      case "button":
        return (
          <div style={{ textAlign: block.content.align }}>
            <a
              href={block.content.url}
              style={{ backgroundColor: block.content.color }}
              className="inline-block px-6 py-3 text-white rounded font-medium no-underline"
            >
              {block.content.text}
            </a>
          </div>
        );
      case "divider":
        return (
          <hr
            style={{
              borderStyle: block.content.style,
              borderColor: block.content.color,
            }}
            className="my-4"
          />
        );
      case "columns":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 bg-muted/30 rounded">{block.content.left}</div>
            <div className="p-2 bg-muted/30 rounded">{block.content.right}</div>
          </div>
        );
      case "list":
        return (
          <ul className="list-disc list-inside space-y-1">
            {block.content.items?.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  const renderSettings = () => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Text</Label>
              <Input
                value={block.content.text}
                onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <Select
                value={block.content.level}
                onValueChange={(v) => onUpdate({ ...block.content, level: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">Heading 1</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Alignment</Label>
              <Select
                value={block.content.align}
                onValueChange={(v) => onUpdate({ ...block.content, align: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "text":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea
                value={block.content.text}
                onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{lead_name}}"}, {"{{project_name}}"}, {"{{project_city}}"}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Alignment</Label>
              <Select
                value={block.content.align}
                onValueChange={(v) => onUpdate({ ...block.content, align: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "image":
        return (
          <div className="space-y-3">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-2 mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {block.content.src ? (
                  <div className="space-y-2">
                    <img
                      src={block.content.src}
                      alt={block.content.alt || "Uploaded image"}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Replace Image
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Click to upload image"}
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="url" className="space-y-2 mt-2">
                <div className="space-y-1">
                  <Label>Image URL</Label>
                  <Input
                    value={block.content.src || ""}
                    onChange={(e) => onUpdate({ ...block.content, src: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="space-y-1">
              <Label>Alt Text</Label>
              <Input
                value={block.content.alt || ""}
                onChange={(e) => onUpdate({ ...block.content, alt: e.target.value })}
                placeholder="Describe the image"
              />
            </div>
            <div className="space-y-1">
              <Label>Width</Label>
              <Select
                value={block.content.width || "100%"}
                onValueChange={(v) => onUpdate({ ...block.content, width: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100%">Full Width</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "button":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Button Text</Label>
              <Input
                value={block.content.text}
                onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Link URL</Label>
              <Input
                value={block.content.url}
                onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input
                type="color"
                value={block.content.color}
                onChange={(e) => onUpdate({ ...block.content, color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
            <div className="space-y-1">
              <Label>Alignment</Label>
              <Select
                value={block.content.align}
                onValueChange={(v) => onUpdate({ ...block.content, align: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "columns":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Left Column</Label>
              <Textarea
                value={block.content.left}
                onChange={(e) => onUpdate({ ...block.content, left: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Right Column</Label>
              <Textarea
                value={block.content.right}
                onChange={(e) => onUpdate({ ...block.content, right: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );
      case "list":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Items (one per line)</Label>
              <Textarea
                value={block.content.items?.join("\n") || ""}
                onChange={(e) =>
                  onUpdate({ ...block.content, items: e.target.value.split("\n") })
                }
                rows={5}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`group relative p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/50"
      }`}
    >
      {/* Drag handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Actions */}
      <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <h4 className="font-medium mb-3">Block Settings</h4>
            {renderSettings()}
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="pl-4">{renderBlockContent()}</div>
    </div>
  );
}