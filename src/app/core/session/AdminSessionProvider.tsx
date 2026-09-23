import { useEffect, useState, type ReactNode } from 'react'
import {
  getCurrentAdmin,
  loginAdmin,
} from '../../features/admin-auth/admin-auth-api'
import { appConfig } from '../config/environment'
import { AdminSessionContext } from './admin-session-context'
import { createAdminSessionStorage } from './admin-session-storage'
import { createAdminSessionStore } from './admin-session-store'

const storageKey = `retreat.admin-session.v1:${appConfig.apiBaseUrl}`

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() =>
    createAdminSessionStore({
      storage: createAdminSessionStorage(storageKey, (kind) =>
        kind === 'local' ? window.localStorage : window.sessionStorage,
      ),
      login: loginAdmin,
      me: getCurrentAdmin,
    }),
  )

  useEffect(() => {
    let expiryTimer: number | undefined
    const scheduleExpiry = () => {
      window.clearTimeout(expiryTimer)
      const expiresAt = store.getExpiresAt()
      if (expiresAt === undefined) return
      // 30-day sessions exceed the maximum browser timeout; schedule in chunks.
      expiryTimer = window.setTimeout(
        () => {
          store.expire()
          scheduleExpiry()
        },
        Math.min(Math.max(expiresAt - Date.now(), 0), 2_147_483_647),
      )
    }
    const unsubscribe = store.subscribe(scheduleExpiry)
    store.restore()
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        store.syncStoredSession()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') store.revalidate()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', store.revalidate)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      store.stop()
      unsubscribe()
      window.clearTimeout(expiryTimer)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', store.revalidate)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store])

  return (
    <AdminSessionContext.Provider value={store}>
      {children}
    </AdminSessionContext.Provider>
  )
}
