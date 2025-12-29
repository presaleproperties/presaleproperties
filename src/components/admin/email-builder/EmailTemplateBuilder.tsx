import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Eye, EyeOff, LayoutTemplate } from "lucide-react";
import { EmailBlockPalette, type BlockConfig } from "./EmailBlockPalette";
import { EmailBlock, type EmailBlockData } from "./EmailBlock";
import { EmailPreview, generateEmailHTML } from "./EmailPreview";
import { TemplateLibrary, type TemplatePreset } from "./TemplateLibrary";

interface EmailTemplateBuilderProps {
  initialTemplate?: {
    id: string;
    name: string;
    subject: string;
    html_content: string;
    template_type: string;
  };
  onSave?: () => void;
}

const DEFAULT_BLOCKS: EmailBlockData[] = [
  {
    id: crypto.randomUUID(),
    type: "heading",
    content: { text: "Welcome to {{project_name}}", level: "h1", align: "center" },
  },
  {
    id: crypto.randomUUID(),
    type: "text",
    content: { text: "Hi {{lead_name}},\n\nThank you for your interest in {{project_name}}. We're excited to share more details with you.", align: "left" },
  },
  {
    id: crypto.randomUUID(),
    type: "button",
    content: { text: "View Project Details", url: "https://presaleproperties.com", align: "center", color: "#d4af37" },
  },
];

export function EmailTemplateBuilder({ initialTemplate, onSave }: EmailTemplateBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialTemplate ? "build" : "templates");

  const [name, setName] = useState(initialTemplate?.name || "");
  const [subject, setSubject] = useState(initialTemplate?.subject || "");
  const [templateType, setTemplateType] = useState(initialTemplate?.template_type || "welcome");
  const [blocks, setBlocks] = useState<EmailBlockData[]>(() => {
    if (initialTemplate?.html_content) {
      return [
        {
          id: crypto.randomUUID(),
          type: "heading",
          content: { text: "Welcome to {{project_name}}", level: "h1", align: "center" },
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          content: { text: "Hi {{lead_name}},\n\nThank you for your interest!", align: "left" },
        },
      ];
    }
    return [];
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [draggedNewBlock, setDraggedNewBlock] = useState<BlockConfig | null>(null);

  const handleSelectTemplate = (template: TemplatePreset) => {
    setName(template.name);
    setSubject(template.subject);
    setTemplateType(template.category);
    setBlocks(template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })));
    setActiveTab("build");
    toast({ title: "Template loaded", description: `"${template.name}" is ready to customize.` });
  };

  const handleStartFromScratch = () => {
    setBlocks(DEFAULT_BLOCKS.map((b) => ({ ...b, id: crypto.randomUUID() })));
    setActiveTab("build");
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const htmlContent = generateEmailHTML(blocks);
      
      if (initialTemplate?.id) {
        const { error } = await supabase
          .from("email_templates")
          .update({
            name,
            subject,
            html_content: htmlContent,
            template_type: templateType,
          })
          .eq("id", initialTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert({
            name,
            subject,
            html_content: htmlContent,
            template_type: templateType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template saved!", description: "Your email template has been saved." });
      onSave?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle new block drop from palette
  const handleNewBlockDragStart = (block: BlockConfig) => {
    setDraggedNewBlock(block);
    setDraggedBlockId(null);
  };

  // Handle existing block drag start
  const handleBlockDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
    setDraggedNewBlock(null);
  };

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();

    if (draggedNewBlock) {
      // Adding new block from palette
      const newBlock: EmailBlockData = {
        id: crypto.randomUUID(),
        type: draggedNewBlock.type,
        content: { ...draggedNewBlock.defaultContent },
      };

      setBlocks((prev) => {
        if (targetIndex !== undefined) {
          const newBlocks = [...prev];
          newBlocks.splice(targetIndex, 0, newBlock);
          return newBlocks;
        }
        return [...prev, newBlock];
      });
      setDraggedNewBlock(null);
    } else if (draggedBlockId && targetIndex !== undefined) {
      // Reordering existing block
      setBlocks((prev) => {
        const draggedIndex = prev.findIndex((b) => b.id === draggedBlockId);
        if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

        const newBlocks = [...prev];
        const [removed] = newBlocks.splice(draggedIndex, 1);
        const insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
        newBlocks.splice(insertIndex, 0, removed);
        return newBlocks;
      });
      setDraggedBlockId(null);
    }
  }, [draggedNewBlock, draggedBlockId]);

  const handleBlockUpdate = (blockId: string, content: Record<string, any>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, content } : b))
    );
  };

  const handleBlockDelete = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="templates" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Template Library
        </TabsTrigger>
        <TabsTrigger value="build">Build Email</TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="mt-0">
        <div className="space-y-4">
          <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
          <div className="text-center pt-4 border-t">
            <Button variant="outline" onClick={handleStartFromScratch}>
              Or Start from Scratch
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="build" className="mt-0">
        <div className="grid lg:grid-cols-[280px_1fr_1fr] gap-6">
          {/* Palette */}
          <Card className="h-fit sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Components</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailBlockPalette onDragStart={handleNewBlockDragStart} />
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Email Content</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="lg:hidden"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template settings */}
              <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-1">
                  <Label>Template Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Welcome Email"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>Subject Line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Welcome to {{project_name}}!"
                  />
                </div>
              </div>

              {/* Blocks canvas */}
              <div
                className="min-h-[400px] space-y-3 p-4 border-2 border-dashed rounded-lg bg-muted/20"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleCanvasDrop(e)}
              >
                {blocks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-center py-16">
                    Drag blocks here to build your email
                  </div>
                ) : (
                  blocks.map((block, index) => (
                    <EmailBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onUpdate={(content) => handleBlockUpdate(block.id, content)}
                      onDelete={() => handleBlockDelete(block.id)}
                      onDragStart={() => handleBlockDragStart(block.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleCanvasDrop({ preventDefault: () => {} } as React.DragEvent, index)}
                    />
                  ))
                )}
              </div>

              {/* Save button */}
              <Button
                className="w-full"
                onClick={() => saveMutation.mutate()}
                disabled={!name || !subject || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Template
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className={`${showPreview ? "block" : "hidden"} lg:block`}>
            <EmailPreview blocks={blocks} subject={subject} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}