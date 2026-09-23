import type {
  AdminLoginInput,
  AdminLoginResponse,
  AdminUser,
} from '../../features/admin-auth/admin-auth.types';
import { ApiRequestError } from '../api/api-error';
import type {
  AdminSessionState,
  AdminSessionStorage,
  StoredAdminSession,
} from './admin-session.types';

type SessionDependencies = {
  storage: AdminSessionStorage;
  login: (
    input: AdminLoginInput,
    signal: AbortSignal,
  ) => Promise<AdminLoginResponse>;
  me: (token: string, signal: AbortSignal) => Promise<AdminUser>;
  now?: () => number;
};

// An isolated store makes request ordering independent of React renders.
export function createAdminSessionStore(dependencies: SessionDependencies) {
  const now = dependencies.now ?? Date.now;
  const listeners = new Set<() => void>();
  let state: AdminSessionState = { status: 'checking' };
  let credential: StoredAdminSession | null = null;
  let generation = 0;
  let request: AbortController | undefined;
  let storageNotice: string | undefined;

  function publish(next: AdminSessionState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function cancelPending() {
    generation += 1;
    request?.abort();
    request = undefined;
  }

  function beginRequest() {
    cancelPending();
    const controller = new AbortController();
    request = controller;
    return { version: generation, signal: controller.signal };
  }

  function logout(reason: 'expired' | 'signed-out' = 'signed-out') {
    cancelPending();
    const previous = credential;
    credential = null;
    storageNotice = undefined;
    dependencies.storage.clear(
      reason === 'expired' ? previous?.token : undefined,
    );
    if (reason === 'expired' && previous?.persistence === 'local') {
      const replacement = dependencies.storage.read(now()).session;
      // A late rejection of token A must not erase a newer login B from another tab.
      if (replacement && replacement.token !== previous.token) {
        credential = replacement;
        void verify();
        return;
      }
    }
    publish({ status: 'anonymous', reason });
  }

  function expire() {
    if (credential && credential.expiresAt <= now()) logout('expired');
  }

  async function verify() {
    if (!credential) return;
    if (credential.expiresAt <= now()) {
      logout('expired');
      return;
    }
    const current = credential;
    const operation = beginRequest();
    // Keep a verified same-credential screen mounted while checking on focus.
    // Initial/restored replacement credentials still block behind verification.
    // Expiry, rejection and verification failures retain their blocking paths.
    if (state.status !== 'authenticated' || state.token !== current.token)
      publish({ status: 'checking' });
    try {
      const user = await dependencies.me(current.token, operation.signal);
      if (operation.version !== generation) return;
      if (current.expiresAt <= now()) {
        logout('expired');
        return;
      }
      publish({
        status: 'authenticated',
        user,
        token: current.token,
        expiresAt: current.expiresAt,
        storageNotice,
      });
    } catch (error) {
      if (operation.version !== generation) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        logout('expired');
      } else {
        publish({
          status: 'unavailable',
          message:
            error instanceof ApiRequestError
              ? error.message
              : '로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.',
        });
      }
    } finally {
      if (operation.version === generation) request = undefined;
    }
  }

  function restore() {
    cancelPending();
    storageNotice = undefined;
    const stored = dependencies.storage.read(now());
    credential = stored.session;
    if (!credential) {
      publish({
        status: 'anonymous',
        reason: stored.expired ? 'expired' : undefined,
      });
      return;
    }
    void verify();
  }

  async function signIn(input: AdminLoginInput) {
    const operation = beginRequest();
    const startedAt = now();
    try {
      const result = await dependencies.login(input, operation.signal);
      if (operation.version !== generation)
        throw new DOMException('Request cancelled', 'AbortError');
      credential = {
        token: result.token,
        expiresAt: startedAt + result.expiresIn * 1000,
        persistence: input.autoLogin ? 'local' : 'session',
      };
      if (credential.expiresAt <= now()) {
        logout('expired');
        throw new ApiRequestError(
          '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
          401,
          'SESSION_EXPIRED',
        );
      }
      storageNotice = dependencies.storage.save(credential)
        ? undefined
        : '브라우저에서 로그인 정보를 저장할 수 없습니다. 새로고침하면 다시 로그인해야 합니다.';
      publish({
        status: 'authenticated',
        user: result.user,
        token: credential.token,
        expiresAt: credential.expiresAt,
        storageNotice,
      });
    } catch (error) {
      if (operation.version !== generation)
        throw new DOMException('Request cancelled', 'AbortError');
      throw error;
    } finally {
      if (operation.version === generation) request = undefined;
    }
  }

  return {
    getSnapshot: () => state,
    getExpiresAt: () => credential?.expiresAt,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    restore,
    signIn,
    logout: () => logout(),
    rejectSession: (token: string) => {
      // A feature response can reject only the credential that made its request.
      if (credential?.token === token) logout('expired');
    },
    retry: () => {
      void verify();
    },
    expire,
    revalidate: () => {
      expire();
      if (credential && !request) void verify();
    },
    syncStoredSession: () => {
      // Persistent sessions follow changes from other tabs. Tab sessions stay local.
      if (!credential || credential.persistence === 'local') restore();
    },
    stop: cancelPending,
  };
}

export type AdminSessionStore = ReturnType<typeof createAdminSessionStore>;
