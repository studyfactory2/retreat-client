import { useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FragmentHistory } from '../router/navigation/fragment-history';
import { NavigationHistoryContext } from '../router/navigation/use-navigation-guard';

export function AppProviders({ children }: { children: ReactNode }) {
  const [history] = useState(() => new FragmentHistory(window));
  return (
    <NavigationHistoryContext.Provider value={history}>
      <BrowserRouter window={history.routerWindow}>{children}</BrowserRouter>
    </NavigationHistoryContext.Provider>
  );
}
