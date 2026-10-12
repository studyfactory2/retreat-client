import { createContext, useContext, useLayoutEffect } from 'react';
import type { FragmentHistory } from './fragment-history';

export interface NavigationActions {
  runConfirmed: (operation: () => void) => void;
  requestAction: (operation: () => void) => () => void;
}
export const NavigationActionsContext = createContext<NavigationActions | null>(
  null,
);

type RegisterGuard = (hasPendingWork: () => boolean) => () => void;
export const NavigationGuardContext = createContext<RegisterGuard | null>(null);
export const NavigationHistoryContext = createContext<FragmentHistory | null>(
  null,
);

export function useNavigationGuard(hasPendingWork: () => boolean): void {
  const register = useContext(NavigationGuardContext);
  if (!register)
    throw new Error('Navigation guard requires NavigationBoundary.');
  useLayoutEffect(() => register(hasPendingWork), [register, hasPendingWork]);
}

export function useNavigationActions(): NavigationActions {
  const actions = useContext(NavigationActionsContext);
  if (!actions)
    throw new Error('Navigation actions require NavigationBoundary.');
  return actions;
}
