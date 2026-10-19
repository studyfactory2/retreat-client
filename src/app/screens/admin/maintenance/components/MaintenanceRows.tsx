import { Link } from 'react-router-dom';
import type {
  AdminMaintenanceInput,
  AdminMaintenanceItem,
} from '../../../../features/admin-maintenance/admin-maintenance.types';
import { maintenanceDetailPath } from '../model/maintenance-navigation';
import {
  maintenanceReasons,
  maintenanceStatuses,
  maintenanceTime,
} from '../model/maintenance-presentation';

const startFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function shortStart(value: string | null) {
  if (!value) return '시작 기록 없음';
  const parts = startFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('month')}.${part('day')} ${part('hour')}:${part('minute')}`;
}

function RecordTime({ value }: { value: string | null }) {
  return value ? (
    <time dateTime={value}>{maintenanceTime(value)}</time>
  ) : (
    <span>기록 없음</span>
  );
}

export function MaintenanceRows({
  items,
  filters,
}: {
  items: AdminMaintenanceItem[];
  filters: AdminMaintenanceInput;
}) {
  return (
    <div className="maintenance-table-wrap">
      <table className="maintenance-table" role="table">
        <caption className="maintenance-sr-only">
          청소·정비 기록. 선택한 날짜 기준 내림차순이며 날짜가 없는 기록은 마지막에
          표시됩니다.
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">휴양소</th>
            <th scope="col" role="columnheader">직원</th>
            <th scope="col" role="columnheader">작성 시작</th>
            <th scope="col" role="columnheader">제출 상태</th>
            <th scope="col" role="columnheader">
              <span className="maintenance-sr-only">제출 내용</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((item) => {
            const status = maintenanceStatuses[item.status];
            const startLabel = shortStart(item.startedAt);
            return (
              <tr key={item.id} role="row">
                <td className="maintenance-record-property" role="cell">
                  <strong className="maintenance-property-name">
                    {item.property.name}
                  </strong>
                  {!item.property.isActive && (
                    <span className="maintenance-inactive">비활성 휴양소</span>
                  )}
                </td>
                <td className="maintenance-record-staff" role="cell">
                  <span>{item.staff.name ?? '직원 확인 필요'}</span>
                </td>
                <td className="maintenance-record-start" role="cell">
                  <details className="maintenance-record-details">
                    <summary aria-label={`${startLabel}, 기록 시간과 지역 확인`}>
                      <span className="maintenance-start-label">작성 시작</span>
                      {item.startedAt ? (
                        <time dateTime={item.startedAt}>{startLabel}</time>
                      ) : <span>{startLabel}</span>}
                      <svg className="maintenance-disclosure-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </summary>
                    <dl className="maintenance-times">
                      <div><dt>작성 시작</dt><dd><RecordTime value={item.startedAt} /></dd></div>
                      <div><dt>마지막 저장</dt><dd><RecordTime value={item.updatedAt} /></dd></div>
                      <div><dt>제출</dt><dd><RecordTime value={item.submittedAt} /></dd></div>
                      <div><dt>작성 기한</dt><dd><RecordTime value={item.expiresAt} /></dd></div>
                      <div><dt>지역</dt><dd>{item.property.region ?? '지역 미등록'}</dd></div>
                    </dl>
                    <p className="maintenance-record-timezone">한국 시간 기준</p>
                  </details>
                </td>
                <td className="maintenance-record-status" role="cell">
                  <details className="maintenance-status-details">
                    <summary aria-label={`${status.label}, ${item.reviewReasons.length > 0 ? '확인 사유와 상태 설명 보기' : '상태 설명 보기'}`}>
                      <span className={`maintenance-status maintenance-status--${status.tone}`}>
                        {status.label}
                      </span>
                      <svg className="maintenance-disclosure-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </summary>
                    <div className="maintenance-status-explanation">
                      <p className="maintenance-status-description">{status.description}</p>
                      {item.reviewReasons.length > 0 && (
                        <ul className="maintenance-reasons" aria-label="확인 사유">
                          {item.reviewReasons.map((reason) => (
                            <li key={reason}>{maintenanceReasons[reason]}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                </td>
                <td className="maintenance-record-action" role="cell">
                  {item.status === 'COMPLETED' ? (
                    <Link
                      className="maintenance-detail-link"
                      to={maintenanceDetailPath(item.id, filters)}
                      aria-label={`${item.property.name}, ${item.staff.name ?? '직원 확인 필요'} 정비 제출 내용 상세 보기`}
                    >
                      <span aria-hidden="true">→</span> 보기
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
