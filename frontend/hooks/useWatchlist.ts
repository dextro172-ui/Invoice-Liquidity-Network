import { useState, useEffect, useCallback } from 'react';

export interface WatchlistItem {
  id: string; // Storing as string to avoid bigint serialization issues in localStorage
  addedAt: number;
}

const MAX_WATCHLIST_SIZE = 50;

export function useWatchlist(walletAddress: string | null) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Load from localStorage on mount or when address changes
  useEffect(() => {
    if (!walletAddress) {
      setWatchlist([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`watchlist_${walletAddress}`);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      } else {
        setWatchlist([]);
      }
    } catch (e) {
      console.error('Failed to load watchlist from local storage', e);
      setWatchlist([]);
    }
  }, [walletAddress]);

  const saveWatchlist = useCallback((newList: WatchlistItem[]) => {
    if (!walletAddress) return;
    try {
      localStorage.setItem(`watchlist_${walletAddress}`, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save watchlist to local storage', e);
    }
  }, [walletAddress]);

  const addToWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    setWatchlist(current => {
      if (current.some(item => item.id === idStr)) {
        return current;
      }
      
      if (current.length >= MAX_WATCHLIST_SIZE) {
        throw new Error(`Watchlist limit of ${MAX_WATCHLIST_SIZE} invoices reached. Please remove some before adding new ones.`);
      }

      const newList = [...current, { id: idStr, addedAt: Date.now() }];
      saveWatchlist(newList);
      return newList;
    });
  }, [saveWatchlist]);

  const removeFromWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    setWatchlist(current => {
      const newList = current.filter(item => item.id !== idStr);
      saveWatchlist(newList);
      return newList;
    });
  }, [saveWatchlist]);

  const toggleWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    setWatchlist(current => {
      if (current.some(item => item.id === idStr)) {
        const newList = current.filter(item => item.id !== idStr);
        saveWatchlist(newList);
        return newList;
      } else {
        if (current.length >= MAX_WATCHLIST_SIZE) {
          throw new Error(`Watchlist limit of ${MAX_WATCHLIST_SIZE} invoices reached. Please remove some before adding new ones.`);
        }
        const newList = [...current, { id: idStr, addedAt: Date.now() }];
        saveWatchlist(newList);
        return newList;
      }
    });
  }, [saveWatchlist]);

  const isInWatchlist = useCallback((invoiceId: bigint) => {
    return watchlist.some(item => item.id === invoiceId.toString());
  }, [watchlist]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };
}
