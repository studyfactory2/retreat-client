import { createContext, useContext } from 'react';

export interface PwaState {
  canInstall: boolean;
  installed: boolean;
  installing: boolean;
  installNotice: string;
  online: boolean;
  updateBuild: string | null;
  install: () => Promise<void>;
}

export const PwaContext = createContext<PwaState | null>(null);

export function usePwa(): PwaState {
  const context = useContext(PwaContext);
  if (!context) throw new Error('PWA controls require PwaProvider.');
  return context;
}
