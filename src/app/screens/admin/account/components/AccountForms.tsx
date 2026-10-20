import { useAdminSession } from '../../../../core/session/use-admin-session';
import type { AdminAccount } from '../../../../features/admin-account/admin-account.types';
import { useProfileEditor } from '../hooks/use-profile-editor';
import { usePasswordEditor } from '../hooks/use-password-editor';
import { useState } from 'react';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { AccountReloadDialog } from './AccountReloadDialog';
import { AccountProfileForm } from './AccountProfileForm';
import { AccountPasswordForm } from './AccountPasswordForm';

export function AccountForms({
  account,
  token,
  reload,
}: {
  account: AdminAccount;
  token: string;
  reload: () => void;
}) {
  const session = useAdminSession();
  const profile = useProfileEditor(
    account,
    token,
    session.rejectSession,
    session.updateProfile,
  );
  const profilePending = profile.dirty || profile.busy || profile.blocked;
  const password = usePasswordEditor(
    token,
    session.rejectSession,
    session.finishPasswordChange,
    profilePending,
  );
  const [confirmReload, setConfirmReload] = useState(false);
  useAdminNavigationGuard(
    profile.dirty || password.dirty || profile.busy || password.busy,
  );
  return (
    <div className="account-grid">
      <AccountProfileForm
        editor={profile}
        disabled={password.busy || password.blocked}
        onReload={() => setConfirmReload(true)}
      />
      <AccountPasswordForm
        editor={password}
        profilePending={profilePending}
        loginId={account.loginId}
      />
      {confirmReload && (
        <AccountReloadDialog
          onKeep={() => setConfirmReload(false)}
          onReload={reload}
        />
      )}
    </div>
  );
}
