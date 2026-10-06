import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffAccessState } from './components/StaffAccessState';
import { StaffFrame } from './components/StaffFrame';
import { StaffHome } from './components/StaffHome';
import { useStaffEntry } from './hooks/use-staff-entry';
import { readStaffAccess } from './model/staff-entry-model';
import './styles/staff-entry.css';

export function StaffEntryScreen() {
  const location = useLocation();
  const access = readStaffAccess(location.hash);
  const { resource, refresh } = useStaffEntry(
    access.status === 'ready' ? access.token : null,
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
      loading={loading}
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
        <StaffHome context={resource.data} />
      )}
    </StaffFrame>
  );
}
