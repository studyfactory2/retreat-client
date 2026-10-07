import { appRoutes } from '../../../../core/router/routes';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-management-card.css';

type Props = {
  property: AdminPropertyDto;
  disabled: boolean;
  onNavigate: (url: string) => void;
};

const actions = [
  { label: '담당 직원 관리', route: appRoutes.adminPropertyStaff },
  { label: 'QR 관리', route: appRoutes.adminPropertyQr },
  { label: '체크리스트 관리', route: appRoutes.adminPropertyChecklists },
  { label: '이용 안내 관리', route: appRoutes.adminPropertyGuide },
];

export function PropertyManagementCard({
  property,
  disabled,
  onNavigate,
}: Props) {
  return (
    <section className="property-management-card" aria-label="휴양소 운영 관리">
      <dl className="property-management-card__staff">
        <dt>담당 직원</dt>
        <dd>
          <strong>{property.staff?.name ?? '미배정'}</strong>
          {property.staff && !property.staff.isActive && (
            <span className="property-management-card__inactive">비활성</span>
          )}
        </dd>
      </dl>
      <div className="property-management-card__actions">
        {actions.map(({ label, route }) => (
          <Button
            key={route}
            className="admin-button-secondary property-management-card__action"
            disabled={disabled}
            onClick={() => onNavigate(route.replace(':id', property.id))}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
