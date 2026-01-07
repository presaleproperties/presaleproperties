import { useState, useEffect, useCallback } from "react";
import { ROIInputs, ROIResults } from "@/types/roi";

export interface SavedAnalysis {
  id: string;
  name: string;
  savedAt: string;
  inputs: ROIInputs;
  results: ROIResults;
}

const STORAGE_KEY = "roi_saved_analyses";
const MAX_SAVED = 3;

export function useSavedAnalyses() {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedAnalyses(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading saved analyses:", error);
    }
  }, []);

  // Save to localStorage whenever savedAnalyses changes
  const persistAnalyses = useCallback((analyses: SavedAnalysis[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    } catch (error) {
      console.error("Error saving analyses:", error);
    }
  }, []);

  const saveAnalysis = useCallback(
    (inputs: ROIInputs, results: ROIResults, customName?: string) => {
      if (savedAnalyses.length >= MAX_SAVED) {
        return { success: false, error: "Maximum 3 saved analyses. Delete one to save a new one." };
      }

      const name = customName || `${inputs.purchase.city} ${inputs.purchase.propertyType} - ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(inputs.purchase.purchasePrice)}`;
      
      const newAnalysis: SavedAnalysis = {
        id: `analysis_${Date.now()}`,
        name,
        savedAt: new Date().toISOString(),
        inputs,
        results,
      };

      const updated = [...savedAnalyses, newAnalysis];
      setSavedAnalyses(updated);
      persistAnalyses(updated);
      
      return { success: true, analysis: newAnalysis };
    },
    [savedAnalyses, persistAnalyses]
  );

  const deleteAnalysis = useCallback(
    (id: string) => {
      const updated = savedAnalyses.filter((a) => a.id !== id);
      setSavedAnalyses(updated);
      persistAnalyses(updated);
      
      // Exit compare mode if less than 2 analyses
      if (updated.length < 2) {
        setCompareMode(false);
      }
    },
    [savedAnalyses, persistAnalyses]
  );

  const clearAllAnalyses = useCallback(() => {
    setSavedAnalyses([]);
    persistAnalyses([]);
    setCompareMode(false);
  }, [persistAnalyses]);

  const canSave = savedAnalyses.length < MAX_SAVED;
  const canCompare = savedAnalyses.length >= 2;

  return {
    savedAnalyses,
    saveAnalysis,
    deleteAnalysis,
    clearAllAnalyses,
    canSave,
    canCompare,
    compareMode,
    setCompareMode,
    maxSaved: MAX_SAVED,
  };
}
