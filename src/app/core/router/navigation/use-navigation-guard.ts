import { createContext, useContext, useLayoutEffect } from 'react';
import type { FragmentHistory } from './fragment-history';

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
