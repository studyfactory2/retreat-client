import { Link } from 'react-router-dom';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { AdminActivityBadge } from '../../components/AdminActivityBadge';

type PropertyCardProps = {
  property: AdminPropertyDto;
  detailHref: string;
};

export function PropertyCard({ property, detailHref }: PropertyCardProps) {
  return (
    <Link
      className="property-directory-row"
      to={detailHref}
      aria-label={`${property.name} 상세 보기`}
    >
      <div className="property-directory-identity">
        <span className="property-directory-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 21V5l8-3v19M12 7h8v14M2 21h20M7 7v2m0 3v2m0 3v2m9-8v2m0 3v2" />
          </svg>
        </span>
        <h3>{property.name}</h3>
      </div>
      <dl className="property-directory-facts">
        <div>
          <dt>지역</dt>
          <dd className={property.region ? undefined : 'admin-directory-muted'}>
            {property.region || '미등록'}
          </dd>
        </div>
        <div>
          <dt>담당 직원</dt>
          <dd>
            {property.staff ? (
              <>
                <span>{property.staff.name}</span>
                {!property.staff.isActive && (
                  <small className="property-directory-staff-status">비활성 직원</small>
                )}
              </>
            ) : (
              <span className="admin-directory-muted">미배정</span>
            )}
          </dd>
        </div>
      </dl>
      <AdminActivityBadge active={property.isActive} />
      <span className="property-directory-detail" aria-hidden="true">
        <span>상세</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
