import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAdminStaff,
  updateAdminStaff,
} from '../../../../features/admin-staff/admin-staff-api';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import {
  buildCreateStaffInput,
  buildUpdateStaffInput,
  createStaffFormValues,
  validateStaffForm,
  type StaffFormErrors,
  type StaffFormValues,
} from '../model/staff-form-model';
import { useStaffNavigation } from './use-staff-navigation';
import { useStaffSave } from './use-staff-save';

export function useStaffEditor({
  original,
  token,
  rejectSession,
  returnUrl,
}: {
  original?: AdminStaffDto;
  token: string;
  rejectSession: (token: string) => void;
  returnUrl: string;
}) {
  const navigate = useNavigate();
  const [initial] = useState(() => createStaffFormValues(original));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [unchanged, setUnchanged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const mutation = useStaffSave(token, rejectSession);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const navigation = useStaffNavigation(dirty, mutation.state.busy);
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  function change(next: StaffFormValues) {
    setValues(next);
    setErrors((current) => {
      const remaining = { ...mutation.state.errors, ...current };
      for (const field of [
        'name',
        'phone',
        'company',
        'department',
        'isActive',
      ] as const) {
        if (next[field] !== values[field]) remaining[field] = undefined;
      }
      return remaining;
    });
    setUnchanged(false);
  }
  function persist() {
    if (mutation.state.busy || mutation.state.blocked || navigation.pending)
      return;
    const update = original ? buildUpdateStaffInput(values, original) : null;
    if (original && !update) {
      setUnchanged(true);
      return;
    }
    setConfirming(false);
    void mutation.save(
      (signal) =>
        original && update
          ? updateAdminStaff(original.id, update, token, signal)
          : createAdminStaff(buildCreateStaffInput(values), token, signal),
      (saved) =>
        navigate(returnUrl, {
          replace: true,
          state: {
            staffNotice: original ? 'updated' : 'created',
            staffId: saved.id,
            staffName: saved.name,
          },
        }),
    );
  }
  function submit() {
    if (
      mutation.state.busy ||
      mutation.state.blocked ||
      navigation.pending ||
      confirming
    )
      return;
    const nextErrors = validateStaffForm(values, original);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.staff-form [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (original && !buildUpdateStaffInput(values, original)) {
      setUnchanged(true);
      return;
    }
    if (original?.isActive && !values.isActive) setConfirming(true);
    else persist();
  }
  function keepEditing() {
    setConfirming(false);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('.staff-form button[type="submit"]')
        ?.focus(),
    );
  }
  return {
    values,
    change,
    errors: { ...mutation.state.errors, ...errors },
    unchanged,
    confirming,
    keepEditing,
    persist,
    submit,
    mutation: mutation.state,
    navigation,
    returnToList: () => navigation.request(() => navigate(returnUrl)),
  };
}
