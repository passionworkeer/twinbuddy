import { useEffect, useRef } from 'react';

const storageKey = 'twinbuddy_v2_route_scroll';

function isPositionMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item));
}

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    return isPositionMap(parsed) ? parsed : {};
  } catch (error) {
    console.warn('Failed to read route scroll memory.', error);
    return {};
  }
}

function getScrollRoot(): HTMLElement | null {
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

    let restoreTimeoutId: number | null = null;
    let frameId: number | null = null;

    const positions = readPositions();
    const target = positions[pathname] ?? 0;

    if (target > 0) {
      isRestoring.current = true;
      frameId = requestAnimationFrame(() => {
        scrollRoot.scrollTop = target;
        restoreTimeoutId = window.setTimeout(() => {
          isRestoring.current = false;
        }, 100);
      });
    }

    const handleScroll = () => {
      if (isRestoring.current) return;
      const nextPositions = readPositions();
      nextPositions[pathname] = scrollRoot.scrollTop;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(nextPositions));
      } catch (error) {
        console.warn('Failed to persist route scroll memory.', error);
      }
    };

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener('scroll', handleScroll);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (restoreTimeoutId !== null) {
        window.clearTimeout(restoreTimeoutId);
      }
      isRestoring.current = false;
    };
  }, [pathname]);
}
