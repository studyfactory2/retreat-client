import type { AdminUser } from '../../features/admin-auth/admin-auth.types';

export type AdminSessionState =
  | { status: 'checking' }
  | {
      status: 'anonymous';
      reason?:
        'expired' | 'signed-out' | 'password-changed' | 'password-uncertain';
    }
  | { status: 'unavailable'; message: string }
  | {
      status: 'authenticated';
      user: AdminUser;
      token: string;
      expiresAt: number;
      storageNotice?: string;
    };

export type StoredAdminSession = {
  token: string;
  expiresAt: number;
  persistence: 'session' | 'local';
};

export interface AdminSessionStorage {
  read(now: number): { session: StoredAdminSession | null; expired: boolean };
  save(session: StoredAdminSession): boolean;
  clear(expectedToken?: string): void;
}
