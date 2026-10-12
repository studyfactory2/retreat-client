import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSessionState } from '../../screens/admin/components/AdminSessionState';
import { useAdminSession } from '../session/use-admin-session';
import { useNavigationActions } from './navigation/use-navigation-guard';
import { appRoutes } from './routes';

export function RequireAdmin() {
  const { state } = useAdminSession();
  if (state.status === 'anonymous') return <AdminLoginRedirect />;
  if (state.status !== 'authenticated')
    return (
      <main className="admin-access">
        <AdminSessionState />
      </main>
    );
  return <Outlet />;
}

function AdminLoginRedirect() {
  const navigate = useNavigate();
  const { runConfirmed } = useNavigationActions();
  useLayoutEffect(() => {
    // Expiry/rejection must win over a pending edit dialog. This does not defer
    // session clearing or let a leave decision restore authenticated content.
    runConfirmed(() => void navigate(appRoutes.adminLogin, { replace: true }));
  }, [navigate, runConfirmed]);
  return null;
}
