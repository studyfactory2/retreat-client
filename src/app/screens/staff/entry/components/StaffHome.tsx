import type { ReactNode } from 'react';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import { StaffChecklistPreview } from './StaffChecklistPreview';
import { StaffIcon } from './StaffIcon';

export function StaffHome({
  context,
  startCard,
}: {
  context: StaffQrContextDto;
  startCard: ReactNode;
}) {
  const { property, assignedStaff, checklists } = context;
  return (
    <>
      <section
        className="staff-entry-welcome"
        aria-labelledby="staff-home-title"
      >
        <div className="staff-entry-welcome__mark">
          <StaffIcon name="property" />
        </div>
        <p className="staff-entry-eyebrow">
          {property.region ?? '휴양소 정비 안내'}
        </p>
        <h1 id="staff-home-title">{property.name}</h1>
        <div className="staff-entry-assignee">
          <span>담당 직원</span>
          <strong>{assignedStaff?.name ?? '미배정'}</strong>
        </div>
        {!assignedStaff && (
          <p className="staff-entry-welcome__description">
            관리자에게 담당 직원 배정을 요청해 주세요.
          </p>
        )}
      </section>
      {startCard}
      <section
        className="staff-entry-card staff-entry-checklists"
        aria-labelledby="staff-checklists-title"
      >
        <div className="staff-entry-card__heading">
          <h2 id="staff-checklists-title">정비 항목 미리보기</h2>
        </div>
        {checklists.length === 0 ? (
          <div className="staff-entry-empty">
            <p>정비 항목이 아직 준비되지 않았습니다.</p>
            <p>관리자에게 체크리스트 설정을 요청해 주세요.</p>
          </div>
        ) : (
          <>
            {checklists.map((checklist) => (
              <StaffChecklistPreview
                key={`${checklist.id}:${checklist.version}`}
                checklist={checklist}
              />
            ))}
          </>
        )}
      </section>
    </>
  );
}
