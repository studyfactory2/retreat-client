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
        <p className="staff-entry-welcome__greeting">정비 전, 확인해 주세요.</p>
        <p className="staff-entry-welcome__description">
          휴양소의 담당 직원과 정비 항목을 확인할 수 있습니다.
        </p>
      </section>

      <section
        className="staff-entry-card staff-entry-assignee"
        aria-labelledby="staff-assignee-title"
      >
        <h2 id="staff-assignee-title">담당 직원</h2>
        {assignedStaff ? (
          <>
            <p className="staff-entry-assignee__name">{assignedStaff.name}</p>
            <p className="staff-entry-hint">
              휴양소에 지정된 담당 직원입니다. 이 QR만으로 실제 작업자를
              확인하지는 않습니다.
            </p>
          </>
        ) : (
          <div className="staff-entry-empty">
            <p>현재 안내할 담당 직원이 없습니다.</p>
            <p>관리자에게 담당 직원 배정을 문의해 주세요.</p>
          </div>
        )}
      </section>

      <section
        className="staff-entry-card staff-entry-checklists"
        aria-labelledby="staff-checklists-title"
      >
        <div className="staff-entry-card__heading">
          <h2 id="staff-checklists-title">정비 체크리스트</h2>
          <span className="staff-entry-badge">읽기 전용</span>
        </div>
        {checklists.length === 0 ? (
          <div className="staff-entry-empty">
            <p>현재 확인할 수 있는 정비 체크리스트가 없습니다.</p>
            <p>관리자에게 체크리스트 설정을 문의해 주세요.</p>
          </div>
        ) : (
          <>
            <p className="staff-entry-hint staff-entry-checklists__intro">
              현재 설정된 항목을 미리 볼 수 있습니다. 체크리스트가 있다는 것은
              정비가 시작되거나 완료되었다는 뜻이 아닙니다.
            </p>
            {checklists.map((checklist) => (
              <StaffChecklistPreview
                key={`${checklist.id}:${checklist.version}`}
                checklist={checklist}
              />
            ))}
          </>
        )}
      </section>
      {startCard}
      <aside className="staff-entry-note">
        <StaffIcon name="notice" />
        <p>
          위 항목은 시작 전 미리보기입니다. 정비 시작 후 발급되는 개인 작성
          화면에서 답변을 입력하고 임시 저장할 수 있습니다.
        </p>
      </aside>
    </>
  );
}
