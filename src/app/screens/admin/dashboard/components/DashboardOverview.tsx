import { Link } from 'react-router-dom';
import type {
  AdminDashboardDto,
  DashboardChecklistCounts,
} from '../../../../features/admin-dashboard/admin-dashboard.types';
import '../styles/dashboard-overview.css';

type DashboardOverviewProps = {
  data: AdminDashboardDto;
  issueLinks: { new: string; inProgress: string };
  maintenanceLinks: {
    started: string;
    completed: string;
    unfinished: string;
  };
};

type MetricIconName = 'arrival' | 'departure' | 'maintenance' | 'complete';

function MetricIcon({ name }: { name: MetricIconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'arrival' && (
        <>
          <path d="M14 3h6v18h-6M3 12h12m-4-4 4 4-4 4" />
        </>
      )}
      {name === 'departure' && (
        <>
          <path d="M10 3H4v18h6m0-9h11m-4-4 4 4-4 4" />
        </>
      )}
      {name === 'maintenance' && (
        <path d="M14 6a5 5 0 0 0-6 6L3 17a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z" />
      )}
      {name === 'complete' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
    </svg>
  );
}

function formatCount(value: number) {
  return value.toLocaleString('ko-KR');
}

function ChecklistSummary({
  title,
  description,
  counts,
}: {
  title: string;
  description: string;
  counts: DashboardChecklistCounts;
}) {
  const statuses = [
    { label: '작성 예정', count: counts.scheduled, tone: 'muted' },
    { label: '미제출', count: counts.notSubmitted, tone: 'amber' },
    { label: '제출 완료', count: counts.submitted, tone: 'blue' },
    { label: '확인 필요', count: counts.needsReview, tone: 'red' },
  ];

  return (
    <article className="dashboard-checklist">
      <div className="dashboard-checklist__heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="dashboard-checklist__total">
          총 <strong>{formatCount(counts.total)}</strong>건
        </span>
      </div>
      <dl className="dashboard-checklist__counts">
        {statuses.map(({ label, count, tone }) => (
          <div key={label} className={`dashboard-checklist__status--${tone}`}>
            <dt>{label}</dt>
            <dd>
              {formatCount(count)}
              <span>건</span>
            </dd>
          </div>
        ))}
      </dl>
      {counts.total === 0 && (
        <p className="dashboard-checklist__empty">
          선택한 날짜에 대상 이용 일정이 없습니다.
        </p>
      )}
    </article>
  );
}

