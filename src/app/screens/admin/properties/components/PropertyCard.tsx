import { Link } from 'react-router-dom';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import '../styles/properties.css';

type PropertyCardProps = {
  property: AdminPropertyDto;
  detailHref: string;
};

export function PropertyCard({ property, detailHref }: PropertyCardProps) {
  return (
    <article className="property-card">
      <header className="property-card__heading">
        <span className="property-card__label">휴양소</span>
        <span
          className={`property-card__status${property.isActive ? '' : ' property-card__status--inactive'}`}
        >
          {property.isActive ? '활성' : '비활성'}
        </span>
      </header>
      <h2>{property.name}</h2>
      <p className="property-card__region">
        {property.region ?? '지역 미등록'}
      </p>

      <dl className="property-card__details">
        <div>
          <dt>차량번호 사전 등록</dt>
          <dd>{property.vehicleRegistrationEnabled ? '사용' : '사용 안 함'}</dd>
        </div>
        <div>
          <dt>담당 직원</dt>
          <dd>
            {property.staff ? (
              <>
                {property.staff.name}
                {!property.staff.isActive && (
                  <span className="property-card__staff-note">비활성 계정</span>
                )}
              </>
            ) : (
              <span className="property-card__unassigned">미배정</span>
            )}
          </dd>
        </div>
      </dl>

      <Link
        className="property-card__detail"
        to={detailHref}
        aria-label={`${property.name} 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
