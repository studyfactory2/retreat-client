import { Link } from 'react-router-dom';
import type {
  AdminMaintenanceInput,
  AdminMaintenanceItem,
} from '../../../../features/admin-maintenance/admin-maintenance.types';
import type { AdminSubmissionSummary } from '../../../../features/admin-submissions/admin-submissions.types';
import { maintenanceDetailPath } from '../../maintenance/model/maintenance-navigation';
import {
  maintenanceReasons,
  maintenanceStatuses,
} from '../../maintenance/model/maintenance-presentation';
import {
  submissionTime,
  submissionTypeLabel,
} from '../../submissions/model/submission-list-model';

function ActivityMark({ maintenance }: { maintenance?: boolean }) {
  return (
    <span className="dashboard-activity__mark" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {maintenance ? (
          <path d="m14 6 4 4 3-3a6 6 0 0 1-8 8l-6 6a2.1 2.1 0 0 1-3-3l6-6a6 6 0 0 1 8-8l-4 2Z" />
        ) : (
          <>
            <path d="M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="m8 13 3 3 5-6" />
          </>
        )}
      </svg>
    </span>
  );
}

export function DashboardMaintenanceActivity({
  items,
  input,
}: {
  items: AdminMaintenanceItem[];
  input: AdminMaintenanceInput;
}) {
  return (
    <ul className="dashboard-activity__list">
      {items.map((item) => {
        const status = maintenanceStatuses[item.status];
        return (
          <li key={item.id}>
            <ActivityMark maintenance />
            <div className="dashboard-activity__list-content">
              <div className="dashboard-activity__list-topline">
                <strong>{item.property.name}</strong>
                <span
                  className={`dashboard-activity__badge dashboard-activity__badge--${status.tone}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="dashboard-activity__list-meta">
                <span>{item.staff.name ?? '담당자 정보 없음'}</span>
                {item.startedAt && (
                  <time dateTime={item.startedAt}>
                    {submissionTime(item.startedAt)}
                  </time>
                )}
              </p>
              {!item.property.isActive &&
                !item.reviewReasons.includes('PROPERTY_INACTIVE') && (
                  <p className="dashboard-activity__inactive">비활성 휴양소</p>
                )}
              {item.reviewReasons.length > 0 && (
                <p className="dashboard-activity__review-note">
                  {item.reviewReasons
                    .map((reason) => maintenanceReasons[reason])
                    .join(' · ')}
                </p>
              )}
              {item.status === 'COMPLETED' && (
                <Link
                  className="dashboard-activity__record-link"
                  to={maintenanceDetailPath(item.id, input)}
                  aria-label={`${item.property.name}, ${item.staff.name ?? ''} 정비 제출 내용 보기`}
                >
                  제출 내용 <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardSubmissionActivity({
  items,
  returnSearch,
}: {
  items: AdminSubmissionSummary[];
  returnSearch: string;
}) {
  return (
    <ul className="dashboard-activity__list">
      {items.map((item) => (
        <li key={item.id}>
          <ActivityMark />
          <div className="dashboard-activity__list-content">
            <div className="dashboard-activity__list-topline">
              <Link
                className="dashboard-activity__submission-title"
                to={`/admin/submissions/${item.id}${returnSearch}`}
                aria-label={`${item.property.name}, ${item.author.name} ${submissionTypeLabel[item.type]} 제출 기록 보기`}
              >
                {item.property.name} · {submissionTypeLabel[item.type]}
              </Link>
              <span
                className={`dashboard-activity__badge dashboard-activity__badge--${item.status === 'CANCELLED' ? 'red' : item.abnormalItemCount > 0 ? 'amber' : 'green'}`}
              >
                {item.status === 'CANCELLED'
                  ? '제출 취소'
                  : item.abnormalItemCount > 0
                    ? `이상 응답 ${item.abnormalItemCount.toLocaleString('ko-KR')}개`
                    : '이상 응답 없음'}
              </span>
            </div>
            <p className="dashboard-activity__list-meta">
              <span>{item.author.name}</span>
              <time dateTime={item.submittedAt}>
                {submissionTime(item.submittedAt)}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
