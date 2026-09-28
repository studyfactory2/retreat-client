import { Navigate, Outlet } from 'react-router-dom';
import { AdminSessionState } from '../../screens/admin/components/AdminSessionState';
import { useAdminSession } from '../session/use-admin-session';
import { appRoutes } from './routes';

export function RequireAdmin() {
  const { state } = useAdminSession();
  if (state.status === 'anonymous')
    return <Navigate to={appRoutes.adminLogin} replace />;
  if (state.status !== 'authenticated')
    return (
      <main className="admin-access">
        <AdminSessionState />
      </main>
    );
  return <Outlet />;
}
