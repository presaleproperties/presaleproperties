import { useCallback, useRef, useState } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T, maxHistory = 30) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushState = useCallback((newPresent: T) => {
    setState(prev => {
      // Don't push if identical
      if (JSON.stringify(prev.present) === JSON.stringify(newPresent)) return prev;
      const past = [...prev.past, prev.present].slice(-maxHistory);
      return { past, present: newPresent, future: [] };
    });
  }, [maxHistory]);

  // Debounced push — batches rapid changes
  const pushStateDebounced = useCallback((newPresent: T, delay = 800) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushState(newPresent), delay);
  }, [pushState]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const previous = newPast.pop()!;
      return { past: newPast, present: previous, future: [prev.present, ...prev.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      return { past: [...prev.past, prev.present], present: next, future: newFuture };
    });
  }, []);

  return {
    state: state.present,
    pushState,
    pushStateDebounced,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length,
  };
}
