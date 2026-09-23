import type {
  AdminSessionStorage,
  StoredAdminSession,
} from './admin-session.types'

// Only the credential and expiry are persisted; never the password or profile.
export function createAdminSessionStorage(
  key: string,
  getStorage: (kind: 'session' | 'local') => Storage,
): AdminSessionStorage {
  function remove(kind: 'session' | 'local', expectedToken?: string) {
    try {
      const storage = getStorage(kind)
      if (expectedToken !== undefined) {
        const raw = storage.getItem(key)
        if (!raw) return
        const saved: unknown = JSON.parse(raw)
        if (
          !saved ||
          typeof saved !== 'object' ||
          !('token' in saved) ||
          saved.token !== expectedToken
        )
          return
      }
      storage.removeItem(key)
    } catch {
      // Browser privacy settings can make storage unavailable.
    }
  }

  return {
    read(now) {
      let expired = false
      for (const persistence of ['session', 'local'] as const) {
        try {
          const raw = getStorage(persistence).getItem(key)
          if (!raw) continue
          const value: unknown = JSON.parse(raw)
          if (
            !value ||
            typeof value !== 'object' ||
            !('version' in value) ||
            value.version !== 1 ||
            !('token' in value) ||
            typeof value.token !== 'string' ||
            !value.token ||
            value.token.length > 8000 ||
            /\s/.test(value.token) ||
            !('expiresAt' in value) ||
            typeof value.expiresAt !== 'number' ||
            !Number.isFinite(value.expiresAt)
          ) {
            remove(persistence)
            continue
          }
          if (value.expiresAt <= now) {
            expired = true
            remove(persistence)
            continue
          }
          return {
            session: {
              token: value.token,
              expiresAt: value.expiresAt,
              persistence,
            },
            expired: false,
          }
        } catch {
          remove(persistence)
        }
      }
      return { session: null, expired }
    },
    save(session: StoredAdminSession) {
      remove('session')
      remove('local')
      try {
        getStorage(session.persistence).setItem(
          key,
          JSON.stringify({
            version: 1,
            token: session.token,
            expiresAt: session.expiresAt,
          }),
        )
        return true
      } catch {
        return false
      }
    },
    clear(expectedToken) {
      remove('session', expectedToken)
      remove('local', expectedToken)
    },
  }
}
