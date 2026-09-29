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
        <thead>
          <tr>
            <th scope="col">휴양소 / 기록 직원</th>
            <th scope="col">현재 상태</th>
            <th scope="col">작성 기록</th>
            <th scope="col">제출 / 작성 기한</th>
            <th scope="col">상세</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = maintenanceStatuses[item.status];
            return (
              <tr key={item.id}>
                <td>
                  <strong className="maintenance-property-name">
                    {item.property.name}
                  </strong>
                  <p className="maintenance-row-muted">
                    {item.property.region ?? '지역 미등록'}
                    {!item.property.isActive && ' · 현재 비활성'}
                  </p>
                  <p className="maintenance-staff">
                    <span>기록 직원</span> {item.staff.name ?? '확인 필요'}
                  </p>
                </td>
                <td>
                  <span
                    className={`maintenance-status maintenance-status--${status.tone}`}
                  >
                    {status.label}
                  </span>
                  <p className="maintenance-row-muted">{status.description}</p>
                  {item.reviewReasons.length > 0 && (
                    <ul className="maintenance-reasons" aria-label="확인 사유">
                      {item.reviewReasons.map((reason) => (
                        <li key={reason}>{maintenanceReasons[reason]}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
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
                  </dl>
                </td>
                <td>
                  <dl className="maintenance-times">
                    <div>
                      <dt>제출</dt>
                      <dd>
                        <RecordTime value={item.submittedAt} />
                      </dd>
                    </div>
                    {item.status !== 'COMPLETED' && (
                      <div>
                        <dt>작성 기한</dt>
                        <dd>
                          <RecordTime value={item.expiresAt} />
                        </dd>
                      </div>
                    )}
                  </dl>
                </td>
                <td>
                  {item.status === 'COMPLETED' ? (
                    <Link
                      className="maintenance-detail-link"
                      to={maintenanceDetailPath(item.id, filters)}
                      aria-label={`${item.property.name} ${item.staff.name ?? ''} 체크리스트·사진 보기`}
                    >
                      체크리스트·사진 <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="maintenance-row-muted">
                      {item.status === 'NEEDS_REVIEW'
                        ? '기록 확인 필요'
                        : '아직 제출되지 않음'}
                    </span>
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
