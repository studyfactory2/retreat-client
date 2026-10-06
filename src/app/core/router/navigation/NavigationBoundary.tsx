import {
  useCallback,
  useContext,
  useLayoutEffect,
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
    const blocked = [...guards.current].some((check) => check());
    setState((current) => reviewNavigation(current, next, blocked));
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
    <NavigationGuardContext.Provider value={register}>
      <Routes location={state.accepted.location}>{children}</Routes>
      {state.pending && (
        <NavigationLeaveDialog
          restoring={state.restoring}
          onStay={() =>
            setState((current) => ({ ...current, restoring: true }))
          }
          onLeave={() =>
            setState((current) =>
              current.pending &&
              !current.restoring &&
              history.matches(current.pending.location)
                ? { accepted: current.pending, pending: null, restoring: false }
                : current,
            )
          }
        />
      )}
    </NavigationGuardContext.Provider>
  );
}
