import { createContext } from 'react'
import type { AdminSessionStore } from './admin-session-store'

export const AdminSessionContext = createContext<AdminSessionStore | null>(null)
