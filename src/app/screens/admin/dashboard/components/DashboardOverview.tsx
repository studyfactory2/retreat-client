import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AdminDashboardDto } from '../../../../features/admin-dashboard/admin-dashboard.types';
import { DashboardChecklistSummary } from './DashboardChecklistSummary';
import '../styles/dashboard-overview.css';

type DashboardOverviewProps = {
  data: AdminDashboardDto;
  calendarLink: string;
  issueLinks: { new: string; inProgress: string };
  maintenanceLinks: { started: string; completed: string; unfinished: string };
  children?: ReactNode;
};

type MetricIconName = 'arrival' | 'departure' | 'maintenance' | 'issue';

function MetricIcon({ name }: { name: MetricIconName }) {
  const paths = {
    arrival: <path d="M15 3h5v18h-5M3 12h12m-5-5 5 5-5 5" />,
    departure: <path d="M9 3H4v18h5m2-9h10m-5-5 5 5-5 5" />,
    maintenance: (
      <>
        <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
        <rect x="9" y="2" width="6" height="4" rx="1" />
        <path d="m8 13 3 3 5-6" />
      </>
    ),
    issue: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="dashboard-count">
      <strong>{value.toLocaleString('ko-KR')}</strong>
      <span>건</span>
    </span>
  );
}

function Metric({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: number;
  note: string;
  icon: MetricIconName;
}) {
  return (
    <article className={`dashboard-metric dashboard-metric--${icon}`}>
      <div className="dashboard-metric__heading">
        <h2>{title}</h2>
        <MetricIcon name={icon} />
      </div>
      <Count value={value} />
      <p>{note}</p>
    </article>
  );
}

