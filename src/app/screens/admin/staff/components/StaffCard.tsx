import { Link } from 'react-router-dom';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import { AdminActivityBadge } from '../../components/AdminActivityBadge';

export function StaffCard({
  staff,
  href,
}: {
  staff: AdminStaffDto;
  href: string;
}) {
  const affiliation = [staff.company, staff.department]
    .filter(Boolean)
    .join(' · ');
  return (
    <article className="admin-directory-row">
      <div className="admin-directory-identity">
        <h2>{staff.name}</h2>
        <p className="admin-directory-muted">{affiliation || '소속 미등록'}</p>
      </div>
      <dl className="admin-directory-fields">
        <div>
          <dt>연락처</dt>
          <dd className={staff.phone ? undefined : 'admin-directory-muted'}>
            {staff.phone || '미등록'}
          </dd>
        </div>
        <div>
          <dt>담당 휴양소</dt>
          <dd
            className={
              staff.assignedProperties.length
                ? undefined
                : 'admin-directory-muted'
            }
          >
            {staff.assignedProperties.length
              ? `${staff.assignedProperties.length.toLocaleString('ko-KR')}곳`
              : '미배정'}
          </dd>
        </div>
      </dl>
      <AdminActivityBadge active={staff.isActive} />
      <Link
        className="admin-directory-detail"
        to={href}
        aria-label={`${staff.name} 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
