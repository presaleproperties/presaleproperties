import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guest_favorite_listings";

export function useGuestFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  }, []);

  // Save to localStorage whenever favorites change
  const saveFavorites = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (e) {
      console.error("Error saving favorites:", e);
    }
  }, []);

  const addFavorite = useCallback((listingId: string) => {
    setFavorites((prev) => {
      if (prev.includes(listingId)) return prev;
      const updated = [...prev, listingId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((listingId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== listingId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((listingId: string) => {
    setFavorites((prev) => {
      const isFavorited = prev.includes(listingId);
      const updated = isFavorited 
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((listingId: string) => {
    return favorites.includes(listingId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
