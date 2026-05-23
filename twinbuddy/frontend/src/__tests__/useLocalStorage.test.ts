import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STORAGE_KEY = 'test-local-storage-key';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('falls back to initial value for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad-json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    expect(result.current[0]).toEqual({ count: 0 });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('persists updated value', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    act(() => {
      result.current[1]({ count: 2 });
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')).toEqual({ count: 2 });
  });

  it('warns when write fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    act(() => {
      result.current[1]({ count: 1 });
    });

    expect(setItemSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('resets to initial value on remove', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    act(() => {
      result.current[1]({ count: 3 });
    });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toEqual({ count: 0 });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
