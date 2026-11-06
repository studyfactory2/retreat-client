import type { ReactNode } from 'react';
import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import { StaffIcon } from './StaffIcon';
import { StaffChecklistPreview } from './StaffChecklistPreview';

export function StaffHome({
  context,
  tasks,
  standalone,
}: {
  context: StaffQrContextDto;
  tasks: ReactNode;
  standalone: ReactNode;
}) {
  const { property, assignedStaff, checklists } = context;
  return (
    <>
      <section
        className="staff-entry-welcome"
        aria-labelledby="staff-home-title"
      >
        <div>
          {property.region && (
            <p className="staff-entry-region">
              <StaffIcon name="location" />
              {property.region}
            </p>
          )}
          <h1 id="staff-home-title">{property.name}</h1>
        </div>
        <div className="staff-entry-assignee">
          <span>담당 직원</span>
          <strong>{assignedStaff?.name ?? '미배정'}</strong>
        </div>
      </section>
      {tasks}
      <div className="staff-entry-tools">
        <details className="staff-entry-secondary">
          <summary>
            <StaffIcon name="record" />
            추가 정비 기록
          </summary>
          {standalone}
        </details>
        <details className="staff-entry-secondary">
          <summary id="staff-checklists-title">
            <StaffIcon name="checklist" />
            정비 항목 미리보기
          </summary>
          <section
            className="staff-entry-card staff-entry-checklists"
            aria-labelledby="staff-checklists-title"
          >
            {checklists.length === 0 ? (
              <div className="staff-entry-empty">
                <p>정비 항목이 아직 준비되지 않았습니다.</p>
                <p>관리자에게 체크리스트 설정을 요청해 주세요.</p>
              </div>
            ) : checklists.length === 1 ? (
              <StaffChecklistPreview checklist={checklists[0]} expanded />
            ) : (
              checklists.map((checklist) => (
                <StaffChecklistPreview
                  key={`${checklist.id}:${checklist.version}`}
                  checklist={checklist}
                />
              ))
            )}
          </section>
        </details>
      </div>
    </>
  );
}
