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
    <article className="staff-directory-row">
      <div className="staff-directory-identity">
        <span className="staff-directory-avatar" aria-hidden="true">
          {[...staff.name.trim()][0] || '직'}
        </span>
        <div>
          <h3>{staff.name}</h3>
          <p>{affiliation || '소속 미등록'}</p>
        </div>
      </div>
      <dl className="staff-directory-facts">
        <div>
          <dt>연락처</dt>
          <dd
            className={`staff-directory-contact${staff.phone ? '' : ' admin-directory-muted'}`}
          >
            {staff.phone || (
              <>
                <span className="staff-directory-mobile-context">연락처 </span>
                미등록
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>담당 휴양소</dt>
          <dd
            className={
              staff.assignedProperties.length
                ? 'staff-directory-properties'
                : 'admin-directory-muted'
            }
          >
            {staff.assignedProperties[0] ? (
              <>
                <span>{staff.assignedProperties[0].name}</span>
                {!staff.assignedProperties[0].isActive && (
                  <small>비활성</small>
                )}
                {staff.assignedProperties.length > 1 && (
                  <span className="staff-directory-more">
                    외 {(staff.assignedProperties.length - 1).toLocaleString('ko-KR')}곳
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="staff-directory-mobile-context">휴양소 </span>
                미배정
              </>
            )}
          </dd>
        </div>
      </dl>
      <AdminActivityBadge active={staff.isActive} />
      <Link
        className="staff-directory-detail"
        to={href}
        aria-label={`${staff.name} 상세 보기`}
      >
        <span>상세</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </Link>
    </article>
  );
}
