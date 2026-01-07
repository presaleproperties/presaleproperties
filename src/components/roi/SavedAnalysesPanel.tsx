import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Trash2, 
  GitCompare, 
  Home, 
  X,
  Plus,
} from "lucide-react";
import { SavedAnalysis } from "@/hooks/useSavedAnalyses";
import { ROIInputs, ROIResults } from "@/types/roi";
import { toast } from "sonner";

interface SavedAnalysesPanelProps {
  savedAnalyses: SavedAnalysis[];
  canSave: boolean;
  canCompare: boolean;
  maxSaved: number;
  currentInputs: ROIInputs;
  currentResults: ROIResults;
  onSave: (inputs: ROIInputs, results: ROIResults) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  onCompare: () => void;
}

export function SavedAnalysesPanel({
  savedAnalyses,
  canSave,
  canCompare,
  maxSaved,
  currentInputs,
  currentResults,
  onSave,
  onDelete,
  onCompare,
}: SavedAnalysesPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSave = () => {
    const result = onSave(currentInputs, currentResults);
    if (result.success) {
      toast.success("Analysis saved for comparison!");
    } else {
      toast.error(result.error || "Failed to save analysis");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Compare Properties
          </CardTitle>
          <Badge variant="secondary">
            {savedAnalyses.length}/{maxSaved}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Current Button */}
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full"
          variant={canSave ? "default" : "secondary"}
        >
          {canSave ? (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Save Current Analysis
            </>
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              Max {maxSaved} Saved (Delete One)
            </>
          )}
        </Button>

        {/* Saved Analyses List */}
        {savedAnalyses.length > 0 && (
          <div className="space-y-2">
            {savedAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Home className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" title={analysis.name}>
                      {analysis.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(analysis.results.totalReturnDollars)} return
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onDelete(analysis.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Compare Button */}
        {savedAnalyses.length >= 2 && (
          <Button
            onClick={onCompare}
            variant="outline"
            className="w-full"
          >
            <GitCompare className="h-4 w-4 mr-2" />
            Compare {savedAnalyses.length} Properties
          </Button>
        )}

        {/* Helper Text */}
        {savedAnalyses.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Save analyses to compare different properties side by side.
          </p>
        )}
        {savedAnalyses.length === 1 && (
          <p className="text-xs text-muted-foreground text-center">
            Save one more analysis to enable comparison.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
