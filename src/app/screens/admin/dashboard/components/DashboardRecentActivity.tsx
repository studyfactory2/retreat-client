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

function MaintenanceMark() {
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
        <path d="m14 6 4 4 3-3a6 6 0 0 1-8 8l-6 6a2.1 2.1 0 0 1-3-3l6-6a6 6 0 0 1 8-8l-4 2Z" />
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
            <MaintenanceMark />
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
                  제출 내용 <span aria-hidden="true">→</span>
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
    <ul className="dashboard-activity__list dashboard-activity__list--submissions">
      {items.map((item) => {
        const answerLabel =
          item.status === 'CANCELLED'
            ? '제출 취소'
            : item.abnormalItemCount > 0
              ? `이상 응답 ${item.abnormalItemCount.toLocaleString('ko-KR')}개`
              : '이상 응답 없음';
        return (
          <li key={item.id}>
            <Link
              className="dashboard-activity__submission-row"
              to={`/admin/submissions/${item.id}${returnSearch}`}
              aria-label={`${item.property.name}, ${item.author.name} ${submissionTypeLabel[item.type]}, ${submissionTime(item.submittedAt)}, ${answerLabel} · 제출 기록 보기`}
            >
              <span className="dashboard-activity__list-content">
                <strong className="dashboard-activity__submission-title">
                  {item.property.name}
                </strong>
                <span className="dashboard-activity__list-meta">
                  <b>{submissionTypeLabel[item.type]}</b>
                  <span>{item.author.name}</span>
                  <time dateTime={item.submittedAt}>
                    {submissionTime(item.submittedAt)}
                  </time>
                </span>
              </span>
              <span className="dashboard-activity__submission-end">
                <span
                  className={`dashboard-activity__badge dashboard-activity__badge--${item.status === 'CANCELLED' ? 'red' : item.abnormalItemCount > 0 ? 'amber' : 'quiet'}`}
                >
                  {answerLabel}
                </span>
                <span className="dashboard-activity__chevron" aria-hidden="true">
                  ›
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
