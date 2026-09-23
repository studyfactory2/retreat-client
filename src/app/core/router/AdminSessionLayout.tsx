import { Outlet } from 'react-router-dom'
import { AdminSessionProvider } from '../session/AdminSessionProvider'

export function AdminSessionLayout() {
  return (
    <AdminSessionProvider>
      <Outlet />
    </AdminSessionProvider>
  )
}