export function DashboardOverview({
  data,
  maintenanceLinks,
  issueLinks,
}: DashboardOverviewProps) {
  const metrics = [
    {
      label: '입실 예정',
      count: data.stays.arrivals,
      description: '선택일에 입실하는 이용 일정',
      icon: 'arrival' as const,
    },
    {
      label: '퇴실 예정',
      count: data.stays.departures,
      description: '선택일에 퇴실하는 이용 일정',
      icon: 'departure' as const,
    },
    {
      label: '정비 시작',
      count: data.maintenance.started,
      description: '선택일에 작성을 시작한 기록',
      icon: 'maintenance' as const,
      link: {
        to: maintenanceLinks.started,
        label: '시작한 기록 보기',
        accessibleLabel: `${data.date} 정비: 시작한 기록 보기`,
      },
    },
    {
      label: '정비 완료',
      count: data.maintenance.completed,
      description: `확인 필요 ${formatCount(data.maintenance.completionNeedsReview)}건 별도`,
      icon: 'complete' as const,
      link: {
        to: maintenanceLinks.completed,
        label: '제출 기록 보기 · 확인 필요 포함',
        accessibleLabel: `${data.date} 정비: 제출 기록 보기 · 확인 필요 포함`,
      },
    },
  ];
  const unfinished = data.maintenance.unfinished;
  const noActivity =
    metrics.every((metric) => metric.count === 0) &&
    data.maintenance.completionNeedsReview === 0;

  return (
    <div className="dashboard-overview">
      <section aria-labelledby="dashboard-selected-day">
        <div className="dashboard-overview__section-heading">
          <h2 id="dashboard-selected-day">선택일의 운영</h2>
          <span className="dashboard-overview__date">
            <time dateTime={data.date}>{data.date.replaceAll('-', '.')}</time>
          </span>
        </div>
        <div className="dashboard-metrics">
          {metrics.map((metric) => (
            <article className="dashboard-metric" key={metric.label}>
              <div className="dashboard-metric__heading">
                <h3>{metric.label}</h3>
                <span className="dashboard-metric__icon">
                  <MetricIcon name={metric.icon} />
                </span>
              </div>
              <p className="dashboard-metric__value">
                <strong>{formatCount(metric.count)}</strong>
                <span>건</span>
              </p>
              <p className="dashboard-metric__description">
                {metric.description}
              </p>
              {metric.link && (
                <Link
                  className="dashboard-record-link"
                  to={metric.link.to}
                  aria-label={metric.link.accessibleLabel}
                >
                  <span>{metric.link.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </article>
          ))}
        </div>
        {noActivity && (
          <p className="dashboard-overview__no-activity">
            선택한 날짜에 이용 일정과 정비 기록이 없습니다.
          </p>
        )}
      </section>

      <section aria-labelledby="dashboard-checklists">
        <div className="dashboard-overview__section-heading">
          <h2 id="dashboard-checklists">입·퇴실 체크리스트</h2>
          <p>선택일 이용 일정의 제출 현황</p>
        </div>
        <div className="dashboard-checklists">
          <ChecklistSummary
            title="입실 체크"
            description="입실 예정 일정을 기준으로 확인합니다."
            counts={data.checklists.checkIn}
          />
          <ChecklistSummary
            title="퇴실 체크"
            description="퇴실 예정 일정을 기준으로 확인합니다."
            counts={data.checklists.checkOut}
          />
        </div>
        <p className="dashboard-overview__evidence-note">
          입·퇴실은 등록된 일정 기준입니다. 과거 날짜도 현재 확인 가능한 제출
          내역을 반영합니다.
        </p>
      </section>

      <section
        className="dashboard-current"
        aria-labelledby="dashboard-current-heading"
      >
        <div className="dashboard-overview__section-heading dashboard-current__heading">
          <div>
            <span className="dashboard-current__eyebrow">CURRENT STATUS</span>
            <h2 id="dashboard-current-heading">현재 확인할 업무</h2>
          </div>
          <p>선택한 날짜와 관계없이, 조회 시점에 남아 있는 기록입니다.</p>
        </div>
        <div className="dashboard-current__grid">
          <article className="dashboard-current__card">
            <div className="dashboard-current__card-heading">
              <div>
                <h3>미완료 정비 기록</h3>
                <p>아직 제출되지 않은 정비 기록</p>
              </div>
              <p className="dashboard-current__total">
                <strong>{formatCount(unfinished.total)}</strong>
                <span>건</span>
              </p>
            </div>
            <dl className="dashboard-current__breakdown">
              <div>
                <dt>이어서 작성 가능</dt>
                <dd>
                  {formatCount(unfinished.resumable)}
                  <span>건</span>
                </dd>
              </div>
              <div>
                <dt>작성 기한 만료</dt>
                <dd>
                  {formatCount(unfinished.expired)}
                  <span>건</span>
                </dd>
              </div>
              <div>
                <dt>접근 불가</dt>
                <dd>
                  {formatCount(unfinished.accessBlocked)}
                  <span>건</span>
                </dd>
              </div>
              <div>
                <dt>확인 필요</dt>
                <dd>
                  {formatCount(unfinished.needsReview)}
                  <span>건</span>
                </dd>
              </div>
            </dl>
            {unfinished.total === 0 && (
              <p className="dashboard-current__empty">
                남아 있는 미완료 정비 기록이 없습니다.
              </p>
            )}
            <Link
              className="dashboard-record-link"
              to={maintenanceLinks.unfinished}
              aria-label="정비: 현재 미완료 기록 보기 · 날짜 제한 없음"
            >
              <span>현재 미완료 기록 보기</span>
              <span aria-hidden="true">→</span>
            </Link>
          </article>

          <article className="dashboard-current__card">
            <div className="dashboard-current__card-heading">
              <div>
                <h3>미처리 이상사항</h3>
                <p>접수 후 처리가 끝나지 않은 신고</p>
              </div>
              <p className="dashboard-current__total">
                <strong>{formatCount(data.issues.total)}</strong>
                <span>건</span>
              </p>
            </div>
            <dl className="dashboard-current__issues">
              <div>
                <dt>
                  <span className="dashboard-current__dot dashboard-current__dot--new" />
                  신규 접수
                </dt>
                <dd>
                  {formatCount(data.issues.new)}
                  <span>건</span>
                </dd>
              </div>
              <div>
                <dt>
                  <span className="dashboard-current__dot dashboard-current__dot--progress" />
                  조치 중
                </dt>
                <dd>
                  {formatCount(data.issues.inProgress)}
                  <span>건</span>
                </dd>
              </div>
            </dl>
            <div className="dashboard-issue-links">
              <Link
                className="dashboard-record-link"
                to={issueLinks.new}
                aria-label="이상사항: 신규 접수 보기 · 날짜 제한 없음"
              >
                <span>신규 접수 보기</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                className="dashboard-record-link"
                to={issueLinks.inProgress}
                aria-label="이상사항: 조치 중 보기 · 날짜 제한 없음"
              >
                <span>조치 중 보기</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {data.issues.total === 0 && (
              <p className="dashboard-current__empty">
                현재 미처리 이상사항이 없습니다.
              </p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
