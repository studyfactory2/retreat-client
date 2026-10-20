import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminAccount } from '../../../../features/admin-account/admin-account-api';
import type { AdminAccount } from '../../../../features/admin-account/admin-account.types';
import { accountErrorMessage } from '../../../../features/admin-account/admin-account-validation';
import { useAccountRequest } from './use-account-request';

type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; account: AdminAccount };
export function useAdminAccount(
  token: string,
  userId: string,
  rejectSession: (token: string) => void,
) {
  const [resource, setResource] = useState<Resource>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  const { start, isCurrent } = useAccountRequest();
  useEffect(() => {
    const request = start();
    void getAdminAccount(token, userId, request.signal)
      .then((account) => {
        if (isCurrent(request)) setResource({ status: 'ready', account });
      })
      .catch((error: unknown) => {
        if (!isCurrent(request)) return;
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        )
          rejectSession(token);
        else
          setResource({ status: 'error', message: accountErrorMessage(error) });
      });
    return () => request.abort();
  }, [token, userId, rejectSession, revision, start, isCurrent]);
  return {
    resource,
    reload: () => {
      setResource({ status: 'loading' });
      setRevision((value) => value + 1);
    },
  };
}
