import { Link } from 'react-router-dom';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { AdminActivityBadge } from '../../components/AdminActivityBadge';

type PropertyCardProps = {
  property: AdminPropertyDto;
  detailHref: string;
};

export function PropertyCard({ property, detailHref }: PropertyCardProps) {
  return (
    <article className="admin-directory-row">
      <div className="admin-directory-identity">
        <h2>{property.name}</h2>
      </div>
      <dl className="admin-directory-fields">
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
                {property.staff.name}
                {!property.staff.isActive && (
                  <small className="admin-directory-muted">비활성 직원</small>
                )}
              </>
            ) : (
              <span className="admin-directory-muted">미배정</span>
            )}
          </dd>
        </div>
      </dl>
      <AdminActivityBadge active={property.isActive} />
      <Link
        className="admin-directory-detail"
        to={detailHref}
        aria-label={`${property.name} 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
