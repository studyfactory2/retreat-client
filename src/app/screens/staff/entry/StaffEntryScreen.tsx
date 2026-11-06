import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StaffAccessState } from './components/StaffAccessState';
import { StaffFrame } from './components/StaffFrame';
import { StaffHome } from './components/StaffHome';
import { StaffTaskList, type StaffTaskView } from './components/StaffTaskList';
import { StaffStartCard } from './components/StaffStartCard';
import { useStaffEntry } from './hooks/use-staff-entry';
import { useStaffStart } from './hooks/use-staff-start';
import { readStaffAccess } from './model/staff-entry-model';
import './styles/staff-entry.css';
import './styles/staff-start.css';

const initialTaskView: StaffTaskView = { showCompleted: false, page: 1 };

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
  const [taskView, setTaskView] = useState<{
    scope: string;
    view: StaffTaskView;
  }>();
  const taskScope =
    resource.status === 'ready' && resource.data.assignedStaff
      ? `${location.key}:${resource.data.property.id}:${resource.data.assignedStaff.id}`
      : '';
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
      onRefresh={
        resource.status === 'ready' && !resource.data.assignedStaff
          ? refresh
          : undefined
      }
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
            <>
              {resource.data.assignedStaff ? (
                <StaffTaskList
                  token={access.token}
                  context={resource.data}
                  rejectAccess={rejectAccess}
                  view={
                    taskView?.scope === taskScope
                      ? taskView.view
                      : initialTaskView
                  }
                  onViewChange={(view) =>
                    setTaskView({ scope: taskScope, view })
                  }
                  onRefreshContext={refresh}
                />
              ) : (
                <section
                  className="staff-task-card"
                  aria-labelledby="unassigned-tasks-title"
                >
                  <header className="staff-task-heading">
                    <h2 id="unassigned-tasks-title">정비 작업</h2>
                  </header>
                  <p className="staff-task-empty">
                    담당 직원 배정 후 작업을 시작할 수 있어요.
                  </p>
                </section>
              )}
              <details className="staff-entry-secondary">
                <summary>추가 정비 기록</summary>
                <StaffStartCard context={resource.data} form={startForm} />
              </details>
            </>
          }
        />
      )}
    </StaffFrame>
  );
}
