import { useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { saveAdminProfile } from '../../../../features/admin-account/admin-account-api';
import type {
  AccountFieldErrors,
  AdminAccount,
  ProfileValues,
} from '../../../../features/admin-account/admin-account.types';
import {
  accountErrorMessage,
  accountFieldErrors,
  profileValues,
  uncertainAccountWrite,
  validateProfile,
} from '../../../../features/admin-account/admin-account-validation';
import type { AdminUser } from '../../../../features/admin-auth/admin-auth.types';
import { useAccountRequest } from './use-account-request';

export function useProfileEditor(
  initial: AdminAccount,
  token: string,
  rejectSession: (token: string) => void,
  onSaved: (token: string, user: AdminUser) => void,
) {
  const [original, setOriginal] = useState(initial);
  const [values, setValues] = useState(() => profileValues(initial));
  const [errors, setErrors] = useState<AccountFieldErrors<ProfileValues>>({});
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const pending = useRef(false);
  const { start, isCurrent } = useAccountRequest();
  const base = profileValues(original);
  const dirty = (Object.keys(base) as (keyof ProfileValues)[]).some(
    (field) => values[field] !== base[field],
  );

  function change(field: keyof ProfileValues, value: string) {
    if (pending.current || blocked) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
    setSaved(false);
  }
  function reset() {
    if (pending.current || blocked) return;
    setValues(profileValues(original));
    setErrors({});
    setError('');
    setSaved(false);
  }
  async function save() {
    if (pending.current || blocked || !dirty) return;
    const validation = validateProfile(values);
    setErrors(validation);
    setError('');
    setSaved(false);
    if (Object.keys(validation).length) {
      setFocusRevision((value) => value + 1);
      return;
    }
    pending.current = true;
    setBusy(true);
    const request = start();
    try {
      const account = await saveAdminProfile(
        token,
        original,
        values,
        request.signal,
      );
      if (!isCurrent(request)) return;
      setOriginal(account);
      setValues(profileValues(account));
      setSaved(true);
      onSaved(token, account);
    } catch (failure) {
      if (!isCurrent(request)) return;
      if (
        failure instanceof ApiRequestError &&
        (failure.status === 401 || failure.status === 403)
      ) {
        rejectSession(token);
        return;
      }
      const uncertain = uncertainAccountWrite(failure);
      setBlocked(
        uncertain ||
          (failure instanceof ApiRequestError && failure.status === 409),
      );
      setError(
        uncertain
          ? '저장 결과를 확인하지 못했습니다. 다시 저장하기 전에 최신 정보를 불러와 확인해 주세요.'
          : accountErrorMessage(failure),
      );
      setErrors(
        accountFieldErrors<ProfileValues>(failure, [
          'name',
          'phone',
          'company',
          'department',
        ]),
      );
      setFocusRevision((value) => value + 1);
    } finally {
      if (isCurrent(request)) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  return {
    original,
    values,
    errors,
    busy,
    blocked,
    error,
    saved,
    dirty,
    focusRevision,
    change,
    reset,
    save,
  };
}
