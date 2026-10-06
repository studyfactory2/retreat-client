import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffAccessState } from './components/StaffAccessState';
import { StaffFrame } from './components/StaffFrame';
import { StaffHome } from './components/StaffHome';
import { StaffStartCard } from './components/StaffStartCard';
import { useStaffEntry } from './hooks/use-staff-entry';
import { useStaffStart } from './hooks/use-staff-start';
import { readStaffAccess } from './model/staff-entry-model';
import './styles/staff-entry.css';
import './styles/staff-start.css';

export function StaffEntryScreen() {
  const location = useLocation();
  const access = readStaffAccess(location.hash);
  const { resource, refresh, rejectAccess } = useStaffEntry(
    access.status === 'ready' ? access.token : null,
  );
  const startForm = useStaffStart(
    access.status === 'ready' ? access.token : null,
    resource.status === 'ready' ? resource.data : null,
    resource.status === 'ready'
      ? 'ready'
      : resource.status === 'loading'
        ? 'checking'
        : resource.kind === 'unavailable'
          ? 'denied'
          : 'error',
    refresh,
    rejectAccess,
  );
  const main = useRef<HTMLElement>(null);
  const status = access.status === 'ready' ? resource.status : access.status;
  const loading = access.status === 'ready' && resource.status === 'loading';

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [status]);

  return (
    <StaffFrame
      mainRef={main}
      loading={loading || startForm.pending}
      onRefresh={access.status === 'ready' ? refresh : undefined}
    >
      {access.status !== 'ready' ? (
        <StaffAccessState state={access.status} />
      ) : resource.status === 'loading' ? (
        <StaffAccessState state="loading" />
      ) : resource.status === 'error' ? (
        <StaffAccessState
          state={resource.kind}
          message={resource.message}
          onRetry={refresh}
        />
      ) : (
        <StaffHome
          context={resource.data}
          startCard={
            <StaffStartCard context={resource.data} form={startForm} />
          }
        />
      )}
    </StaffFrame>
  );
}
