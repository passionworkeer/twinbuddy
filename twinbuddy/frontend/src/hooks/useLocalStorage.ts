import { useState, useCallback, useEffect } from 'react';

/**
 * Typed localStorage hook with SSR safety.
 * Returns [value, setValue, removeValue].
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize from localStorage or fall back to initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync to localStorage on change
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch {
        // Storage quota exceeded or unavailable — fail silently
      }
      return nextValue;
    });
  }, [key]);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  // Keep in sync if another tab/window changes storage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
