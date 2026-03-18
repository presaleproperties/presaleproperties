import { DollarSign, CheckCircle2, Car, Archive, Wind } from "lucide-react";

interface DeckKeyFactsBarProps {
  assignmentFee?: string | null;
  includedItems?: string[] | null;
}

const INCLUDED_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="h-3.5 w-3.5 shrink-0" />,
  storage: <Archive className="h-3.5 w-3.5 shrink-0" />,
  ac: <Wind className="h-3.5 w-3.5 shrink-0" />,
  "air conditioning": <Wind className="h-3.5 w-3.5 shrink-0" />,
};

function getIcon(item: string) {
  const key = item.toLowerCase();
  return INCLUDED_ICONS[key] || <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
}

export function DeckKeyFactsBar({ assignmentFee, includedItems }: DeckKeyFactsBarProps) {
  const hasAny = assignmentFee || (includedItems && includedItems.length > 0);
  if (!hasAny) return null;

  return (
    <div className="bg-muted/40 border-b border-border/50 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Assignment Fee */}
        {assignmentFee && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 shrink-0">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-muted-foreground font-medium">Assignment Fee:</span>
            <span className="text-foreground font-semibold">{assignmentFee}</span>
          </div>
        )}

        {/* Divider */}
        {assignmentFee && includedItems && includedItems.length > 0 && (
          <div className="hidden sm:block w-px h-4 bg-border/60" />
        )}

        {/* What's Included */}
        {includedItems && includedItems.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium">Included:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {includedItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                >
                  {getIcon(item)}
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
