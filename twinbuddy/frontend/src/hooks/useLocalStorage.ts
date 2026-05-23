import { useState, useCallback, useEffect } from 'react';

/**
 * Typed localStorage hook with SSR safety.
 * Returns [value, setValue, removeValue].
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}".`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;

      if (typeof window === 'undefined') {
        return nextValue;
      }

      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch (error) {
        console.warn(`Failed to write localStorage key "${key}".`, error);
      }
      return nextValue;
    });
  }, [key]);

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      setStoredValue(initialValue);
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Failed to remove localStorage key "${key}".`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Failed to sync localStorage key "${key}" from storage event.`, error);
        }
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