function RecordRow({
  label,
  value,
  to,
  attention = false,
}: {
  label: string;
  value: number;
  to: string;
  attention?: boolean;
}) {
  return (
    <Link
      className={`dashboard-operation-row${attention && value > 0 ? ' dashboard-operation-row--attention' : ''}`}
      to={to}
    >
      <span>{label}</span>
      <Count value={value} />
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export function DashboardOverview({
  data,
  calendarLink,
  maintenanceLinks,
  issueLinks,
  children,
}: DashboardOverviewProps) {
  const unfinished = data.maintenance.unfinished;
  const dayLabel = data.date === data.today ? '오늘' : '선택일';
  const hasNewIssues = data.issues.new > 0;

  return (
    <div className="dashboard-overview">
      <section className="dashboard-metrics" aria-label="운영 요약">
        <Metric
          title={`${dayLabel} 입실`}
          value={data.stays.arrivals}
          note={`입실 체크 ${data.checklists.checkIn.submitted.toLocaleString('ko-KR')}건 제출`}
          icon="arrival"
        />
        <Metric
          title={`${dayLabel} 퇴실`}
          value={data.stays.departures}
          note={`퇴실 체크 ${data.checklists.checkOut.submitted.toLocaleString('ko-KR')}건 제출`}
          icon="departure"
        />
        <Metric
          title="정비 완료"
          value={data.maintenance.completed}
          note={`${dayLabel} 제출 기록 기준`}
          icon="maintenance"
        />
        <Metric
          title="미처리 이상사항"
          value={data.issues.total}
          note="전체 날짜 · 현재"
          icon="issue"
        />
      </section>

      {data.issues.total > 0 && (
        <aside
          className="dashboard-attention"
          aria-labelledby="dashboard-attention-title"
        >
          <div className="dashboard-attention__copy">
            <h2 id="dashboard-attention-title">확인이 필요한 이상사항</h2>
            <p>
              신규 접수 {data.issues.new.toLocaleString('ko-KR')}건 · 처리 중{' '}
              {data.issues.inProgress.toLocaleString('ko-KR')}건
            </p>
          </div>
          <Link to={hasNewIssues ? issueLinks.new : issueLinks.inProgress}>
            {hasNewIssues ? '접수 보기' : '처리 중 보기'}
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      )}

      {children}

      <details className="dashboard-aggregate">
        <summary>
          <span>집계 상세</span>
          <span className="dashboard-disclosure-icon" aria-hidden="true" />
        </summary>
        <div className="dashboard-aggregate__content">
          <section aria-labelledby="dashboard-checklist-detail-title">
            <div className="dashboard-section-heading">
              <h2 id="dashboard-checklist-detail-title">
                {dayLabel} 체크리스트
              </h2>
              <Link to={calendarLink}>
                전체 일정 <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="dashboard-checklists">
              <DashboardChecklistSummary
                title="입실 체크리스트"
                counts={data.checklists.checkIn}
                calendarLink={calendarLink}
              />
              <DashboardChecklistSummary
                title="퇴실 체크리스트"
                counts={data.checklists.checkOut}
                calendarLink={calendarLink}
              />
            </div>
          </section>

          <div className="dashboard-aggregate__operations">
            <section
              className="dashboard-panel"
              aria-labelledby="dashboard-maintenance-summary-heading"
            >
              <div className="dashboard-panel__heading">
                <h3 id="dashboard-maintenance-summary-heading">
                  {dayLabel} 정비 기록
                </h3>
                <span>선택일 기준</span>
              </div>
              <RecordRow
                label="작성 시작"
                value={data.maintenance.started}
                to={maintenanceLinks.started}
              />
              <RecordRow
                label="정비 완료"
                value={data.maintenance.completed}
                to={maintenanceLinks.completed}
              />
              <RecordRow
                label="제출 기록 확인 필요"
                value={data.maintenance.completionNeedsReview}
                to={maintenanceLinks.completed}
                attention
              />
            </section>
            <section
              className="dashboard-panel"
              aria-labelledby="dashboard-issues-heading"
            >
              <div className="dashboard-panel__heading">
                <h3 id="dashboard-issues-heading">미처리 이상사항</h3>
                <Count value={data.issues.total} />
              </div>
              <p className="dashboard-panel__scope">전체 날짜 · 현재</p>
              <RecordRow
                label="신규 접수"
                value={data.issues.new}
                to={issueLinks.new}
                attention
              />
              <RecordRow
                label="처리 중"
                value={data.issues.inProgress}
                to={issueLinks.inProgress}
              />
            </section>
          </div>

          <section
            className="dashboard-panel"
            aria-labelledby="dashboard-unfinished-heading"
          >
            <div className="dashboard-panel__heading">
              <h3 id="dashboard-unfinished-heading">미완료 정비</h3>
              <Count value={unfinished.total} />
            </div>
            <p className="dashboard-panel__scope">전체 날짜 · 현재</p>
            <dl className="dashboard-unfinished">
              {[
                ['이어서 작성 가능', unfinished.resumable],
                ['작성 기한 만료', unfinished.expired],
                ['접근 불가', unfinished.accessBlocked],
                ['확인 필요', unfinished.needsReview],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <Count value={Number(value)} />
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              className="dashboard-panel__link"
              to={maintenanceLinks.unfinished}
            >
              미완료 기록 보기 <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </details>

      <details className="dashboard-counting-note">
        <summary>집계 기준</summary>
        <p>
          입·퇴실은 등록된 예정 일정이며 실제 이용 여부와 다를 수 있습니다.
          입·퇴실 체크와 정비 완료는 선택한 날짜 기준, 미처리 이상사항과 미완료
          정비는 전체 날짜의 현재 상태입니다.
        </p>
        <p>
          모든 날짜는 한국 시간 기준입니다. 과거 날짜도 현재 저장된 제출
          내역으로 표시하며, 전체 휴양소에는 비활성 휴양소도 포함됩니다.
        </p>
        <p>
          정비는 작업 횟수가 아닌 기록 수입니다. 작성 시작일과 제출일은 다를 수
          있으며, 정비 완료와 확인 필요는 별도로 집계합니다. 제출 기록 목록에는
          확인 필요한 기록도 함께 표시됩니다.
        </p>
      </details>
    </div>
  );
}
