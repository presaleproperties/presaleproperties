import { useState, useEffect, useCallback } from 'react';

export interface SavedSnapshot {
  id: string;
  name: string;
  savedAt: string;
  inputs: {
    buyerType: 'firstTimeBuyer' | 'investor';
    purchasePrice: number;
    firstDepositPercent: number;
    secondDepositPercent: number;
    downPaymentPercent: number;
    interestRate: number;
    amortizationYears: number;
    monthlyRent: number;
    strataFees: number;
    propertyTax: number;
    includeGST: boolean;
  };
  results: {
    totalCashRequired: number;
    monthlyCashFlow: number;
    annualCashFlow: number;
    cashAtCompletion: number;
    mortgageAmount: number;
    monthlyMortgage: number;
    totalMonthlyExpenses: number;
  };
}

const STORAGE_KEY = 'investment-snapshots';
const MAX_SNAPSHOTS = 3;

export function useSavedSnapshots() {
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSnapshots(JSON.parse(stored));
      }
    } catch {
      console.error('Failed to load saved snapshots');
    }
  }, []);

  // Save to localStorage whenever snapshots change
  const persistSnapshots = useCallback((newSnapshots: SavedSnapshot[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnapshots));
      setSnapshots(newSnapshots);
    } catch {
      console.error('Failed to save snapshots');
    }
  }, []);

  const saveSnapshot = useCallback((
    name: string,
    inputs: SavedSnapshot['inputs'],
    results: SavedSnapshot['results']
  ): boolean => {
    if (snapshots.length >= MAX_SNAPSHOTS) {
      return false;
    }

    const newSnapshot: SavedSnapshot = {
      id: `snapshot-${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      inputs,
      results,
    };

    persistSnapshots([...snapshots, newSnapshot]);
    return true;
  }, [snapshots, persistSnapshots]);

  const deleteSnapshot = useCallback((id: string) => {
    persistSnapshots(snapshots.filter(s => s.id !== id));
  }, [snapshots, persistSnapshots]);

  const clearAllSnapshots = useCallback(() => {
    persistSnapshots([]);
  }, [persistSnapshots]);

  const canSaveMore = snapshots.length < MAX_SNAPSHOTS;

  return {
    snapshots,
    saveSnapshot,
    deleteSnapshot,
    clearAllSnapshots,
    canSaveMore,
    maxSnapshots: MAX_SNAPSHOTS,
  };
}
