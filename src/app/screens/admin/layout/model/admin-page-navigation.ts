import { createContext } from 'react';
import type { AdminPageHistory } from './admin-page-history';

export const AdminPageNavigationContext =
  createContext<AdminPageHistory | null>(null);
