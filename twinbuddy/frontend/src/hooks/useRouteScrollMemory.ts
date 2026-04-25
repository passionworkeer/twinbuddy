import { useEffect } from 'react';

const storageKey = 'twinbuddy_v2_route_scroll';

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function useRouteScrollMemory(pathname: string) {
  useEffect(() => {
    const positions = readPositions();
    const target = positions[pathname] ?? 0;
    window.requestAnimationFrame(() => window.scrollTo({ top: target }));

    return () => {
      const nextPositions = readPositions();
      nextPositions[pathname] = window.scrollY;
      sessionStorage.setItem(storageKey, JSON.stringify(nextPositions));
    };
  }, [pathname]);
}
