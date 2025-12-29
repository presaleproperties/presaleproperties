import { Type, Image, Square, Minus, MousePointer, Columns, List } from "lucide-react";

export type BlockType = "heading" | "text" | "image" | "button" | "divider" | "columns" | "list";

export interface BlockConfig {
  type: BlockType;
  label: string;
  icon: React.ElementType;
  defaultContent: Record<string, any>;
}

export const BLOCK_CONFIGS: BlockConfig[] = [
  {
    type: "heading",
    label: "Heading",
    icon: Type,
    defaultContent: { text: "Your Heading Here", level: "h1", align: "left" },
  },
  {
    type: "text",
    label: "Text Block",
    icon: Type,
    defaultContent: { text: "Enter your text content here. You can use {{lead_name}} and {{project_name}} as variables.", align: "left" },
  },
  {
    type: "image",
    label: "Image",
    icon: Image,
    defaultContent: { src: "", alt: "Image", width: "100%" },
  },
  {
    type: "button",
    label: "Button",
    icon: Square,
    defaultContent: { text: "Click Here", url: "#", align: "center", color: "#d4af37" },
  },
  {
    type: "divider",
    label: "Divider",
    icon: Minus,
    defaultContent: { style: "solid", color: "#e5e5e5" },
  },
  {
    type: "columns",
    label: "Two Columns",
    icon: Columns,
    defaultContent: { left: "Left column content", right: "Right column content" },
  },
  {
    type: "list",
    label: "Bullet List",
    icon: List,
    defaultContent: { items: ["Item 1", "Item 2", "Item 3"] },
  },
];

interface EmailBlockPaletteProps {
  onDragStart: (block: BlockConfig) => void;
}

export function EmailBlockPalette({ onDragStart }: EmailBlockPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Drag blocks to add</h3>
      <div className="grid grid-cols-2 gap-2">
        {BLOCK_CONFIGS.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("blockType", block.type);
              onDragStart(block);
            }}
            className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-grab hover:border-primary hover:bg-primary/5 transition-colors active:cursor-grabbing"
          >
            <block.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium">{block.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}