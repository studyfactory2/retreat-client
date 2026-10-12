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
          청소·정비 기록. 날짜 기준 내림차순이며 날짜가 없는 기록은 마지막에
          표시됩니다.
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              휴양소 · 기록 직원
            </th>
            <th scope="col" role="columnheader">
              현재 상태
            </th>
            <th scope="col" role="columnheader">
              최근 기록
            </th>
            <th scope="col" role="columnheader">
              제출 내용
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((item) => {
            const status = maintenanceStatuses[item.status];
            return (
              <tr key={item.id} role="row">
                <td role="cell">
                  <strong className="maintenance-property-name">
                    {item.property.name}
                  </strong>
                  <div className="maintenance-property-meta">
                    <span className="maintenance-row-muted">
                      {item.property.region ?? '지역 미등록'}
                    </span>
                    {!item.property.isActive && (
                      <span className="maintenance-inactive">현재 비활성</span>
                    )}
                  </div>
                  <p className="maintenance-staff">
                    <span>기록 직원</span>
                    <strong>{item.staff.name ?? '확인 필요'}</strong>
                  </p>
                </td>
                <td role="cell">
                  <span
                    className={`maintenance-status maintenance-status--${status.tone}`}
                  >
                    {status.label}
                  </span>
                  <p className="maintenance-status-description">
                    {status.description}
                  </p>
                  {item.reviewReasons.length > 0 && (
                    <ul className="maintenance-reasons" aria-label="확인 사유">
                      {item.reviewReasons.map((reason) => (
                        <li key={reason}>{maintenanceReasons[reason]}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td role="cell">
                  <dl className="maintenance-latest-time">
                    <div>
                      <dt>
                        {item.status === 'COMPLETED' ? '제출' : '마지막 저장'}
                      </dt>
                      <dd>
                        <RecordTime
                          value={
                            item.status === 'COMPLETED'
                              ? item.submittedAt
                              : item.updatedAt
                          }
                        />
                      </dd>
                    </div>
                  </dl>
                  <details className="maintenance-record-details">
                    <summary>상세 정보</summary>
                    <dl className="maintenance-times">
                      <div>
                        <dt>작성 시작</dt>
                        <dd>
                          <RecordTime value={item.startedAt} />
                        </dd>
                      </div>
                      <div>
                        <dt>마지막 저장</dt>
                        <dd>
                          <RecordTime value={item.updatedAt} />
                        </dd>
                      </div>
                      <div>
                        <dt>제출</dt>
                        <dd>
                          <RecordTime value={item.submittedAt} />
                        </dd>
                      </div>
                      <div>
                        <dt>작성 기한</dt>
                        <dd>
                          <RecordTime value={item.expiresAt} />
                        </dd>
                      </div>
                    </dl>
                  </details>
                </td>
                <td role="cell">
                  {item.status === 'COMPLETED' ? (
                    <Link
                      className="maintenance-detail-link"
                      to={maintenanceDetailPath(item.id, filters)}
                      aria-label={`${item.property.name} ${item.staff.name ?? ''} 제출 내용 보기`}
                    >
                      <span>제출 내용 보기</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <p className="maintenance-detail-unavailable">
                      {item.status === 'NEEDS_REVIEW'
                        ? '상세 열람 불가'
                        : '아직 제출되지 않음'}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
