import { useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { changeAdminPassword } from '../../../../features/admin-account/admin-account-api';
import type {
  AccountFieldErrors,
  PasswordValues,
} from '../../../../features/admin-account/admin-account.types';
import {
  accountErrorMessage,
  accountFieldErrors,
  uncertainAccountWrite,
  validatePassword,
} from '../../../../features/admin-account/admin-account-validation';
import { useAccountRequest } from './use-account-request';

const empty: PasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
export function usePasswordEditor(
  token: string,
  rejectSession: (token: string) => void,
  finish: (token: string, uncertain?: boolean) => void,
  profilePending: boolean,
) {
  const [values, setValues] = useState<PasswordValues>(empty);
  const [errors, setErrors] = useState<AccountFieldErrors<PasswordValues>>({});
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [focusRevision, setFocusRevision] = useState(0);
  const pending = useRef(false);
  const { start, isCurrent } = useAccountRequest();
  const dirty = Object.values(values).some(Boolean);
  function change(field: keyof PasswordValues, value: string) {
    if (pending.current || blocked) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  }
  function reset() {
    if (pending.current || blocked) return;
    setValues(empty);
    setErrors({});
    setError('');
  }
  async function save() {
    if (pending.current || blocked || profilePending) return;
    const validation = validatePassword(values);
    setErrors(validation);
    setError('');
    if (Object.keys(validation).length) {
      setFocusRevision((value) => value + 1);
      return;
    }
    pending.current = true;
    setBusy(true);
    const request = start();
    try {
      await changeAdminPassword(token, values, request.signal);
      if (!isCurrent(request)) return;
      setValues(empty);
      finish(token);
    } catch (failure) {
      if (!isCurrent(request)) return;
      if (
        failure instanceof ApiRequestError &&
        (failure.status === 401 || failure.status === 403)
      ) {
        setValues(empty);
        rejectSession(token);
        return;
      }
      if (uncertainAccountWrite(failure)) {
        setValues(empty);
        setBlocked(true);
        setError(
          '변경 결과를 확인하지 못했습니다. 다시 변경하지 말고 로그인하여 확인해 주세요.',
        );
      } else {
        setError(accountErrorMessage(failure));
        const fields = accountFieldErrors<PasswordValues>(failure, [
          'currentPassword',
          'newPassword',
          'confirmPassword',
        ]);
        if (failure instanceof ApiRequestError) {
          if (failure.code === 'INVALID_CURRENT_PASSWORD')
            fields.currentPassword = failure.message;
          if (
            failure.code === 'PASSWORD_UNCHANGED' ||
            failure.code === 'INVALID_PASSWORD'
          )
            fields.newPassword = failure.message;
          if (failure.code === 'PASSWORD_CONFIRMATION_MISMATCH')
            fields.confirmPassword = failure.message;
        }
        setErrors(fields);
      }
      setFocusRevision((value) => value + 1);
    } finally {
      if (isCurrent(request)) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  return {
    values,
    errors,
    busy,
    blocked,
    error,
    dirty,
    focusRevision,
    change,
    reset,
    save,
    signInAgain: () => finish(token, true),
  };
}
