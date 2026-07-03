import { useEffect, useRef } from 'react';

const storageKey = 'twinbuddy_v2_route_scroll';

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function getScrollRoot(): HTMLElement | null {
  // Find the first scrollable element inside AppShell (the inner scroll container)
  const root = document.getElementById('root');
  if (!root) return null;
  const scrollable = root.querySelector<HTMLElement>('.overflow-y-auto');
  return scrollable || root;
}

export function useRouteScrollMemory(pathname: string) {
  const isRestoring = useRef(false);

  useEffect(() => {
    const scrollRoot = getScrollRoot();
    if (!scrollRoot) return;

    const positions = readPositions();
    const target = positions[pathname] ?? 0;

    if (target > 0) {
      isRestoring.current = true;
      requestAnimationFrame(() => {
        scrollRoot.scrollTop = target;
        setTimeout(() => { isRestoring.current = false; }, 100);
      });
    }

    const handleScroll = () => {
      if (isRestoring.current) return;
      const nextPositions = readPositions();
      nextPositions[pathname] = scrollRoot.scrollTop;
      sessionStorage.setItem(storageKey, JSON.stringify(nextPositions));
    };

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);
}