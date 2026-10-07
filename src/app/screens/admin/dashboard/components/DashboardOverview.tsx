import { Link } from 'react-router-dom';
import type { AdminDashboardDto } from '../../../../features/admin-dashboard/admin-dashboard.types';
import { DashboardChecklistSummary } from './DashboardChecklistSummary';
import '../styles/dashboard-overview.css';

type DashboardOverviewProps = {
  data: AdminDashboardDto;
  calendarLink: string;
  issueLinks: { new: string; inProgress: string };
  maintenanceLinks: { started: string; completed: string; unfinished: string };
};

function Count({ value }: { value: number }) {
  return (
    <span className="dashboard-count">
      <strong>{value.toLocaleString('ko-KR')}</strong>
      <span>건</span>
    </span>
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
}: DashboardOverviewProps) {
  const unfinished = data.maintenance.unfinished;
  const isToday = data.date === data.today;
  return (
    <div className="dashboard-overview">
      <section
        className="dashboard-day"
        aria-labelledby="dashboard-selected-day"
      >
        <div className="dashboard-section-heading">
          <h2 id="dashboard-selected-day">
            {isToday ? '오늘의 일정' : '선택일 일정'}
          </h2>
          <time dateTime={data.date}>{data.date.replaceAll('-', '.')}</time>
        </div>
        <div className="dashboard-checklists">
          <DashboardChecklistSummary
            title="입실 예정"
            counts={data.checklists.checkIn}
            calendarLink={calendarLink}
          />
          <DashboardChecklistSummary
            title="퇴실 예정"
            counts={data.checklists.checkOut}
            calendarLink={calendarLink}
          />
        </div>
        <div className="dashboard-day__note">
          <p>등록된 일정 기준 · 실제 입·퇴실 여부와 다를 수 있습니다.</p>
          <Link to={calendarLink}>
            일정 전체 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <section
          className="dashboard-panel dashboard-maintenance"
          aria-labelledby="dashboard-maintenance-heading"
        >
          <div className="dashboard-panel__heading">
            <h3 id="dashboard-maintenance-heading">
              {isToday ? '오늘의 정비 기록' : '선택일 정비 기록'}
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
          {data.maintenance.started === 0 &&
            data.maintenance.completed === 0 &&
            data.maintenance.completionNeedsReview === 0 && (
              <p className="dashboard-empty">
                선택한 날짜의 정비 기록이 없습니다.
              </p>
            )}
        </section>
      </section>
      <section
        className="dashboard-current"
        aria-labelledby="dashboard-current-heading"
      >
        <div className="dashboard-section-heading">
          <h2 id="dashboard-current-heading">지금 확인할 업무</h2>
          <span className="dashboard-scope">전체 날짜 · 현재</span>
        </div>
        <section
          className="dashboard-panel"
          aria-labelledby="dashboard-issues-heading"
        >
          <div className="dashboard-panel__heading">
            <h3 id="dashboard-issues-heading">미처리 이상사항</h3>
            <Count value={data.issues.total} />
          </div>
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
          {data.issues.total === 0 && (
            <p className="dashboard-empty">미처리 이상사항이 없습니다.</p>
          )}
        </section>
        <section
          className="dashboard-panel"
          aria-labelledby="dashboard-unfinished-heading"
        >
          <div className="dashboard-panel__heading">
            <h3 id="dashboard-unfinished-heading">미완료 정비</h3>
            <Count value={unfinished.total} />
          </div>
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
          {unfinished.total === 0 && (
            <p className="dashboard-empty">미완료 정비 기록이 없습니다.</p>
          )}
          <Link
            className="dashboard-panel__link"
            to={maintenanceLinks.unfinished}
          >
            미완료 기록 보기 <span aria-hidden="true">→</span>
          </Link>
        </section>
        <p className="dashboard-current__note">
          이전 날짜에 남은 업무도 포함합니다.
        </p>
      </section>
      <details className="dashboard-counting-note">
        <summary>집계 기준</summary>
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
