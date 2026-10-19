import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type { AdminMaintenanceInput } from '../../../../features/admin-maintenance/admin-maintenance.types';
import { maintenanceSearch } from '../../maintenance/model/maintenance-filters';
import { scheduleListSearch } from '../../schedule/model/schedule-list-model';
import { submissionListSearch } from '../../submissions/model/submission-list-model';
import {
  useDashboardActivity,
  type DashboardActivityResource,
} from '../hooks/use-dashboard-activity';
import { DashboardStayActivity } from './DashboardStayActivity';
import {
  DashboardMaintenanceActivity,
  DashboardSubmissionActivity,
} from './DashboardRecentActivity';
import '../styles/dashboard-activity.css';

const STAY_PREVIEW_SIZE = 3;
const RECORD_PREVIEW_SIZE = 3;

function ActivityHeading({
  id,
  title,
  subtitle,
  total,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  subtitle: string;
  total?: number;
  href: string;
  linkLabel: string;
}) {
  return (
    <header className="dashboard-activity__heading">
      <div>
        <h2 id={id}>
          {title}
          {total !== undefined && (
            <span className="dashboard-activity__count">
              {total.toLocaleString('ko-KR')}건
            </span>
          )}
        </h2>
        <p>{subtitle}</p>
      </div>
      <Link
        className="dashboard-activity__all-link"
        to={href}
        aria-label={`${title} 전체 보기`}
      >
        {linkLabel} <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}

function ActivityState({
  resource,
  label,
  empty,
  onRetry,
}: {
  resource: DashboardActivityResource<unknown>;
  label: string;
  empty: string;
  onRetry: () => void;
}) {
  if (resource.status === 'loading')
    return (
      <div className="dashboard-activity__state" role="status">
        <span className="dashboard-activity__loading-dot" aria-hidden="true" />
        <p>{label}을 불러오고 있습니다.</p>
      </div>
    );
  if (resource.status === 'error')
    return (
      <div
        className="dashboard-activity__state dashboard-activity__state--error"
        role="alert"
      >
        <p>{resource.message}</p>
        <button
          type="button"
          onClick={onRetry}
          aria-label={`${label} 다시 불러오기`}
        >
          다시 불러오기
        </button>
      </div>
    );
  return (
    <div className="dashboard-activity__state dashboard-activity__state--empty">
      <p>{empty}</p>
    </div>
  );
}

function PreviewCount({
  total,
  displayed,
  recent,
}: {
  total: number;
  displayed: number;
  recent?: boolean;
}) {
  if (total <= displayed) return null;
  return (
    <p className="dashboard-activity__preview-count">
      전체 {total.toLocaleString('ko-KR')}건 중 {recent ? '최근 ' : ''}
      {displayed.toLocaleString('ko-KR')}건
    </p>
  );
}

export function DashboardActivity({
  date,
  today,
  propertyId,
  token,
  rejectSession,
}: {
  date: string;
  today: string;
  propertyId?: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { stays, maintenance, submissions } = useDashboardActivity(
    { date, today, propertyId },
    token,
    rejectSession,
  );
  const staySearch = scheduleListSearch({
    page: 1,
    date,
    from: date,
    to: date,
    propertyId,
  });
  const maintenanceInput: AdminMaintenanceInput = {
    page: 1,
    propertyId,
    dateField: 'STARTED',
    view: 'ALL',
    from: date,
    to: date,
  };
  const submissionSearch = submissionListSearch({
    page: 1,
    propertyId,
    status: 'SUBMITTED',
  });
  const stayData =
    stays.resource.status === 'ready' ? stays.resource.data : undefined;
  const maintenanceData =
    maintenance.resource.status === 'ready'
      ? maintenance.resource.data
      : undefined;
  const submissionData =
    submissions.resource.status === 'ready'
      ? submissions.resource.data
      : undefined;

  return (
    <div className="dashboard-activity">
      <section
        className="dashboard-activity__panel dashboard-activity__panel--stays"
        aria-labelledby="dashboard-stays-heading"
        aria-busy={stays.resource.status === 'loading'}
      >
        <ActivityHeading
          id="dashboard-stays-heading"
          title={date === today ? '오늘의 이용 일정' : '선택일 이용 일정'}
          subtitle={`${date.replaceAll('-', '. ')} · 한국 시간`}
          total={stayData?.total}
          href={appRoutes.adminCalendar + staySearch}
          linkLabel="전체 일정"
        />
        {stayData && stayData.items.length > 0 ? (
          <>
            <DashboardStayActivity
              items={stayData.items.slice(0, STAY_PREVIEW_SIZE)}
              returnSearch={staySearch}
            />
            <PreviewCount
              total={stayData.total}
              displayed={Math.min(STAY_PREVIEW_SIZE, stayData.items.length)}
            />
          </>
        ) : (
          <ActivityState
            resource={stays.resource}
            label="이용 일정"
            empty="선택일에 예정된 이용 일정이 없습니다."
            onRetry={stays.refresh}
          />
        )}
      </section>

      <div className="dashboard-activity__columns">
        <section
          className="dashboard-activity__panel"
          aria-labelledby="dashboard-maintenance-activity-heading"
          aria-busy={maintenance.resource.status === 'loading'}
        >
          <ActivityHeading
            id="dashboard-maintenance-activity-heading"
            title="정비 진행"
            subtitle="선택일 시작 기록"
            total={maintenanceData?.total}
            href={
              appRoutes.adminMaintenance + maintenanceSearch(maintenanceInput)
            }
            linkLabel="전체"
          />
          {maintenanceData && maintenanceData.items.length > 0 ? (
            <>
              <DashboardMaintenanceActivity
                items={maintenanceData.items.slice(0, RECORD_PREVIEW_SIZE)}
                input={maintenanceInput}
              />
              <PreviewCount
                total={maintenanceData.total}
                displayed={Math.min(
                  RECORD_PREVIEW_SIZE,
                  maintenanceData.items.length,
                )}
                recent
              />
            </>
          ) : (
            <ActivityState
              resource={maintenance.resource}
              label="정비 기록"
              empty="선택일에 시작한 정비 기록이 없습니다."
              onRetry={maintenance.refresh}
            />
          )}
        </section>

        <section
          className="dashboard-activity__panel"
          aria-labelledby="dashboard-submissions-heading"
          aria-busy={submissions.resource.status === 'loading'}
        >
          <ActivityHeading
            id="dashboard-submissions-heading"
            title="최근 제출"
            subtitle="전체 날짜"
            total={submissionData?.total}
            href={appRoutes.adminSubmissions + submissionSearch}
            linkLabel="전체"
          />
          {submissionData && submissionData.items.length > 0 ? (
            <>
              <DashboardSubmissionActivity
                items={submissionData.items.slice(0, RECORD_PREVIEW_SIZE)}
                returnSearch={submissionSearch}
              />
              <PreviewCount
                total={submissionData.total}
                displayed={Math.min(
                  RECORD_PREVIEW_SIZE,
                  submissionData.items.length,
                )}
                recent
              />
            </>
          ) : (
            <ActivityState
              resource={submissions.resource}
              label="제출 기록"
              empty="제출된 체크리스트가 없습니다."
              onRetry={submissions.refresh}
            />
          )}
        </section>
      </div>
    </div>
  );
}
