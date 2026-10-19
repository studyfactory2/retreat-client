import type { RefObject } from 'react';
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
  return value ? <time dateTime={value}>{maintenanceTime(value)}</time> : <span>기록 없음</span>;
}

export function MaintenanceRecordPanel({ id, item, filters, backButton, onBack }: {
  id: string;
  item: AdminMaintenanceItem;
  filters: AdminMaintenanceInput;
  backButton: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
}) {
  const status = maintenanceStatuses[item.status];
  return (
    <section className="maintenance-record-panel" id={id} aria-labelledby={`${id}-title`}>
      <div className="maintenance-record-panel__top">
        <span className="maintenance-record-eyebrow">기록 정보</span>
        <button type="button" className="maintenance-record-back" ref={backButton} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h14" /></svg>
          목록
        </button>
        <span className={`maintenance-status maintenance-status--${status.tone}`}>{status.label}</span>
      </div>
      <header className="maintenance-record-panel__heading" aria-live="polite" aria-atomic="true">
        <h3 id={`${id}-title`}>{item.property.name}</h3>
        <p>{item.property.region ?? '지역 미등록'}</p>
        {!item.property.isActive && <span className="maintenance-inactive">비활성 휴양소</span>}
      </header>
      <dl className="maintenance-record-facts">
        <div><dt>기록 직원</dt><dd>{item.staff.name ?? '직원 확인 필요'}</dd></div>
        <div><dt>작성 시작</dt><dd><RecordTime value={item.startedAt} /></dd></div>
        <div><dt>마지막 저장</dt><dd><RecordTime value={item.updatedAt} /></dd></div>
        <div><dt>제출 일시</dt><dd><RecordTime value={item.submittedAt} /></dd></div>
        <div><dt>작성 기한</dt><dd><RecordTime value={item.expiresAt} /></dd></div>
      </dl>
      {item.reviewReasons.length > 0 ? (
        <div className="maintenance-record-review">
          <h4>확인 사유</h4>
          <ul>{item.reviewReasons.map((reason) => <li key={reason}>{maintenanceReasons[reason]}</li>)}</ul>
          <p>{status.description}</p>
        </div>
      ) : item.status !== 'COMPLETED' ? (
        <p className="maintenance-record-description">{status.description}</p>
      ) : null}
      <footer className="maintenance-record-panel__footer">
        <span>한국 시간</span>
        {item.status === 'COMPLETED' && (
          <Link
            className="maintenance-detail-link"
            to={maintenanceDetailPath(item.id, filters)}
            aria-label={`${item.property.name}, ${item.staff.name ?? '직원 확인 필요'} 정비 제출 내용 상세 보기`}
          >
            점검 보기
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </Link>
        )}
      </footer>
    </section>
  );
}
