import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom';
import { NavigationLeaveDialog } from './NavigationLeaveDialog';
import {
  NavigationActionsContext,
  NavigationGuardContext,
  NavigationHistoryContext,
} from './use-navigation-guard';
import {
  reviewNavigation,
  sameDestination,
  type NavigationState,
} from './navigation-state';

export function NavigationBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const action = useNavigationType();
  const navigate = useNavigate();
  const history = useContext(NavigationHistoryContext);
  if (!history) throw new Error('NavigationBoundary requires AppProviders.');
  const [state, setState] = useState<NavigationState>(() => ({
    accepted: { location, index: history.index },
    pending: null,
    restoring: false,
  }));
  const guards = useRef(new Set<() => boolean>());
  const approved = useRef<{ url: string; key: unknown } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const current = useRef(state);
  useLayoutEffect(() => {
    current.current = state;
  }, [state]);
  const runConfirmed = useCallback((operation: () => void) => {
    approved.current = null;
    const before =
      window.location.pathname + window.location.search + window.location.hash;
    const previousEntry: unknown = window.history.state;
    const previousKey =
      typeof previousEntry === 'object' &&
      previousEntry !== null &&
      'key' in previousEntry
        ? previousEntry.key
        : null;
    operation();
    const after =
      window.location.pathname + window.location.search + window.location.hash;
    // Only this synchronous navigation is approved. An in-place reload or editor
    // switch must never leave an allowance for an unrelated future navigation.
    const entry: unknown = window.history.state;
    const key =
      typeof entry === 'object' && entry !== null && 'key' in entry
        ? entry.key
        : null;
    if (before !== after || previousKey !== key)
      approved.current = { url: after, key };
  }, []);
  const requestAction = useCallback((operation: () => void) => {
    if (current.current.pending || current.current.restoring) return () => {};
    if (![...guards.current].some((check) => check())) {
      operation();
      return () => {};
    }
    setPendingAction(() => operation);
    return () =>
      setPendingAction((pending) => (pending === operation ? null : pending));
  }, []);
  const actions = useMemo(
    () => ({ runConfirmed, requestAction }),
    [runConfirmed, requestAction],
  );
  const register = useCallback((check: () => boolean) => {
    guards.current.add(check);
    return () => {
      guards.current.delete(check);
    };
  }, []);

  useLayoutEffect(() => history.listen(), [history]);
  useLayoutEffect(() => {
    if (!history.matches(location)) return;
    history.sync(action);
    const next = { location, index: history.index };
    const allowed =
      approved.current?.url ===
        location.pathname + location.search + location.hash &&
      approved.current.key === location.key;
    approved.current = null;
    const blocked = [...guards.current].some((check) => check());
    setState((current) =>
      allowed
        ? { accepted: next, pending: null, restoring: false }
        : reviewNavigation(current, next, blocked),
    );
    setPendingAction(null);
  }, [action, history, location]);

  useLayoutEffect(() => {
    if (!state.restoring || !history.matches(location)) return;
    if (sameDestination(state.accepted.location, location)) return;
    const from = history.index;
    const to = state.accepted.index;
    if (
      from !== null &&
      to !== null &&
      from !== to &&
      history.canRestore(to, state.accepted.location.key)
    ) {
      window.history.go(to - from);
    } else {
      // A replace (or a new branch that removed the old entry) has no previous
      // slot to traverse to. Restore only that overwritten/unreachable slot.
      void navigate(state.accepted.location, {
        replace: true,
        state: state.accepted.location.state,
      });
    }
  }, [history, location, navigate, state.accepted, state.restoring]);

  return (
    <NavigationActionsContext.Provider value={actions}>
      <NavigationGuardContext.Provider value={register}>
        <Routes location={state.accepted.location}>{children}</Routes>
        {(state.pending || pendingAction) && (
          <NavigationLeaveDialog
            restoring={state.restoring}
            admin={state.accepted.location.pathname.startsWith('/admin')}
            loggingOut={!!pendingAction}
            onStay={() => {
              if (pendingAction) setPendingAction(null);
              else setState((current) => ({ ...current, restoring: true }));
            }}
            onLeave={() => {
              if (pendingAction) {
                setPendingAction(null);
                pendingAction();
                return;
              }
              setState((current) =>
                current.pending &&
                !current.restoring &&
                history.matches(current.pending.location)
                  ? {
                      accepted: current.pending,
                      pending: null,
                      restoring: false,
                    }
                  : current,
              );
            }}
          />
        )}
      </NavigationGuardContext.Provider>
    </NavigationActionsContext.Provider>
  );
}
