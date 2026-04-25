import { useEffect, useMemo, useState } from 'react';

export function useRotatingShowcase<T>(items: T[], intervalMs = 4800) {
  const initialIndex = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.floor(Math.random() * items.length);
  }, [items]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (items.length === 2) {
          return prev === 0 ? 1 : 0;
        }
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * items.length);
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, items.length]);

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    setActiveIndex,
  };
}
