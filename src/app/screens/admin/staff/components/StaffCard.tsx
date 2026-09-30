import { Link } from 'react-router-dom';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
export function StaffCard({
  staff,
  href,
}: {
  staff: AdminStaffDto;
  href: string;
}) {
  return (
    <article className="staff-card">
      <header className="staff-card__header">
        <span>담당 직원</span>
        <span
          className={`staff-badge${staff.isActive ? '' : ' staff-badge--inactive'}`}
        >
          {staff.isActive ? '활성' : '비활성'}
        </span>
      </header>
      <h2>{staff.name}</h2>
      <p className="staff-card__affiliation">
        {[staff.company, staff.department].filter(Boolean).join(' · ') ||
          '소속 미등록'}
      </p>
      <dl>
        <div>
          <dt>연락처</dt>
          <dd>{staff.phone || '미등록'}</dd>
        </div>
        <div>
          <dt>담당 휴양소</dt>
          <dd>
            {staff.assignedProperties.length
              ? `${staff.assignedProperties.length}곳`
              : '미배정'}
          </dd>
        </div>
      </dl>
      <Link
        className="staff-card__link"
        to={href}
        aria-label={`${staff.name} 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
