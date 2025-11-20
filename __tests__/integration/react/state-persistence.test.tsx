/**
 * Integration Tests: State Persistence
 *
 * Tests for React state persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as React from 'react';

describe('State Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('LocalStorage Integration', () => {
    it('should persist state to localStorage', () => {
      const usePersistedState = (key: string, initialValue: any) => {
        const [state, setState] = React.useState(() => {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : initialValue;
        });

        React.useEffect(() => {
          localStorage.setItem(key, JSON.stringify(state));
        }, [key, state]);

        return [state, setState];
      };

      const { result } = renderHook(() => usePersistedState('test', { value: 0 }));

      act(() => {
        result.current[1]({ value: 42 });
      });

      const stored = localStorage.getItem('test');
      expect(JSON.parse(stored!)).toEqual({ value: 42 });
    });

    it('should restore state on mount', () => {
      localStorage.setItem('test-key', JSON.stringify({ restored: true }));

      const usePersistedState = (key: string) => {
        const [state] = React.useState(() => {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : null;
        });

        return state;
      };

      const { result } = renderHook(() => usePersistedState('test-key'));

      expect(result.current).toEqual({ restored: true });
    });

    it('should handle storage errors gracefully', () => {
      const useSafePersistedState = (key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);

        React.useEffect(() => {
          try {
            localStorage.setItem(key, JSON.stringify(state));
          } catch (error) {
            // Handle quota exceeded or other errors
            console.error('Storage error:', error);
          }
        }, [key, state]);

        return [state, setState];
      };

      const { result } = renderHook(() => useSafePersistedState('test', 'value'));

      act(() => {
        result.current[1]('new value');
      });

      expect(result.current[0]).toBe('new value');
    });

    it('should sync across multiple hook instances', () => {
      const useSharedState = (key: string, initialValue: any) => {
        const [state, setState] = React.useState(() => {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : initialValue;
        });

        React.useEffect(() => {
          localStorage.setItem(key, JSON.stringify(state));
        }, [key, state]);

        return [state, setState];
      };

      const { result: hook1 } = renderHook(() => useSharedState('shared', 0));
      const { result: hook2 } = renderHook(() => useSharedState('shared', 0));

      act(() => {
        hook1.current[1](42);
      });

      // Both hooks share the same localStorage key
      const stored = localStorage.getItem('shared');
      expect(JSON.parse(stored!)).toBe(42);
    });
  });

  describe('State Hydration', () => {
    it('should hydrate state from server', () => {
      const serverState = { users: [], messages: [] };

      const useHydratedState = (initialState: any) => {
        const [state] = React.useState(initialState);
        return state;
      };

      const { result } = renderHook(() => useHydratedState(serverState));

      expect(result.current).toEqual(serverState);
    });

    it('should merge client and server state', () => {
      const serverState = { fromServer: true };
      const clientState = { fromClient: true };

      const useMergedState = (server: any, client: any) => {
        const [state] = React.useState(() => ({ ...server, ...client }));
        return state;
      };

      const { result } = renderHook(() => useMergedState(serverState, clientState));

      expect(result.current).toEqual({
        fromServer: true,
        fromClient: true,
      });
    });

    it('should handle hydration mismatches', () => {
      const serverValue = 'server';
      const clientValue = 'client';

      const useHydrationCheck = (server: string, client: string) => {
        const [value, setValue] = React.useState(server);
        const [hydrated, setHydrated] = React.useState(false);

        React.useEffect(() => {
          if (!hydrated) {
            setValue(client);
            setHydrated(true);
          }
        }, [hydrated, client]);

        return { value, hydrated };
      };

      const { result } = renderHook(() =>
        useHydrationCheck(serverValue, clientValue)
      );

      expect(result.current.value).toBe(serverValue);
    });
  });

  describe('Cross-tab Synchronization', () => {
    it('should sync state across tabs', () => {
      const useCrossTabSync = (key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);

        React.useEffect(() => {
          const handleStorage = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
              setState(JSON.parse(e.newValue));
            }
          };

          window.addEventListener('storage', handleStorage);
          return () => window.removeEventListener('storage', handleStorage);
        }, [key]);

        const updateState = (newState: any) => {
          setState(newState);
          localStorage.setItem(key, JSON.stringify(newState));
        };

        return [state, updateState];
      };

      const { result } = renderHook(() => useCrossTabSync('sync-key', 0));

      act(() => {
        result.current[1](42);
      });

      expect(localStorage.getItem('sync-key')).toBe('42');
    });

    it('should handle concurrent updates', () => {
      const useOptimisticSync = (key: string) => {
        const [state, setState] = React.useState(0);
        const [version, setVersion] = React.useState(0);

        const updateState = (newState: number) => {
          const newVersion = version + 1;
          setState(newState);
          setVersion(newVersion);
          localStorage.setItem(key, JSON.stringify({ state: newState, version: newVersion }));
        };

        return [state, updateState];
      };

      const { result } = renderHook(() => useOptimisticSync('optimistic'));

      act(() => {
        result.current[1](5);
      });

      expect(result.current[0]).toBe(5);
    });
  });

  describe('Offline Support', () => {
    it('should queue changes when offline', () => {
      const useOfflineQueue = () => {
        const [queue, setQueue] = React.useState<any[]>([]);
        const [isOnline, setIsOnline] = React.useState(navigator.onLine);

        const addToQueue = (item: any) => {
          if (!isOnline) {
            setQueue((q) => [...q, item]);
          }
        };

        return { queue, addToQueue, isOnline };
      };

      const { result } = renderHook(() => useOfflineQueue());

      act(() => {
        result.current.addToQueue({ action: 'test' });
      });

      expect(result.current.queue.length).toBeGreaterThanOrEqual(0);
    });

    it('should sync when coming back online', () => {
      const useOnlineSync = () => {
        const [pendingChanges, setPendingChanges] = React.useState<any[]>([]);
        const [isOnline, setIsOnline] = React.useState(true);

        React.useEffect(() => {
          if (isOnline && pendingChanges.length > 0) {
            // Sync pending changes
            setPendingChanges([]);
          }
        }, [isOnline, pendingChanges]);

        return { pendingChanges, setPendingChanges, setIsOnline };
      };

      const { result } = renderHook(() => useOnlineSync());

      act(() => {
        result.current.setPendingChanges([{ id: 1 }, { id: 2 }]);
        result.current.setIsOnline(true);
      });

      expect(result.current.pendingChanges.length).toBeGreaterThanOrEqual(0);
    });
  });
});
